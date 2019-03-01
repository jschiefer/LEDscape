// //////////////////////////////////////////////////////////////////////////////////////////////
// APA102 Shared Clock for PRU0
// Overall Channels: 48
// PRU Channels: 24
// Clock Pin: GPIO2_22
// //////////////////////////////////////////////////////////////////////////////////////////////
#define PRU0
#include "common.p.h"
// Intialize the PRU
START:
// Enable OCP master port
// clear the STANDBY_INIT bit in the SYSCFG register,
// otherwise the PRU will not be able to write outside the
// PRU memory space and to the BeagleBone's pins.
LBCO r0, C4, 4, 4;
CLR r0, r0, 4;
SBCO r0, C4, 4, 4;
// Configure the programmable pointer register for PRU0 by setting
// c28_pointer[15:0] field to 0x0120.  This will make C28 point to
// 0x00012000 (PRU shared RAM).
MOV r0, 0x0120;
MOV r1, 0x022028;
ST32 r0, r1;
// Configure the programmable pointer register for PRU0 by setting
// c31_pointer[15:0] field to 0x0010.  This will make C31 point to
// 0x80001000 (DDR memory).
MOV r0, 0x100000;
MOV r1, 0x02202C;
ST32 r0, r1;
// Write a 0x1 into the response field so that they know we have started
MOV r2, 1;
SBCO r2, C24, 12, 4;
MOV r20, 0xFFFFFFFF;

l_main_loop:
RAISE_ARM_INTERRUPT;
LBCO r0, C24, 0, 12;
// Wait for the start condition from the main program to indicate
// that we have a rendered frame ready to clock out.  This also
// handles the exit case if an invalid value is written to the start
// start position.

main_loop:
// Let ledscape know that we're starting the loop again. It waits for this
// interrupt before sending another frame
RAISE_ARM_INTERRUPT;
// Load the pointer to the buffer from PRU DRAM into r0 and the
// length (in bytes-bit words) into r1.
// start command into r2
LBCO r0, C24, 0, 12;
// Wait for a non-zero command
QBEQ main_loop, r2, 0;
// Reset the sleep timer
RESET_COUNTER;
// Zero out the start command so that they know we have received it
// This allows maximum speed frame drawing since they know that they
// can now swap the frame buffer pointer and write a new start command.
MOV r3, 0;
SBCO r3, C24, 8, 4;
// Command of 0xFF is the signal to exit
QBEQ EXIT, r2, 255;
// send the start frame

l_start_frame:
// store number of leds in r29
MOV r29.w0, r1;
// All Data Lines LOW
  // Bank 0
    // Prep GPIO address register for CLEAR on GPIO bank 0
    MOV r3, 0x44E07190;
    // Set the GPIO (bank 0) mask register for setting or clearing channels 3, 9, 22, 23
    MOV r4, 0x04000B00;
    // Apply GPIO bank 0 changes
    SBBO r4, r3, 0, 4; // copy 4 bytes from r3 + 0 into registers starting at r4
  // Bank 1
    // Prep GPIO address register for CLEAR on GPIO bank 1
    MOV r3, 0x4804C190;
    // Set the GPIO (bank 1) mask register for setting or clearing channels 2, 4, 6
    MOV r4, 0x20005000;
    // Apply GPIO bank 1 changes
    SBBO r4, r3, 0, 4; // copy 4 bytes from r3 + 0 into registers starting at r4
  // Bank 2
    // Prep GPIO address register for CLEAR on GPIO bank 2
    MOV r3, 0x481AC190;
    // Set the GPIO (bank 2) mask register for setting or clearing channels 0, 1, 5, 7, 8, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21
    MOV r4, 0x0303FFDA;
    // Apply GPIO bank 2 changes
    SBBO r4, r3, 0, 4; // copy 4 bytes from r3 + 0 into registers starting at r4
MOV r2.b0, 32;
// 32 bits of 0

  l_start_frame_32_zeros:
  // Pulse Clock HIGH-LOW
    // Prep GPIO address register for SET on GPIO bank 2
    MOV r3, 0x481AC194;
    // Set the GPIO (bank 2) mask register for setting or clearing channels GPIO2_22
    MOV r4, 0x400000;
    // Apply GPIO bank 2 changes
    SBBO r4, r3, 0, 4; // copy 4 bytes from r3 + 0 into registers starting at r4
    // Apply GPIO bank 2 changes
    SBBO r4, r3, 0, 4; // copy 4 bytes from r3 + 0 into registers starting at r4
    // Apply GPIO bank 2 changes
    SBBO r4, r3, 0, 4; // copy 4 bytes from r3 + 0 into registers starting at r4
    // Prep GPIO address register for CLEAR on GPIO bank 2
    MOV r3, 0x481AC190;
    // Apply GPIO bank 2 changes
    SBBO r4, r3, 0, 4; // copy 4 bytes from r3 + 0 into registers starting at r4
    // Apply GPIO bank 2 changes
    SBBO r4, r3, 0, 4; // copy 4 bytes from r3 + 0 into registers starting at r4
    // Apply GPIO bank 2 changes
    SBBO r4, r3, 0, 4; // copy 4 bytes from r3 + 0 into registers starting at r4
  DECREMENT r2.b0; // r2.b0 --
  QBNE l_start_frame_32_zeros, r2.b0, 0;

  l_start_word_8_ones:
  MOV r2.b0, 7;
  // All Data Lines HIGH
    // Bank 0
      // Prep GPIO address register for SET on GPIO bank 0
      MOV r3, 0x44E07194;
      // Set the GPIO (bank 0) mask register for setting or clearing channels 3, 9, 22, 23
      MOV r4, 0x04000B00;
      // Apply GPIO bank 0 changes
      SBBO r4, r3, 0, 4; // copy 4 bytes from r3 + 0 into registers starting at r4
    // Bank 1
      // Prep GPIO address register for SET on GPIO bank 1
      MOV r3, 0x4804C194;
      // Set the GPIO (bank 1) mask register for setting or clearing channels 2, 4, 6
      MOV r4, 0x20005000;
      // Apply GPIO bank 1 changes
      SBBO r4, r3, 0, 4; // copy 4 bytes from r3 + 0 into registers starting at r4
    // Bank 2
      // Prep GPIO address register for SET on GPIO bank 2
      MOV r3, 0x481AC194;
      // Set the GPIO (bank 2) mask register for setting or clearing channels 0, 1, 5, 7, 8, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21
      MOV r4, 0x0303FFDA;
      // Apply GPIO bank 2 changes
      SBBO r4, r3, 0, 4; // copy 4 bytes from r3 + 0 into registers starting at r4

    l_header_bit_loop:
    DECREMENT r2.b0; // r2.b0 --
    // Pulse Clock HIGH-LOW
      // Prep GPIO address register for SET on GPIO bank 2
      MOV r3, 0x481AC194;
      // Set the GPIO (bank 2) mask register for setting or clearing channels GPIO2_22
      MOV r4, 0x400000;
      // Apply GPIO bank 2 changes
      SBBO r4, r3, 0, 4; // copy 4 bytes from r3 + 0 into registers starting at r4
      // Apply GPIO bank 2 changes
      SBBO r4, r3, 0, 4; // copy 4 bytes from r3 + 0 into registers starting at r4
      // Apply GPIO bank 2 changes
      SBBO r4, r3, 0, 4; // copy 4 bytes from r3 + 0 into registers starting at r4
      // Prep GPIO address register for CLEAR on GPIO bank 2
      MOV r3, 0x481AC190;
      // Apply GPIO bank 2 changes
      SBBO r4, r3, 0, 4; // copy 4 bytes from r3 + 0 into registers starting at r4
      // Apply GPIO bank 2 changes
      SBBO r4, r3, 0, 4; // copy 4 bytes from r3 + 0 into registers starting at r4
      // Apply GPIO bank 2 changes
      SBBO r4, r3, 0, 4; // copy 4 bytes from r3 + 0 into registers starting at r4
    QBNE l_header_bit_loop, r2.b0, 0;
  // Load the data address from the constant table
  LBCO r3, C24, 0, 4;
  // Load 24 channels of data into data registers
  LBBO r5, r3, 0, 96; // store 96 bytes into r3 + 0 from registers starting at r5
  // Loop over the 24 bits in a word
  MOV r2.b0, 24;

    l_bit_loop:
    DECREMENT r2.b0; // r2.b0 --
    // Bring Clock High
      // Prep GPIO address register for SET on GPIO bank 2
      MOV r3, 0x481AC194;
      // Set the GPIO (bank 2) mask register for setting or clearing channels GPIO2_22
      MOV r4, 0x400000;
      // Apply GPIO bank 2 changes
      SBBO r4, r3, 0, 4; // copy 4 bytes from r3 + 0 into registers starting at r4
    // Bank 0
      // Bank 0 Data Lines LOW
        // Prep GPIO address register for CLEAR on GPIO bank 0
        MOV r3, 0x44E07190;
        // Set the GPIO (bank 0) mask register for setting or clearing channels 3, 9, 22, 23
        MOV r4, 0x04000B00;
        // Apply GPIO bank 0 changes
        SBBO r4, r3, 0, 4; // copy 4 bytes from r3 + 0 into registers starting at r4
      // Reset GPIO one registers
      MOV r4, 0;
      // Test if pin (pruDataChannel=3, global=3) is ONE and SET bit 26 in GPIO0 register
      QBBC channel_3_one_skip, r8, r2.b0; // if (r8 & (1 << r2.b0) == 0) goto channel_3_one_skip
      SET r4, r4, 26;
      channel_3_one_skip:
      // Test if pin (pruDataChannel=9, global=9) is ONE and SET bit 11 in GPIO0 register
      QBBC channel_9_one_skip, r14, r2.b0; // if (r14 & (1 << r2.b0) == 0) goto channel_9_one_skip
      SET r4, r4, 11;
      channel_9_one_skip:
      // Test if pin (pruDataChannel=22, global=22) is ONE and SET bit 8 in GPIO0 register
      QBBC channel_22_one_skip, r27, r2.b0; // if (r27 & (1 << r2.b0) == 0) goto channel_22_one_skip
      SET r4, r4, 8;
      channel_22_one_skip:
      // Test if pin (pruDataChannel=23, global=23) is ONE and SET bit 9 in GPIO0 register
      QBBC channel_23_one_skip, r28, r2.b0; // if (r28 & (1 << r2.b0) == 0) goto channel_23_one_skip
      SET r4, r4, 9;
      channel_23_one_skip:
      // Bring Clock Low
        // Prep GPIO address register for CLEAR on GPIO bank 2
        MOV r3, 0x481AC190;
        // Set the GPIO (bank 2) mask register for setting or clearing channels GPIO2_22
        MOV r4, 0x400000;
        // Apply GPIO bank 2 changes
        SBBO r4, r3, 0, 4; // copy 4 bytes from r3 + 0 into registers starting at r4
      // Prep GPIO address register for SET on GPIO bank 0
      MOV r3, 0x44E07194;
      // Apply GPIO bank 0 changes
      SBBO r4, r3, 0, 4; // copy 4 bytes from r3 + 0 into registers starting at r4
    // Bank 1
      // Bank 1 Data Lines LOW
        // Prep GPIO address register for CLEAR on GPIO bank 1
        MOV r3, 0x4804C190;
        // Set the GPIO (bank 1) mask register for setting or clearing channels 2, 4, 6
        MOV r4, 0x20005000;
        // Apply GPIO bank 1 changes
        SBBO r4, r3, 0, 4; // copy 4 bytes from r3 + 0 into registers starting at r4
      // Reset GPIO one registers
      MOV r4, 0;
      // Test if pin (pruDataChannel=2, global=2) is ONE and SET bit 12 in GPIO1 register
      QBBC channel_2_one_skip, r7, r2.b0; // if (r7 & (1 << r2.b0) == 0) goto channel_2_one_skip
      SET r4, r4, 12;
      channel_2_one_skip:
      // Test if pin (pruDataChannel=4, global=4) is ONE and SET bit 14 in GPIO1 register
      QBBC channel_4_one_skip, r9, r2.b0; // if (r9 & (1 << r2.b0) == 0) goto channel_4_one_skip
      SET r4, r4, 14;
      channel_4_one_skip:
      // Test if pin (pruDataChannel=6, global=6) is ONE and SET bit 29 in GPIO1 register
      QBBC channel_6_one_skip, r11, r2.b0; // if (r11 & (1 << r2.b0) == 0) goto channel_6_one_skip
      SET r4, r4, 29;
      channel_6_one_skip:
      // Prep GPIO address register for SET on GPIO bank 1
      MOV r3, 0x4804C194;
      // Apply GPIO bank 1 changes
      SBBO r4, r3, 0, 4; // copy 4 bytes from r3 + 0 into registers starting at r4
    // Bank 2
      // Bank 2 Data Lines LOW
        // Prep GPIO address register for CLEAR on GPIO bank 2
        MOV r3, 0x481AC190;
        // Set the GPIO (bank 2) mask register for setting or clearing channels 0, 1, 5, 7, 8, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21
        MOV r4, 0x0303FFDA;
        // Apply GPIO bank 2 changes
        SBBO r4, r3, 0, 4; // copy 4 bytes from r3 + 0 into registers starting at r4
      // Reset GPIO one registers
      MOV r4, 0;
      // Test if pin (pruDataChannel=0, global=0) is ONE and SET bit 3 in GPIO2 register
      QBBC channel_0_one_skip, r5, r2.b0; // if (r5 & (1 << r2.b0) == 0) goto channel_0_one_skip
      SET r4, r4, 3;
      channel_0_one_skip:
      // Test if pin (pruDataChannel=1, global=1) is ONE and SET bit 4 in GPIO2 register
      QBBC channel_1_one_skip, r6, r2.b0; // if (r6 & (1 << r2.b0) == 0) goto channel_1_one_skip
      SET r4, r4, 4;
      channel_1_one_skip:
      // Test if pin (pruDataChannel=5, global=5) is ONE and SET bit 1 in GPIO2 register
      QBBC channel_5_one_skip, r10, r2.b0; // if (r10 & (1 << r2.b0) == 0) goto channel_5_one_skip
      SET r4, r4, 1;
      channel_5_one_skip:
      // Test if pin (pruDataChannel=7, global=7) is ONE and SET bit 24 in GPIO2 register
      QBBC channel_7_one_skip, r12, r2.b0; // if (r12 & (1 << r2.b0) == 0) goto channel_7_one_skip
      SET r4, r4, 24;
      channel_7_one_skip:
      // Test if pin (pruDataChannel=8, global=8) is ONE and SET bit 25 in GPIO2 register
      QBBC channel_8_one_skip, r13, r2.b0; // if (r13 & (1 << r2.b0) == 0) goto channel_8_one_skip
      SET r4, r4, 25;
      channel_8_one_skip:
      // Test if pin (pruDataChannel=10, global=10) is ONE and SET bit 17 in GPIO2 register
      QBBC channel_10_one_skip, r15, r2.b0; // if (r15 & (1 << r2.b0) == 0) goto channel_10_one_skip
      SET r4, r4, 17;
      channel_10_one_skip:
      // Test if pin (pruDataChannel=11, global=11) is ONE and SET bit 16 in GPIO2 register
      QBBC channel_11_one_skip, r16, r2.b0; // if (r16 & (1 << r2.b0) == 0) goto channel_11_one_skip
      SET r4, r4, 16;
      channel_11_one_skip:
      // Test if pin (pruDataChannel=12, global=12) is ONE and SET bit 15 in GPIO2 register
      QBBC channel_12_one_skip, r17, r2.b0; // if (r17 & (1 << r2.b0) == 0) goto channel_12_one_skip
      SET r4, r4, 15;
      channel_12_one_skip:
      // Test if pin (pruDataChannel=13, global=13) is ONE and SET bit 13 in GPIO2 register
      QBBC channel_13_one_skip, r18, r2.b0; // if (r18 & (1 << r2.b0) == 0) goto channel_13_one_skip
      SET r4, r4, 13;
      channel_13_one_skip:
      // Test if pin (pruDataChannel=14, global=14) is ONE and SET bit 11 in GPIO2 register
      QBBC channel_14_one_skip, r19, r2.b0; // if (r19 & (1 << r2.b0) == 0) goto channel_14_one_skip
      SET r4, r4, 11;
      channel_14_one_skip:
      // Test if pin (pruDataChannel=15, global=15) is ONE and SET bit 9 in GPIO2 register
      QBBC channel_15_one_skip, r20, r2.b0; // if (r20 & (1 << r2.b0) == 0) goto channel_15_one_skip
      SET r4, r4, 9;
      channel_15_one_skip:
      // Test if pin (pruDataChannel=16, global=16) is ONE and SET bit 7 in GPIO2 register
      QBBC channel_16_one_skip, r21, r2.b0; // if (r21 & (1 << r2.b0) == 0) goto channel_16_one_skip
      SET r4, r4, 7;
      channel_16_one_skip:
      // Test if pin (pruDataChannel=17, global=17) is ONE and SET bit 6 in GPIO2 register
      QBBC channel_17_one_skip, r22, r2.b0; // if (r22 & (1 << r2.b0) == 0) goto channel_17_one_skip
      SET r4, r4, 6;
      channel_17_one_skip:
      // Test if pin (pruDataChannel=18, global=18) is ONE and SET bit 8 in GPIO2 register
      QBBC channel_18_one_skip, r23, r2.b0; // if (r23 & (1 << r2.b0) == 0) goto channel_18_one_skip
      SET r4, r4, 8;
      channel_18_one_skip:
      // Test if pin (pruDataChannel=19, global=19) is ONE and SET bit 10 in GPIO2 register
      QBBC channel_19_one_skip, r24, r2.b0; // if (r24 & (1 << r2.b0) == 0) goto channel_19_one_skip
      SET r4, r4, 10;
      channel_19_one_skip:
      // Test if pin (pruDataChannel=20, global=20) is ONE and SET bit 12 in GPIO2 register
      QBBC channel_20_one_skip, r25, r2.b0; // if (r25 & (1 << r2.b0) == 0) goto channel_20_one_skip
      SET r4, r4, 12;
      channel_20_one_skip:
      // Test if pin (pruDataChannel=21, global=21) is ONE and SET bit 14 in GPIO2 register
      QBBC channel_21_one_skip, r26, r2.b0; // if (r26 & (1 << r2.b0) == 0) goto channel_21_one_skip
      SET r4, r4, 14;
      channel_21_one_skip:
      // Prep GPIO address register for SET on GPIO bank 2
      MOV r3, 0x481AC194;
      // Apply GPIO bank 2 changes
      SBBO r4, r3, 0, 4; // copy 4 bytes from r3 + 0 into registers starting at r4
    QBNE l_bit_loop, r2.b0, 0;
  // Pulse Clock HIGH-LOW
    // Prep GPIO address register for SET on GPIO bank 2
    MOV r3, 0x481AC194;
    // Set the GPIO (bank 2) mask register for setting or clearing channels GPIO2_22
    MOV r4, 0x400000;
    // Apply GPIO bank 2 changes
    SBBO r4, r3, 0, 4; // copy 4 bytes from r3 + 0 into registers starting at r4
    // Apply GPIO bank 2 changes
    SBBO r4, r3, 0, 4; // copy 4 bytes from r3 + 0 into registers starting at r4
    // Apply GPIO bank 2 changes
    SBBO r4, r3, 0, 4; // copy 4 bytes from r3 + 0 into registers starting at r4
    // Prep GPIO address register for CLEAR on GPIO bank 2
    MOV r3, 0x481AC190;
    // Apply GPIO bank 2 changes
    SBBO r4, r3, 0, 4; // copy 4 bytes from r3 + 0 into registers starting at r4
    // Apply GPIO bank 2 changes
    SBBO r4, r3, 0, 4; // copy 4 bytes from r3 + 0 into registers starting at r4
    // Apply GPIO bank 2 changes
    SBBO r4, r3, 0, 4; // copy 4 bytes from r3 + 0 into registers starting at r4
  ADD r0, r0, 192; // r0 = r0 + 192
  DECREMENT r1; // r1 --
  QBNE l_start_word_8_ones, r1, 0;

  l_end_frame:
  MOV r2.b0, r29.w0;
  SUB r2.b0, r2.b0, 1; // r2.b0 = r2.b0 - 1
  LSR r2.b0, r2.b0, 4;
  ADD r2.b0, r2.b0, 1; // r2.b0 = r2.b0 + 1
  LSL r2.b0, r2.b0, 3;
  // All Data Lines HIGH
    // Bank 0
      // Prep GPIO address register for SET on GPIO bank 0
      MOV r3, 0x44E07194;
      // Set the GPIO (bank 0) mask register for setting or clearing channels 3, 9, 22, 23
      MOV r4, 0x04000B00;
      // Apply GPIO bank 0 changes
      SBBO r4, r3, 0, 4; // copy 4 bytes from r3 + 0 into registers starting at r4
    // Bank 1
      // Prep GPIO address register for SET on GPIO bank 1
      MOV r3, 0x4804C194;
      // Set the GPIO (bank 1) mask register for setting or clearing channels 2, 4, 6
      MOV r4, 0x20005000;
      // Apply GPIO bank 1 changes
      SBBO r4, r3, 0, 4; // copy 4 bytes from r3 + 0 into registers starting at r4
    // Bank 2
      // Prep GPIO address register for SET on GPIO bank 2
      MOV r3, 0x481AC194;
      // Set the GPIO (bank 2) mask register for setting or clearing channels 0, 1, 5, 7, 8, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21
      MOV r4, 0x0303FFDA;
      // Apply GPIO bank 2 changes
      SBBO r4, r3, 0, 4; // copy 4 bytes from r3 + 0 into registers starting at r4

    l_end_bit_loop:
    DECREMENT r2.b0; // r2.b0 --
    // Pulse Clock HIGH-LOW
      // Prep GPIO address register for SET on GPIO bank 2
      MOV r3, 0x481AC194;
      // Set the GPIO (bank 2) mask register for setting or clearing channels GPIO2_22
      MOV r4, 0x400000;
      // Apply GPIO bank 2 changes
      SBBO r4, r3, 0, 4; // copy 4 bytes from r3 + 0 into registers starting at r4
      // Apply GPIO bank 2 changes
      SBBO r4, r3, 0, 4; // copy 4 bytes from r3 + 0 into registers starting at r4
      // Apply GPIO bank 2 changes
      SBBO r4, r3, 0, 4; // copy 4 bytes from r3 + 0 into registers starting at r4
      // Prep GPIO address register for CLEAR on GPIO bank 2
      MOV r3, 0x481AC190;
      // Apply GPIO bank 2 changes
      SBBO r4, r3, 0, 4; // copy 4 bytes from r3 + 0 into registers starting at r4
      // Apply GPIO bank 2 changes
      SBBO r4, r3, 0, 4; // copy 4 bytes from r3 + 0 into registers starting at r4
      // Apply GPIO bank 2 changes
      SBBO r4, r3, 0, 4; // copy 4 bytes from r3 + 0 into registers starting at r4
    QBNE l_end_bit_loop, r2.b0, 0;
  // All Data Lines LOW
    // Bank 0
      // Prep GPIO address register for CLEAR on GPIO bank 0
      MOV r3, 0x44E07190;
      // Set the GPIO (bank 0) mask register for setting or clearing channels 3, 9, 22, 23
      MOV r4, 0x04000B00;
      // Apply GPIO bank 0 changes
      SBBO r4, r3, 0, 4; // copy 4 bytes from r3 + 0 into registers starting at r4
    // Bank 1
      // Prep GPIO address register for CLEAR on GPIO bank 1
      MOV r3, 0x4804C190;
      // Set the GPIO (bank 1) mask register for setting or clearing channels 2, 4, 6
      MOV r4, 0x20005000;
      // Apply GPIO bank 1 changes
      SBBO r4, r3, 0, 4; // copy 4 bytes from r3 + 0 into registers starting at r4
    // Bank 2
      // Prep GPIO address register for CLEAR on GPIO bank 2
      MOV r3, 0x481AC190;
      // Set the GPIO (bank 2) mask register for setting or clearing channels 0, 1, 5, 7, 8, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21
      MOV r4, 0x0303FFDA;
      // Apply GPIO bank 2 changes
      SBBO r4, r3, 0, 4; // copy 4 bytes from r3 + 0 into registers starting at r4
MOV r8, 0x022000;
LBBO r2, r8, 12, 4; // store 4 bytes into r8 + 12 from registers starting at r2
SBCO r2, C24, 12, 4;
QBA main_loop;

EXIT:
MOV r2, 255;
SBCO r2, C24, 12, 4;
RAISE_ARM_INTERRUPT;
HALT;
