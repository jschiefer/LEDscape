// WS281x Signal Generation PRU Program Template
//
// Drives up to 24 strips using a single PRU. LEDscape (in userspace) writes rendered frames into shared DDR memory
// and sets a flag to indicate how many pixels are to be written.  The PRU then bit bangs the signal out the
// 24 GPIO pins and sets a "complete" flag.
//
// To stop, the ARM can write a 0xFF to the command, which will cause the PRU code to exit.
//
// At 800 KHz the ws281x signal is:
//  ____
// |  | |______|
// 0  250 600  1250 offset
//    250 350   650 delta
//
// each pixel is stored in 4 bytes in the order GRBA (4th byte is ignored)
//
// while len > 0:
//    for bit# = 23 down to 0:
//        write out bits
//    increment address by 32
//
// We are called with a struct in PRU shared RAM that looks like this...
//
// {
//	// in the DDR shared with the PRU
//	const uintptr_t pixels_dma;
//
//	// Length in pixels of the longest LED strip.
//	unsigned num_pixels;
//
//	// write 1 to start, 0xFF to abort. will be cleared when started
//	volatile unsigned command;
//
//	// will have a non-zero response written when done
//	volatile unsigned response;
//  }
//
//  This struct is 4 unsigned * 4 bytes/unsigned = 16 bytes long

.origin 0
.entrypoint START



#include "common.p.h"


// Send one full bit to the specified gpio bank (0-3)
// Handles all the timing except...
// 1. Timing between the end of the bit on the last bank and the start of the bit in the next bit of the 1st bank
//     -This is assumed to be long enough between sets of calls
// 2. Reset timing at the end of all bits. 
//     -This is handled at the end of the frame after all bit are sent

// Note that we need this becuase we have to handle each bank seporately. If we try to send all the bit starts on 
// all the banks and then send all the bit stops on all the banks we find that occasionally the delays are long enough
// that the bits get streach so that 0 bits get turned into 1 bits which causes white flashes on the display.
// This technique takes a little longer per frame, but every bit is always correct.


// Pause nanoseconds by spinning in place
// Only accurate to next lowest ns multipule of 10 so 296ns will spin for 290ns and 300ns will spin for 300ns. 
// Rewitten here as a macro becuase (unlike #defines) macros have local label scope
// so we do not have to worry about specifying (or messing up) labels on each use. 

	.macro PAUSE_NS
	.mparam ns
	MOV r_sleep_counter, (ns/10)-1		// each loop iteration is 2 cycles, each cycle is 5ns (200Mhz). 1 cycle for this MOV. 
l:
	SUB r_sleep_counter, r_sleep_counter, 1
	QBNE l, r_sleep_counter, 0
	.endm


// Assumes that gpio mask registers and gpio zero register are all set up. 
// FOR TESTING
.macro SEND_BIT_TO_GPIO_BANK
	.mparam gpio_addr,mask_const,zerobits_reg
	MOV r_gpio_temp_addr, gpio_addr | GPIO_SETDATAOUT;  	
	MOV r_gpio_temp_mask, mask_const; 	
	SBBO r_gpio_temp_mask , r_gpio_temp_addr , 0, 4;			
	PAUSE_NS 200;								

	MOV r_gpio_temp_addr, gpio_addr | GPIO_CLEARDATAOUT;  	
	SBBO zerobits_reg , r_gpio_temp_addr , 0, 4;	
	PAUSE_NS 200;								

	MOV r_gpio_temp_mask, mask_const; 	
	SBBO r_gpio_temp_mask , r_gpio_temp_addr , 0, 4;
.endm



// FOR TESTING 
.macro SEND_PULSE_TO_GPIO_BANK
	.mparam gpio_addr,mask_const
	MOV r_gpio0_addr, gpio_addr | GPIO_SETDATAOUT;  	
	MOV r_gpio1_addr, gpio_addr | GPIO_CLEARDATAOUT; 
//	MOV r_gpio0_addr, gpio_addr ;  	
//	MOV r_gpio1_addr, gpio_addr ; 


	MOV r_gpio_temp_mask, mask_const; 

//	LBBO r_temp1, r_gpio0_addr, 0 , 4
//	LBBO r_temp1, r_gpio1_addr, 0 , 4

	//MOV r_temp1, 0x00
	//SBBO r_temp1 , r_gpio0_addr , 0, 4;	
	//SBBO r_temp1 , r_gpio1_addr , 0, 4;	


	//MOV r_temp1, 0x8000000
//	MOV r_temp1, 0x8000008

//	AND r_gpio_temp_mask , r_gpio_temp_mask , r_temp1

	MOV r_gpio_temp_mask , 1<<25 | 1 << 9 | 1 <<3 ;

//	MOV r_gpio_temp_mask , 1<<3 ;


//	MOV r_gpio_temp_mask , 0x08


	SBBO r_gpio_temp_mask , r_gpio0_addr , 0 , 4;			

	PAUSE_NS 250;

	SBBO r_gpio_temp_mask , r_gpio1_addr , 0 , 4;	

	PAUSE_NS 2000;


.endm


START:

	// Enable OCP master port. This lets the PRU get to the gpio bank registers in the ARM memory space. 
	// clear the STANDBY_INIT bit in the SYSCFG register,
	// otherwise the PRU will not be able to write outside the
	// PRU memory space and to the BeagleBon's pins.
	LBCO	r0, C4, 4, 4
	CLR		r0, r0, 4
	SBCO	r0, C4, 4, 4

	// Configure the programmable pointer register for PRU0 by setting
	// c28_pointer[15:0] field to 0x0120.  This will make C28 point to
	// 0x00012000 (PRU shared RAM).
	MOV		r0, 0x00000120
	MOV		r1, CTPPR_0
	ST32	r0, r1

	// Configure the programmable pointer register for PRU0 by setting
	// c31_pointer[15:0] field to 0x0010.  This will make C31 point to
	// 0x80001000 (DDR memory).
	MOV		r0, 0x00100000
	MOV		r1, CTPPR_1
	ST32	r0, r1

	// Write a 0x1 into the response field so that they know we have started
	MOV r2, #0x1
	SBCO r2, CONST_PRUDRAM, 12, 4


	MOV r20, 0xFFFFFFFF

	// Wait for the start condition from the main program to indicate
	// that we have a rendered frame ready to clock out.  This also
	// handles the exit case if an invalid value is written to the start
	// start position.
_LOOP:
	// Let ledscape know that we're starting the loop again. It waits for this
	// interrupt before sending another frame
	RAISE_ARM_INTERRUPT

	// Load the pointer to the buffer from PRU DRAM into r0 and the
	// length (in bytes-bit words) into r1.
	// start command into r2
	LBCO      r_data_addr, CONST_PRUDRAM, 0, 12

	// Wait for a non-zero command
	QBEQ _LOOP, r2, #0

	// Zero out the start command so that they know we have received it
	// This allows maximum speed frame drawing since they know that they
	// can now swap the frame buffer pointer and write a new start command.
	MOV r3, 0
	SBCO r3, CONST_PRUDRAM, 8, 4

	// Command of 0xFF is the signal to exit
	QBEQ EXIT, r2, #0xFF

	// Reset the cycle counter. We use this at the end of the frame to report back to the 
	// caller how many cycles it took us to send the last frame.
	RESET_COUNTER;


	// Check we are the right PRU otherwise
	// we will have mutlipule PRUs running the exact smae code competing with
	// each other for access to the OCP bus which is bad becuase then you occasionally
	// get glitches when one PRU access comes after the other becuase of a L3/L4 delay. 

	MOV r1, PRU_NUM
	QBNE SKIP_EVERYTHING , r1 , 0
	
	// If we get here then we are running on PRU0 and we will be doing all the 
	// pin twiddling

l_word_loop:
	// for bit in 24 to 0
	MOV r_bit_num, 24

	l_bit_loop:
		DECREMENT r_bit_num

		// Load 16 registers of data, starting at r10
		LOAD_CHANNEL_DATA(24, 0, 16)

		// Zero out the registers
		// r_gpioX_zeros = 0x00
		RESET_GPIO_ZEROS()

		// TEST_BIT_ZERO will set the apropriate bit in the correct _zeros register if that data bit is 0. 

		TEST_BIT_ZERO(r_data0,  0)
		TEST_BIT_ZERO(r_data1,  1)
		TEST_BIT_ZERO(r_data2,  2)
		TEST_BIT_ZERO(r_data3,  3)
		TEST_BIT_ZERO(r_data4,  4)
		TEST_BIT_ZERO(r_data5,  5)
		TEST_BIT_ZERO(r_data6,  6)
		TEST_BIT_ZERO(r_data7,  7)

		TEST_BIT_ZERO(r_data8,  8)
		TEST_BIT_ZERO(r_data9,  9)
		TEST_BIT_ZERO(r_data10, 10)
		TEST_BIT_ZERO(r_data11, 11)
		TEST_BIT_ZERO(r_data12, 12)
		TEST_BIT_ZERO(r_data13, 13)

		TEST_BIT_ZERO(r_data14, 14)
		TEST_BIT_ZERO(r_data15, 15)

		// Load 8 more registers of data
		LOAD_CHANNEL_DATA(24, 16, 8)
		// Data loaded

		// Test some more bits to pass the time
		TEST_BIT_ZERO(r_data0, 16)
		TEST_BIT_ZERO(r_data1, 17)
		TEST_BIT_ZERO(r_data2, 18)
		TEST_BIT_ZERO(r_data3, 19)
		TEST_BIT_ZERO(r_data4, 20)
		TEST_BIT_ZERO(r_data5, 21)
		TEST_BIT_ZERO(r_data6, 22)
		TEST_BIT_ZERO(r_data7, 23)

		// OK, now all the gpio_zeros have a 1 for each GPIO bit that should be set to 0 in the middle of this signal

		//MOV r_gpio0_zeros , 0xffffffff
		//MOV r_gpio1_zeros , 0x00000000
		//MOV r_gpio2_zeros , 0x00 | 1<<25
		//MOV r_gpio3_zeros , 0x00000000

		// SBBO can take a fixed offset to the address, so we load our addresses regisrters
		// with the address of the lower address (the CLEAR) and then offet from that to get the 
		// higher one (the SET). This save 4 loads.

		MOV r_gpio0_addr, GPIO0 | GPIO_CLEARDATAOUT; 
		MOV r_gpio1_addr, GPIO1 | GPIO_CLEARDATAOUT; 
		MOV r_gpio2_addr, GPIO2 | GPIO_CLEARDATAOUT; 
		MOV r_gpio3_addr, GPIO3 | GPIO_CLEARDATAOUT; 

		// The *_all_mask constants have a 1 bit for each pin that we should control. We can not just
		// muck will all the pins in each gpio bank since other stuff might be using those other pins. 

		// Load up 1's for all the pins that ledscape controls in each gpio bank
		MOV r_data0, pru0_gpio0_all_mask; 
		MOV r_data1, pru0_gpio1_all_mask; 
		MOV r_data2, pru0_gpio2_all_mask; 
		MOV r_data3, pru0_gpio3_all_mask; 

		// SET all masked outputs high on all pins we control
		// Both zero and one data bit waveforms start with pin going high 
		SBBO r_data0 , r_gpio0_addr , GPIO_SETDATAOUT - GPIO_CLEARDATAOUT , 4;
		SBBO r_data1 , r_gpio1_addr , GPIO_SETDATAOUT - GPIO_CLEARDATAOUT , 4;			
		SBBO r_data2 , r_gpio2_addr , GPIO_SETDATAOUT - GPIO_CLEARDATAOUT , 4;
		SBBO r_data3 , r_gpio3_addr , GPIO_SETDATAOUT - GPIO_CLEARDATAOUT , 4;			

		// Wait T0H. This is the width of a 0 bit in the waveform going out the pins
		PAUSE_NS 250;

		// CLEAR the output (make pin low) that has bit set in zeros
		// These will make this output waveform go low, making it into a short zero pulse
		// Note that the *_zeros registers we set above based on the pixel data that was passed to
		// us from the userspace process
		SBBO r_gpio0_zeros , r_gpio0_addr , 0 , 4;			
		SBBO r_gpio1_zeros , r_gpio1_addr , 0 , 4;	
		SBBO r_gpio2_zeros , r_gpio2_addr , 0 , 4;			
		SBBO r_gpio3_zeros , r_gpio3_addr , 0 , 4;	

		// Wait T1H-T0H. The pins that did not get set low directly above are still hight, so 
		// so leaving them high this additional time will make a 1 bit in the datastream waveform.
		PAUSE_NS 250;
		
		// CLEAR all masked outputs (all pins we control set low).
		// Both zero and one data bit waveforms end with pin going low. 
		// This is the end of the waveform for the current bit. 
		// Pins that are alreday low just stay low. 
		SBBO r_data0 , r_gpio0_addr , 0 , 4;			
		SBBO r_data1 , r_gpio1_addr , 0 , 4;	
		SBBO r_data2 , r_gpio2_addr , 0 , 4;			
		SBBO r_data3 , r_gpio3_addr , 0 , 4;	

		// Wait TLD. THis is the time between sequential bits
		//PAUSE_NS 450;

		// Next iteration of the 24 bit loop
		QBNE l_bit_loop, r_bit_num, 0

	// The RGB streams have been clocked out
	// Move to the next pixel on each row
	// 48 strings per cycle, 4 bytes per pixel (stored RGBW, but we here ignore the W)
	ADD r_data_addr, r_data_addr, 48 * 4
	DECREMENT r_data_len
	//QBNE l_word_loop, r_data_len, #0

FRAME_DONE:

	// When we get here all bits have transmitted and all outputs are low.

	// Delay at least 300 usec; this is the required reset
	// time for the LED strip to update with the new pixels.	
	PAUSE_NS 30000

SKIP_EVERYTHING:

	// Write out that we are done!
	// Store a non-zero response in the buffer so that they know that we are done
	// aso a quick hack, we write the counter so that we know how
	// long it took to write out.
	MOV r8, PRU_CONTROL_ADDRESS // control register
	LBBO r2, r8, 0xC, 4
	SBCO r2, CONST_PRUDRAM, 12, 4


	// Write a 0x01 into the response field so that they know we're done with this frame
	MOV r2, #0x01
	SBCO r2, CONST_PRUDRAM, 12, 4

	// Go back to waiting for the next frame buffer
	QBA _LOOP

EXIT:
	// Write a 0xFF into the response field so that they know we're done
	MOV r2, #0xFF
	SBCO r2, CONST_PRUDRAM, 12, 4

	RAISE_ARM_INTERRUPT

	HALT
