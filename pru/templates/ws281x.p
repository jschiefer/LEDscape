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

// Mapping lookup

.origin 0
.entrypoint START

#include "common.p.h"

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

		// Load the gpio address registers with the address that sets a bit when written to		
		PREP_GPIO_ADDRS_FOR_SET()
		PREP_GPIO_MASK_NAMED(all)

		// OK, everything is ready for us to send the start of all the bits

		// Wait until T1L to make sure previuous bit is done. 

		//WAITNS 600, wait_T1L_time

		RESET_COUNTER	
		GPIO_APPLY_MASK_TO_ADDR()	

		//APPLY_GPIO_MASK_TO_ADDR( 0 )
		// All bits are now high

		// Get ready to drive the 0 outputs low
		PREP_GPIO_ADDRS_FOR_CLEAR()

		// Wait for T0H
		WAITNS 350, LOOP1

		// Now we go low on any bits that are 0
		// The 1 bits stay high
		GPIO_APPLY_ZEROS_TO_ADDR()	

		// Now wait for T1H
		WAITNS 600, LOOP2

		// And finally set all outputs to low
		GPIO_APPLY_MASK_TO_ADDR()

/*
		PREP_GPIO_ADDRS_FOR_SET()
		GPIO_APPLY_MASK_TO_ADDR()		

		// Now get ready to make all the 0 bits go low

		PREP_GPIO_ADDRS_FOR_CLEAR()
		// Remeber that the _zeros already have a 1 everywhere where we need to clear the output put

		// Ok, now we will wait until T0H it is time for the 0 bits to go low...

		WAITNS 600+350, wait_T0H_time

		GPIO_APPLY_ZEROS_TO_ADDR()
		// OK, now the pins that are getting a data 1 are still high
		// next we will make all these pins go low by putting the mask on the CLEAR bits

		PREP_GPIO_ADDRS_FOR_CLEAR()

		// OK, now we will wait until T1H until it is time for the 1 bits (the rest) to go low....

		WAITNS 600+350+(700-350), wait_T1H_time

		GPIO_APPLY_MASK_TO_ADDR()
*/

		// That bit is done, so start counting now for the next bit. THis gives us time
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
	SLEEPNS 300000, 1, reset_time

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
