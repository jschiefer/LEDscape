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

//
//

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

	.macro PAUSE_NS
	.mparam ns
	MOV r_sleep_counter, (ns/10)-1
l:
	SUB r_sleep_counter, r_sleep_counter, 1
	QBNE l, r_sleep_counter, 0
	.endm


// Assumes that gpio mask registers and gpio zero register are all set up. 

.macro SEND_BIT_TO_GPIO_BANK
	.mparam gpio_addr,mask_const,zerobits_reg
	MOV r_gpio_temp_addr, gpio_addr | GPIO_SETDATAOUT;  	
	MOV r_gpio_temp_mask, mask_const; 	
	SBBO r_gpio_temp_mask , r_gpio_temp_addr , 0, 4;			
	PAUSE_NS 300;								

	MOV r_gpio_temp_addr, gpio_addr | GPIO_CLEARDATAOUT;  	
	SBBO zerobits_reg , r_gpio_temp_addr , 0, 4;	
	PAUSE_NS 200;								

	MOV r_gpio_temp_mask, mask_const; 	
	SBBO r_gpio_temp_mask , r_gpio_temp_addr , 0, 4;
.endm


.macro SEND_PULSE_TO_GPIO_BANK
	.mparam gpio_addr,mask_const
	MOV r_gpio_temp_addr, gpio_addr | GPIO_SETDATAOUT;  	
	MOV r_gpio_temp_mask, mask_const; 	
	SBBO r_gpio_temp_mask , r_gpio_temp_addr , 0, 4;			
	PAUSE_NS 50;								

	MOV r_gpio_temp_addr, gpio_addr | GPIO_CLEARDATAOUT;  	
	SBBO r_gpio_temp_mask , r_gpio_temp_addr , 0, 4;	
.endm



/*
#define SEND_LED_BIT_ARRAY_TO_GPIO_BANK(gpio_addr,mask_const,zerobits_reg) 					\
	MOV r_gpio_temp_addr, CONCAT2( GPIO , bank) | GPIO_SETDATAOUT;  	\
	MOV r_gpio_temp_mask, CONCAT3( pru0_gpio , bank ,  _all_mask ); 	\
	SBBO r_gpio_temp_mask , r_gpio_temp_addr , 0, 4;			\
	PAUSE_NS 400;								\
	MOV r_gpio_temp_addr, CONCAT2( GPIO , bank) | GPIO_CLEARDATAOUT;  	\
	SBBO CONCAT3( r_gpio , bank ,  _zeros ) , r_gpio_temp_addr , 0, 4;	\
	PAUSE_NS 200;								\
	MOV r_gpio_temp_mask, CONCAT3( pru0_gpio , bank ,  _all_mask ); 	\
	SBBO r_gpio_temp_mask , r_gpio_temp_addr , 0, 4;
*/

	

						
		// Load the gpio address registers with the address that sets a bit when written to	\
		// so when we write a 1 the pins will go high 						\
		// PREP_GPIO_ADDR_FOR_SET whichbank 							\
		//MOV CONCAT3(r_gpio , bank , _addr), GPIO0 | GPIO_SETDATAOUT; 
	

		.macro XXX
		// load the mask register with 1s where ever there is a pin that we control
		// We can not just send 1s on all gpios becuase other applications might be using other ones. 
		//PREP_A_GPIO_MASK_NAMED whichbank , all

		// OK, everything is ready for us to send the start of all the bits

		// Wait until T1L to make sure previuous bit is done. 

		// send high on all pins we controll 
		//APPLY_GPIO_TO_ADDR mask , whichbank 

		// All bits are now high

		// Get ready to drive the outputs low whenever we write a 1 bit to the address regerster
		//PREP_GPIO_ADDR_FOR_CLEAR whichbank 

		// Wait for T0H
		//WAITNS 350, LOOP1

		// Now we go low on any bits that are 0. These will be set as 1 in the "zeros" registers
		// by code that runs on each pass in an enclosing loop that calls this macro. 

		// The 1 bits stay high
		//APPLY_GPIO_TO_ADDR zeros , whichbank 


		// Now wait for T1H
		//WAITNS 600, LOOP2


		// And finally set all outputs to low
		//APPLY_GPIO_TO_ADDR mask  , whichbank 
		.endm


START:


	// Enable OCP master port
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

	// Reset the cycle timer
	// Doing tyhis here means that the first bit out will have to wait, but 
	// this gives us lots of time to work on each subsequent cycle
	RESET_COUNTER

// Check wea re the right PRU

	MOV r1, PRU_NUM
	QBNE we_are_pru0 , r1 , 1
	
	HALT

we_are_pru0:




l_word_loop:
	// for bit in 24 to 0
	MOV r_bit_num, 24

	l_bit_loop:
		DECREMENT r_bit_num

		// Load 16 registers of data, starting at r10
		//LOAD_CHANNEL_DATA(24, 0, 16)

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
		//LOAD_CHANNEL_DATA(24, 16, 8)
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


loopy:

		//SEND_BIT_TO_GPIO_BANK GPIO0, pru0_gpio0_all_mask, r_gpio0_zeros

		SEND_PULSE_TO_GPIO_BANK GPIO0, pru0_gpio0_all_mask


/*
		//SEND_LED_BIT_ARRAY_TO_GPIO_BANK( 3 )
		SEND_LED_BIT_ARRAY_TO_GPIO_BANK( 2 )
		SEND_LED_BIT_ARRAY_TO_GPIO_BANK( 1 )
		SEND_LED_BIT_ARRAY_TO_GPIO_BANK( 0 )
		SEND_LED_BIT_ARRAY_TO_GPIO_BANK( 0 )

		SEND_LED_BIT_ARRAY_TO_GPIO_BANK( 0 )
		SEND_LED_BIT_ARRAY_TO_GPIO_BANK( 1 )
		SEND_LED_BIT_ARRAY_TO_GPIO_BANK( 2 )
*/
		PAUSE_NS 10000		


		jmp loopy

		//HALT
				
		// That group of bits is done, so start counting now for the next bit. THis gives us time
		// to do stuff in between bit when timing is not critical
		//RESET_COUNTER

		// The one bits are lowered in the next iteration of the loop
		QBNE l_bit_loop, r_bit_num, 0

	// The RGB streams have been clocked out
	// Move to the next pixel on each row
	ADD r_data_addr, r_data_addr, 48 * 4
	DECREMENT r_data_len
	QBNE l_word_loop, r_data_len, #0

FRAME_DONE:

	// When we get here all bits have transmitted and all outputs are low.

	// Delay at least 300 usec; this is the required reset
	// time for the LED strip to update with the new pixels.	
	SLEEPNS 300000

	// Write out that we are done!
	// Store a non-zero response in the buffer so that they know that we are done
	// aso a quick hack, we write the counter so that we know how
	// long it took to write out.
	MOV r8, PRU_CONTROL_ADDRESS // control register
	LBBO r2, r8, 0xC, 4
	SBCO r2, CONST_PRUDRAM, 12, 4

	// Go back to waiting for the next frame buffer
	QBA _LOOP

EXIT:
	// Write a 0xFF into the response field so that they know we're done
	MOV r2, #0xFF
	SBCO r2, CONST_PRUDRAM, 12, 4

	RAISE_ARM_INTERRUPT

	HALT
