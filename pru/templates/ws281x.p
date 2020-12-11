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


START:

	// Enable OCP master port. This lets the PRU get to the gpio bank registers in the ARM memory space. 
	// clear the STANDBY_INIT bit in the SYSCFG register,
	// otherwise the PRU will not be able to write outside the
	// PRU memory space and to the BeagleBon's pins.
	LBCO	r0, C4, 4, 4
	CLR	r0, r0, 4
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

	// Wait for the start condition from the main program to indicate
	// that we have a rendered frame ready to clock out.  This also
	// handles the exit case if an invalid value is written to the start


	// start position.
_LOOP:

	// Let ledscape know that we're starting the loop again. It waits for this
	// interrupt before sending another frame
	RAISE_ARM_INTERRUPT

	// This bit here loads the data from the API structure into ...
	// r_data_addr (r0) 	= pointer to the array of pixel data
	// r_data_len  (r1) 	= number of 48 byte rows in the pixel array above
	// r2			= API command where any non-zero tells us to start sending pixels
	LBCO      r_data_addr, CONST_PRUDRAM, 0, 12

	// Wait for a non-zero command
	QBEQ _LOOP, r2, #0

	// Zero out the start command in the shared RAM so that they know we have received it
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

	MOV r3, PRU_NUM
	QBNE SKIP_EVERYTHING , r3 , 0
	
	// If we get here then we are running on PRU0 and we will be doing all the 
	// pin twiddling

l_word_loop:

	// Load the channels 0-7 from DDR RAM into data registers 0-7. We will keep them here for the
	// next 24 bit passes to avoid having to go back to DDR which is very slow. 

	LBBO r_data0 , r_data_addr , 0 * 4 , 8*4;		// Start filling registers at r_data0, copy from r_data_addr, offset 0 from addr , total of 8 words
	
	// for bit in 23 to 0
	MOV r_bit_num, 24

	l_bit_loop:
		DECREMENT r_bit_num

		// Zero out the registers
		// r_gpioX_zeros = 0x00
		RESET_GPIO_ZEROS()

		// TEST_BIT_ZERO will set the apropriate bit in the correct _zeros register if that data bit is 0. 
		// Uses r_bit_num 

		// First we do the channels 0-7 that we already have loaded into data registers 0-7...

		TEST_BIT_ZERO(r_data0,  0)
		TEST_BIT_ZERO(r_data1,  1)
		TEST_BIT_ZERO(r_data2,  2)
		TEST_BIT_ZERO(r_data3,  3)
		TEST_BIT_ZERO(r_data4,  4)
		TEST_BIT_ZERO(r_data5,  5)
		TEST_BIT_ZERO(r_data6,  6)
		TEST_BIT_ZERO(r_data7,  7)

		// We do not have enough registers to keep all channels loaded into registers, so we 
		// have to keep swapping data registers 8-15 to process all the channels.

		// channels 8-15 into data registers 8-15
		LBBO r_data8 , r_data_addr , 8 * 4 , 8*4;		// Start filling registers at r_data8, copy from r_data_addr, offset from addr , total of 8 words
		
		TEST_BIT_ZERO(r_data8,  8)
		TEST_BIT_ZERO(r_data9,  9)
		TEST_BIT_ZERO(r_data10, 10)
		TEST_BIT_ZERO(r_data11, 11)
		TEST_BIT_ZERO(r_data12, 12)
		TEST_BIT_ZERO(r_data13, 13)
		TEST_BIT_ZERO(r_data14, 14)
		TEST_BIT_ZERO(r_data15, 15)

		// channels 16-23 into data registers 8-15
		// note that this covers channels 8-15 in r_data8-15 so we will 
		// have to reload those next pass though. 
		// channels 16-23 into data registers 8-15
		LBBO r_data8 , r_data_addr , 16 * 4 , 8*4;		// Start filling registers at r_data8, copy from r_data_addr, offset from addr , total of 8 words
		
		// Test some more bits to pass the time
		TEST_BIT_ZERO(r_data8, 16)
		TEST_BIT_ZERO(r_data8, 17)
		TEST_BIT_ZERO(r_data10, 18)
		TEST_BIT_ZERO(r_data11, 19)
		TEST_BIT_ZERO(r_data12, 20)
		TEST_BIT_ZERO(r_data13, 21)
		TEST_BIT_ZERO(r_data14, 22)
		TEST_BIT_ZERO(r_data15, 23)

		// OK, now all the gpio_zeros have a 1 for each GPIO bit that should be set to 0 in the middle of this signal

/*		
		// TESTING
		MOV r_gpio0_zeros , 0xffffffff
		MOV r_gpio1_zeros , 0xffffffff
		MOV r_gpio2_zeros , 0xffffffff
		MOV r_gpio3_zeros , 0x00000000
*/
		

		// The *_all_mask constants have a 1 bit for each pin that we should control. We can not just
		// muck will all the pins in each gpio bank since other stuff might be using those other pins. 

		// Load up 1's for all the pins that ledscape controls in each gpio bank
		MOV r_gpio0_mask, pru0_gpio0_all_mask; 
		MOV r_gpio1_mask, pru0_gpio1_all_mask; 
		MOV r_gpio2_mask, pru0_gpio2_all_mask; 
		MOV r_gpio3_mask, pru0_gpio3_all_mask; 

		MOV r_gpio0_addr, GPIO0 + GPIO_CLEARDATAOUT; 
		MOV r_gpio1_addr, GPIO1 + GPIO_CLEARDATAOUT; 
		MOV r_gpio2_addr, GPIO2 + GPIO_CLEARDATAOUT; 
		MOV r_gpio3_addr, GPIO3 + GPIO_CLEARDATAOUT;

		// The SBBO instruction lets us specify an address offset so we can save some
		// time by loading the lower of the two set/clear addresses into a register and then 
		// using the idfferent to the higer one as an offset. Wouldn't it be cleaner to use
		// the base address as the base and the set/clear offsets directly? Yes, but the 
		// SBBO offset is not big enough to hold the full set/clear offsets. 
		// Note that clear is at 0x190 and set is at 0x194 so clear is lower so we use that as base. 
		#define  c_cleardataout_offset  (0)
		#define  c_setdataout_offset  	(GPIO_SETDATAOUT - GPIO_CLEARDATAOUT )

		// SET all masked outputs high on all pins we control
		// Both zero and one data bit waveforms start with pin going high 

		SBBO r_gpio0_mask , r_gpio0_addr ,  c_setdataout_offset  , 4;
		SBBO r_gpio1_mask , r_gpio1_addr ,  c_setdataout_offset  , 4;
		SBBO r_gpio2_mask , r_gpio2_addr ,  c_setdataout_offset  , 4;
		SBBO r_gpio3_mask , r_gpio3_addr ,  c_setdataout_offset  , 4;

		// Do more redundant memory writes to delay for T0H (200ns-500ns, we hit at 200ns to be fast)
		// Seems like doing writes across the interconnect here help block other initiators from
		// jumpping in and potentially blocking us

		//SBBO r_gpio0_mask , r_gpio0_addr ,  c_setdataout_offset  , 4;
		//SBBO r_gpio1_mask , r_gpio1_addr ,  c_setdataout_offset  , 4;

		SBBO r_gpio0_zeros , r_gpio0_addr ,  c_cleardataout_offset  , 4;
		SBBO r_gpio1_zeros , r_gpio1_addr ,  c_cleardataout_offset  , 4;
		SBBO r_gpio2_zeros , r_gpio2_addr ,  c_cleardataout_offset  , 4;
		SBBO r_gpio3_zeros , r_gpio3_addr ,  c_cleardataout_offset  , 4;

		// Do more redundant memory writes to delay for T1H (250ns-5500ns longer than T0H, we hit at 250ns to be fast)
		// Seems like doing writes across the interconnect here help block other initiators from
		// jumpping in and potentially blocking us

		//SBBO r_gpio0_zeros , r_gpio0_addr ,  c_cleardataout_offset  , 4;
		//SBBO r_gpio1_zeros , r_gpio1_addr ,  c_cleardataout_offset  , 4;

		SBBO r_gpio0_mask , r_gpio0_addr ,  c_cleardataout_offset  , 4;
		SBBO r_gpio1_mask , r_gpio1_addr ,  c_cleardataout_offset  , 4;
		SBBO r_gpio2_mask , r_gpio2_addr ,  c_cleardataout_offset  , 4;
		SBBO r_gpio3_mask , r_gpio3_addr ,  c_cleardataout_offset  , 4;

		// Wait TLD. This is the time between sequential bits
		// Loading the pixel data and setting the *_zerobits takes long enough that 
		// we do not need a explcit delay here. 


		// Next iteration of the 24 bit loop
		QBNE l_bit_loop, r_bit_num, 0

	// The RGB streams have been clocked out
	// Move to the next pixel on each row
	// 48 strings per cycle, 4 bytes per pixel (stored RGBW, but we here ignore the W)
	ADD r_data_addr, r_data_addr, 48 * 4
	DECREMENT r_data_len
	QBNE l_word_loop, r_data_len, #0

FRAME_DONE:

	// When we get here all bits have transmitted and all outputs are low.

	// Delay at least 300 usec; this is the required reset
	// time for the LED strip to update with the new pixels.	

	// Time TLL - latch data time
	PAUSE_NS 300000

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
