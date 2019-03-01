// //////////////////////////////////////////////////////////////////////////////////////////////
// APA102 Interlaced Clock for PRU1
// Overall Pins Used: 48 (24 channels)
// PRU Pins Used: 24 (12 channels)
// //////////////////////////////////////////////////////////////////////////////////////////////
#define PRU1
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
  MOV r2.b0, 32;
  // store number of leds in r29
  MOV r29.w0, r1;
  // All Data Pins LOW: 25, 27, 29, 31, 33, 35, 37, 39, 41, 43, 45, 47
    // Bank 0
      // Prep GPIO address register for CLEAR on GPIO bank 0
      MOV r3, 0x44E07190;
      // Set the GPIO (bank 0) mask register for setting or clearing channels 27, 29, 33, 45, 47
      MOV r4, 0xC8900000;
      // Apply GPIO bank 0 changes
      SBBO r4, r3, 0, 4; // copy 4 bytes from r3 + 0 into registers starting at r4
    // Bank 1
      // Prep GPIO address register for CLEAR on GPIO bank 1
      MOV r3, 0x4804C190;
      // Set the GPIO (bank 1) mask register for setting or clearing channels 41, 43
      MOV r4, 0x030000;
      // Apply GPIO bank 1 changes
      SBBO r4, r3, 0, 4; // copy 4 bytes from r3 + 0 into registers starting at r4
    // Bank 2
      // Prep GPIO address register for CLEAR on GPIO bank 2
      MOV r3, 0x481AC190;
      // Set the GPIO (bank 2) mask register for setting or clearing channels 25, 31
      MOV r4, 0x800004;
      // Apply GPIO bank 2 changes
      SBBO r4, r3, 0, 4; // copy 4 bytes from r3 + 0 into registers starting at r4
    // Bank 3
      // Prep GPIO address register for CLEAR on GPIO bank 3
      MOV r3, 0x481AE190;
      // Set the GPIO (bank 3) mask register for setting or clearing channels 35, 37, 39
      MOV r4, 0x230000;
      // Apply GPIO bank 3 changes
      SBBO r4, r3, 0, 4; // copy 4 bytes from r3 + 0 into registers starting at r4
    // 32 bits of 0

    l_start_frame_32_zeros:
    DECREMENT r2.b0;
    // All Clock Pins HIGH-LOW pulse: 24, 26, 28, 30, 32, 34, 36, 38, 40, 42, 44, 46
      // Bank 0
        // Set the GPIO (bank 0) mask register for setting or clearing channels 24, 26, 32, 40
        MOV r4, 0x408480;
        // Prep GPIO address register for SET on GPIO bank 0
        MOV r3, 0x44E07194;
        // Apply GPIO bank 0 changes
        SBBO r4, r3, 0, 4; // copy 4 bytes from r3 + 0 into registers starting at r4
        // Prep GPIO address register for CLEAR on GPIO bank 0
        MOV r3, 0x44E07190;
        // Apply GPIO bank 0 changes
        SBBO r4, r3, 0, 4; // copy 4 bytes from r3 + 0 into registers starting at r4
      // Bank 1
        // Set the GPIO (bank 1) mask register for setting or clearing channels 28, 42, 44, 46
        MOV r4, 0x100C8000;
        // Prep GPIO address register for SET on GPIO bank 1
        MOV r3, 0x4804C194;
        // Apply GPIO bank 1 changes
        SBBO r4, r3, 0, 4; // copy 4 bytes from r3 + 0 into registers starting at r4
        // Prep GPIO address register for CLEAR on GPIO bank 1
        MOV r3, 0x4804C190;
        // Apply GPIO bank 1 changes
        SBBO r4, r3, 0, 4; // copy 4 bytes from r3 + 0 into registers starting at r4
      // Bank 2
        // Set the GPIO (bank 2) mask register for setting or clearing channels 30
        MOV r4, 32;
        // Prep GPIO address register for SET on GPIO bank 2
        MOV r3, 0x481AC194;
        // Apply GPIO bank 2 changes
        SBBO r4, r3, 0, 4; // copy 4 bytes from r3 + 0 into registers starting at r4
        // Prep GPIO address register for CLEAR on GPIO bank 2
        MOV r3, 0x481AC190;
        // Apply GPIO bank 2 changes
        SBBO r4, r3, 0, 4; // copy 4 bytes from r3 + 0 into registers starting at r4
      // Bank 3
        // Set the GPIO (bank 3) mask register for setting or clearing channels 34, 36, 38
        MOV r4, 0x08C000;
        // Prep GPIO address register for SET on GPIO bank 3
        MOV r3, 0x481AE194;
        // Apply GPIO bank 3 changes
        SBBO r4, r3, 0, 4; // copy 4 bytes from r3 + 0 into registers starting at r4
        // Prep GPIO address register for CLEAR on GPIO bank 3
        MOV r3, 0x481AE190;
        // Apply GPIO bank 3 changes
        SBBO r4, r3, 0, 4; // copy 4 bytes from r3 + 0 into registers starting at r4
    QBNE l_start_frame_32_zeros, r2.b0, 0;

    l_start_word_8_ones:
    MOV r2.b0, 7;
    // All Data Pins HIGH: 25, 27, 29, 31, 33, 35, 37, 39, 41, 43, 45, 47
      // Bank 0
        // Prep GPIO address register for SET on GPIO bank 0
        MOV r3, 0x44E07194;
        // Set the GPIO (bank 0) mask register for setting or clearing channels 27, 29, 33, 45, 47
        MOV r4, 0xC8900000;
        // Apply GPIO bank 0 changes
        SBBO r4, r3, 0, 4; // copy 4 bytes from r3 + 0 into registers starting at r4
      // Bank 1
        // Prep GPIO address register for SET on GPIO bank 1
        MOV r3, 0x4804C194;
        // Set the GPIO (bank 1) mask register for setting or clearing channels 41, 43
        MOV r4, 0x030000;
        // Apply GPIO bank 1 changes
        SBBO r4, r3, 0, 4; // copy 4 bytes from r3 + 0 into registers starting at r4
      // Bank 2
        // Prep GPIO address register for SET on GPIO bank 2
        MOV r3, 0x481AC194;
        // Set the GPIO (bank 2) mask register for setting or clearing channels 25, 31
        MOV r4, 0x800004;
        // Apply GPIO bank 2 changes
        SBBO r4, r3, 0, 4; // copy 4 bytes from r3 + 0 into registers starting at r4
      // Bank 3
        // Prep GPIO address register for SET on GPIO bank 3
        MOV r3, 0x481AE194;
        // Set the GPIO (bank 3) mask register for setting or clearing channels 35, 37, 39
        MOV r4, 0x230000;
        // Apply GPIO bank 3 changes
        SBBO r4, r3, 0, 4; // copy 4 bytes from r3 + 0 into registers starting at r4

      l_header_bit_loop:
      DECREMENT r2.b0; // r2.b0 --
      // All Clock Pins HIGH-LOW pulse: 24, 26, 28, 30, 32, 34, 36, 38, 40, 42, 44, 46
        // Bank 0
          // Set the GPIO (bank 0) mask register for setting or clearing channels 24, 26, 32, 40
          MOV r4, 0x408480;
          // Prep GPIO address register for SET on GPIO bank 0
          MOV r3, 0x44E07194;
          // Apply GPIO bank 0 changes
          SBBO r4, r3, 0, 4; // copy 4 bytes from r3 + 0 into registers starting at r4
          // Prep GPIO address register for CLEAR on GPIO bank 0
          MOV r3, 0x44E07190;
          // Apply GPIO bank 0 changes
          SBBO r4, r3, 0, 4; // copy 4 bytes from r3 + 0 into registers starting at r4
        // Bank 1
          // Set the GPIO (bank 1) mask register for setting or clearing channels 28, 42, 44, 46
          MOV r4, 0x100C8000;
          // Prep GPIO address register for SET on GPIO bank 1
          MOV r3, 0x4804C194;
          // Apply GPIO bank 1 changes
          SBBO r4, r3, 0, 4; // copy 4 bytes from r3 + 0 into registers starting at r4
          // Prep GPIO address register for CLEAR on GPIO bank 1
          MOV r3, 0x4804C190;
          // Apply GPIO bank 1 changes
          SBBO r4, r3, 0, 4; // copy 4 bytes from r3 + 0 into registers starting at r4
        // Bank 2
          // Set the GPIO (bank 2) mask register for setting or clearing channels 30
          MOV r4, 32;
          // Prep GPIO address register for SET on GPIO bank 2
          MOV r3, 0x481AC194;
          // Apply GPIO bank 2 changes
          SBBO r4, r3, 0, 4; // copy 4 bytes from r3 + 0 into registers starting at r4
          // Prep GPIO address register for CLEAR on GPIO bank 2
          MOV r3, 0x481AC190;
          // Apply GPIO bank 2 changes
          SBBO r4, r3, 0, 4; // copy 4 bytes from r3 + 0 into registers starting at r4
        // Bank 3
          // Set the GPIO (bank 3) mask register for setting or clearing channels 34, 36, 38
          MOV r4, 0x08C000;
          // Prep GPIO address register for SET on GPIO bank 3
          MOV r3, 0x481AE194;
          // Apply GPIO bank 3 changes
          SBBO r4, r3, 0, 4; // copy 4 bytes from r3 + 0 into registers starting at r4
          // Prep GPIO address register for CLEAR on GPIO bank 3
          MOV r3, 0x481AE190;
          // Apply GPIO bank 3 changes
          SBBO r4, r3, 0, 4; // copy 4 bytes from r3 + 0 into registers starting at r4
      QBNE l_header_bit_loop, r2.b0, 0;
    // Load the data address from the constant table
    LBCO r3, C24, 0, 4;
    // Load 12 channels of data into data registers
    LBBO r5, r3, 48, 48; // store 48 bytes into r3 + 48 from registers starting at r5
    // Loop over the 24 bits in a word
    MOV r2.b0, 24;

      l_bit_loop:
      DECREMENT r2.b0; // r2.b0 --
      // All Clock Pins HIGH: 24, 26, 28, 30, 32, 34, 36, 38, 40, 42, 44, 46
        // Bank 0
          // Prep GPIO address register for SET on GPIO bank 0
          MOV r3, 0x44E07194;
          // Set the GPIO (bank 0) mask register for setting or clearing channels 24, 26, 32, 40
          MOV r4, 0x408480;
          // Apply GPIO bank 0 changes
          SBBO r4, r3, 0, 4; // copy 4 bytes from r3 + 0 into registers starting at r4
        // Bank 1
          // Prep GPIO address register for SET on GPIO bank 1
          MOV r3, 0x4804C194;
          // Set the GPIO (bank 1) mask register for setting or clearing channels 28, 42, 44, 46
          MOV r4, 0x100C8000;
          // Apply GPIO bank 1 changes
          SBBO r4, r3, 0, 4; // copy 4 bytes from r3 + 0 into registers starting at r4
        // Bank 2
          // Prep GPIO address register for SET on GPIO bank 2
          MOV r3, 0x481AC194;
          // Set the GPIO (bank 2) mask register for setting or clearing channels 30
          MOV r4, 32;
          // Apply GPIO bank 2 changes
          SBBO r4, r3, 0, 4; // copy 4 bytes from r3 + 0 into registers starting at r4
        // Bank 3
          // Prep GPIO address register for SET on GPIO bank 3
          MOV r3, 0x481AE194;
          // Set the GPIO (bank 3) mask register for setting or clearing channels 34, 36, 38
          MOV r4, 0x08C000;
          // Apply GPIO bank 3 changes
          SBBO r4, r3, 0, 4; // copy 4 bytes from r3 + 0 into registers starting at r4
      // Bank 0
        // Data Pins LOW: 27, 29, 33, 45, 47
          // Prep GPIO address register for CLEAR on GPIO bank 0
          MOV r3, 0x44E07190;
          // Set the GPIO (bank 0) mask register for setting or clearing channels 27, 29, 33, 45, 47
          MOV r4, 0xC8900000;
          // Apply GPIO bank 0 changes
          SBBO r4, r3, 0, 4; // copy 4 bytes from r3 + 0 into registers starting at r4
        // Reset GPIO one registers
        MOV r4, 0;
        // Test if pin (pruDataChannel=1, global=13) is ONE and SET bit 27 in GPIO0 register
        QBBC channel_1_one_skip, r6, r2.b0; // if (r6 & (1 << r2.b0) == 0) goto channel_1_one_skip
        SET r4, r4, 27;
        channel_1_one_skip:
        // Test if pin (pruDataChannel=2, global=14) is ONE and SET bit 23 in GPIO0 register
        QBBC channel_2_one_skip, r7, r2.b0; // if (r7 & (1 << r2.b0) == 0) goto channel_2_one_skip
        SET r4, r4, 23;
        channel_2_one_skip:
        // Test if pin (pruDataChannel=4, global=16) is ONE and SET bit 20 in GPIO0 register
        QBBC channel_4_one_skip, r9, r2.b0; // if (r9 & (1 << r2.b0) == 0) goto channel_4_one_skip
        SET r4, r4, 20;
        channel_4_one_skip:
        // Test if pin (pruDataChannel=10, global=22) is ONE and SET bit 31 in GPIO0 register
        QBBC channel_10_one_skip, r15, r2.b0; // if (r15 & (1 << r2.b0) == 0) goto channel_10_one_skip
        SET r4, r4, 31;
        channel_10_one_skip:
        // Test if pin (pruDataChannel=11, global=23) is ONE and SET bit 30 in GPIO0 register
        QBBC channel_11_one_skip, r16, r2.b0; // if (r16 & (1 << r2.b0) == 0) goto channel_11_one_skip
        SET r4, r4, 30;
        channel_11_one_skip:
        // Prep GPIO address register for SET on GPIO bank 0
        MOV r3, 0x44E07194;
        // Apply GPIO bank 0 changes
        SBBO r4, r3, 0, 4; // copy 4 bytes from r3 + 0 into registers starting at r4
      // Bank 1
        // Data Pins LOW: 41, 43
          // Prep GPIO address register for CLEAR on GPIO bank 1
          MOV r3, 0x4804C190;
          // Set the GPIO (bank 1) mask register for setting or clearing channels 41, 43
          MOV r4, 0x030000;
          // Apply GPIO bank 1 changes
          SBBO r4, r3, 0, 4; // copy 4 bytes from r3 + 0 into registers starting at r4
        // Reset GPIO one registers
        MOV r4, 0;
        // Test if pin (pruDataChannel=8, global=20) is ONE and SET bit 17 in GPIO1 register
        QBBC channel_8_one_skip, r13, r2.b0; // if (r13 & (1 << r2.b0) == 0) goto channel_8_one_skip
        SET r4, r4, 17;
        channel_8_one_skip:
        // Test if pin (pruDataChannel=9, global=21) is ONE and SET bit 16 in GPIO1 register
        QBBC channel_9_one_skip, r14, r2.b0; // if (r14 & (1 << r2.b0) == 0) goto channel_9_one_skip
        SET r4, r4, 16;
        channel_9_one_skip:
        // Prep GPIO address register for SET on GPIO bank 1
        MOV r3, 0x4804C194;
        // Apply GPIO bank 1 changes
        SBBO r4, r3, 0, 4; // copy 4 bytes from r3 + 0 into registers starting at r4
      // Bank 2
        // Data Pins LOW: 25, 31
          // Prep GPIO address register for CLEAR on GPIO bank 2
          MOV r3, 0x481AC190;
          // Set the GPIO (bank 2) mask register for setting or clearing channels 25, 31
          MOV r4, 0x800004;
          // Apply GPIO bank 2 changes
          SBBO r4, r3, 0, 4; // copy 4 bytes from r3 + 0 into registers starting at r4
        // Reset GPIO one registers
        MOV r4, 0;
        // Test if pin (pruDataChannel=0, global=12) is ONE and SET bit 23 in GPIO2 register
        QBBC channel_0_one_skip, r5, r2.b0; // if (r5 & (1 << r2.b0) == 0) goto channel_0_one_skip
        SET r4, r4, 23;
        channel_0_one_skip:
        // Test if pin (pruDataChannel=3, global=15) is ONE and SET bit 2 in GPIO2 register
        QBBC channel_3_one_skip, r8, r2.b0; // if (r8 & (1 << r2.b0) == 0) goto channel_3_one_skip
        SET r4, r4, 2;
        channel_3_one_skip:
        // Prep GPIO address register for SET on GPIO bank 2
        MOV r3, 0x481AC194;
        // Apply GPIO bank 2 changes
        SBBO r4, r3, 0, 4; // copy 4 bytes from r3 + 0 into registers starting at r4
      // Bank 3
        // Data Pins LOW: 35, 37, 39
          // Prep GPIO address register for CLEAR on GPIO bank 3
          MOV r3, 0x481AE190;
          // Set the GPIO (bank 3) mask register for setting or clearing channels 35, 37, 39
          MOV r4, 0x230000;
          // Apply GPIO bank 3 changes
          SBBO r4, r3, 0, 4; // copy 4 bytes from r3 + 0 into registers starting at r4
        // Reset GPIO one registers
        MOV r4, 0;
        // Test if pin (pruDataChannel=5, global=17) is ONE and SET bit 16 in GPIO3 register
        QBBC channel_5_one_skip, r10, r2.b0; // if (r10 & (1 << r2.b0) == 0) goto channel_5_one_skip
        SET r4, r4, 16;
        channel_5_one_skip:
        // Test if pin (pruDataChannel=6, global=18) is ONE and SET bit 17 in GPIO3 register
        QBBC channel_6_one_skip, r11, r2.b0; // if (r11 & (1 << r2.b0) == 0) goto channel_6_one_skip
        SET r4, r4, 17;
        channel_6_one_skip:
        // Test if pin (pruDataChannel=7, global=19) is ONE and SET bit 21 in GPIO3 register
        QBBC channel_7_one_skip, r12, r2.b0; // if (r12 & (1 << r2.b0) == 0) goto channel_7_one_skip
        SET r4, r4, 21;
        channel_7_one_skip:
        // Prep GPIO address register for SET on GPIO bank 3
        MOV r3, 0x481AE194;
        // Apply GPIO bank 3 changes
        SBBO r4, r3, 0, 4; // copy 4 bytes from r3 + 0 into registers starting at r4
      // All Clock Pins LOW: 24, 26, 28, 30, 32, 34, 36, 38, 40, 42, 44, 46
        // Bank 0
          // Prep GPIO address register for CLEAR on GPIO bank 0
          MOV r3, 0x44E07190;
          // Set the GPIO (bank 0) mask register for setting or clearing channels 24, 26, 32, 40
          MOV r4, 0x408480;
          // Apply GPIO bank 0 changes
          SBBO r4, r3, 0, 4; // copy 4 bytes from r3 + 0 into registers starting at r4
        // Bank 1
          // Prep GPIO address register for CLEAR on GPIO bank 1
          MOV r3, 0x4804C190;
          // Set the GPIO (bank 1) mask register for setting or clearing channels 28, 42, 44, 46
          MOV r4, 0x100C8000;
          // Apply GPIO bank 1 changes
          SBBO r4, r3, 0, 4; // copy 4 bytes from r3 + 0 into registers starting at r4
        // Bank 2
          // Prep GPIO address register for CLEAR on GPIO bank 2
          MOV r3, 0x481AC190;
          // Set the GPIO (bank 2) mask register for setting or clearing channels 30
          MOV r4, 32;
          // Apply GPIO bank 2 changes
          SBBO r4, r3, 0, 4; // copy 4 bytes from r3 + 0 into registers starting at r4
        // Bank 3
          // Prep GPIO address register for CLEAR on GPIO bank 3
          MOV r3, 0x481AE190;
          // Set the GPIO (bank 3) mask register for setting or clearing channels 34, 36, 38
          MOV r4, 0x08C000;
          // Apply GPIO bank 3 changes
          SBBO r4, r3, 0, 4; // copy 4 bytes from r3 + 0 into registers starting at r4
      QBNE l_bit_loop, r2.b0, 0;
    // All Clock Pins HIGH-LOW pulse: 24, 26, 28, 30, 32, 34, 36, 38, 40, 42, 44, 46
      // Bank 0
        // Set the GPIO (bank 0) mask register for setting or clearing channels 24, 26, 32, 40
        MOV r4, 0x408480;
        // Prep GPIO address register for SET on GPIO bank 0
        MOV r3, 0x44E07194;
        // Apply GPIO bank 0 changes
        SBBO r4, r3, 0, 4; // copy 4 bytes from r3 + 0 into registers starting at r4
        // Prep GPIO address register for CLEAR on GPIO bank 0
        MOV r3, 0x44E07190;
        // Apply GPIO bank 0 changes
        SBBO r4, r3, 0, 4; // copy 4 bytes from r3 + 0 into registers starting at r4
      // Bank 1
        // Set the GPIO (bank 1) mask register for setting or clearing channels 28, 42, 44, 46
        MOV r4, 0x100C8000;
        // Prep GPIO address register for SET on GPIO bank 1
        MOV r3, 0x4804C194;
        // Apply GPIO bank 1 changes
        SBBO r4, r3, 0, 4; // copy 4 bytes from r3 + 0 into registers starting at r4
        // Prep GPIO address register for CLEAR on GPIO bank 1
        MOV r3, 0x4804C190;
        // Apply GPIO bank 1 changes
        SBBO r4, r3, 0, 4; // copy 4 bytes from r3 + 0 into registers starting at r4
      // Bank 2
        // Set the GPIO (bank 2) mask register for setting or clearing channels 30
        MOV r4, 32;
        // Prep GPIO address register for SET on GPIO bank 2
        MOV r3, 0x481AC194;
        // Apply GPIO bank 2 changes
        SBBO r4, r3, 0, 4; // copy 4 bytes from r3 + 0 into registers starting at r4
        // Prep GPIO address register for CLEAR on GPIO bank 2
        MOV r3, 0x481AC190;
        // Apply GPIO bank 2 changes
        SBBO r4, r3, 0, 4; // copy 4 bytes from r3 + 0 into registers starting at r4
      // Bank 3
        // Set the GPIO (bank 3) mask register for setting or clearing channels 34, 36, 38
        MOV r4, 0x08C000;
        // Prep GPIO address register for SET on GPIO bank 3
        MOV r3, 0x481AE194;
        // Apply GPIO bank 3 changes
        SBBO r4, r3, 0, 4; // copy 4 bytes from r3 + 0 into registers starting at r4
        // Prep GPIO address register for CLEAR on GPIO bank 3
        MOV r3, 0x481AE190;
        // Apply GPIO bank 3 changes
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
    // All Data Pins HIGH: 25, 27, 29, 31, 33, 35, 37, 39, 41, 43, 45, 47
      // Bank 0
        // Prep GPIO address register for SET on GPIO bank 0
        MOV r3, 0x44E07194;
        // Set the GPIO (bank 0) mask register for setting or clearing channels 27, 29, 33, 45, 47
        MOV r4, 0xC8900000;
        // Apply GPIO bank 0 changes
        SBBO r4, r3, 0, 4; // copy 4 bytes from r3 + 0 into registers starting at r4
      // Bank 1
        // Prep GPIO address register for SET on GPIO bank 1
        MOV r3, 0x4804C194;
        // Set the GPIO (bank 1) mask register for setting or clearing channels 41, 43
        MOV r4, 0x030000;
        // Apply GPIO bank 1 changes
        SBBO r4, r3, 0, 4; // copy 4 bytes from r3 + 0 into registers starting at r4
      // Bank 2
        // Prep GPIO address register for SET on GPIO bank 2
        MOV r3, 0x481AC194;
        // Set the GPIO (bank 2) mask register for setting or clearing channels 25, 31
        MOV r4, 0x800004;
        // Apply GPIO bank 2 changes
        SBBO r4, r3, 0, 4; // copy 4 bytes from r3 + 0 into registers starting at r4
      // Bank 3
        // Prep GPIO address register for SET on GPIO bank 3
        MOV r3, 0x481AE194;
        // Set the GPIO (bank 3) mask register for setting or clearing channels 35, 37, 39
        MOV r4, 0x230000;
        // Apply GPIO bank 3 changes
        SBBO r4, r3, 0, 4; // copy 4 bytes from r3 + 0 into registers starting at r4

      l_end_bit_loop:
      DECREMENT r2.b0; // r2.b0 --
      // All Clock Pins HIGH-LOW pulse: 24, 26, 28, 30, 32, 34, 36, 38, 40, 42, 44, 46
        // Bank 0
          // Set the GPIO (bank 0) mask register for setting or clearing channels 24, 26, 32, 40
          MOV r4, 0x408480;
          // Prep GPIO address register for SET on GPIO bank 0
          MOV r3, 0x44E07194;
          // Apply GPIO bank 0 changes
          SBBO r4, r3, 0, 4; // copy 4 bytes from r3 + 0 into registers starting at r4
          // Prep GPIO address register for CLEAR on GPIO bank 0
          MOV r3, 0x44E07190;
          // Apply GPIO bank 0 changes
          SBBO r4, r3, 0, 4; // copy 4 bytes from r3 + 0 into registers starting at r4
        // Bank 1
          // Set the GPIO (bank 1) mask register for setting or clearing channels 28, 42, 44, 46
          MOV r4, 0x100C8000;
          // Prep GPIO address register for SET on GPIO bank 1
          MOV r3, 0x4804C194;
          // Apply GPIO bank 1 changes
          SBBO r4, r3, 0, 4; // copy 4 bytes from r3 + 0 into registers starting at r4
          // Prep GPIO address register for CLEAR on GPIO bank 1
          MOV r3, 0x4804C190;
          // Apply GPIO bank 1 changes
          SBBO r4, r3, 0, 4; // copy 4 bytes from r3 + 0 into registers starting at r4
        // Bank 2
          // Set the GPIO (bank 2) mask register for setting or clearing channels 30
          MOV r4, 32;
          // Prep GPIO address register for SET on GPIO bank 2
          MOV r3, 0x481AC194;
          // Apply GPIO bank 2 changes
          SBBO r4, r3, 0, 4; // copy 4 bytes from r3 + 0 into registers starting at r4
          // Prep GPIO address register for CLEAR on GPIO bank 2
          MOV r3, 0x481AC190;
          // Apply GPIO bank 2 changes
          SBBO r4, r3, 0, 4; // copy 4 bytes from r3 + 0 into registers starting at r4
        // Bank 3
          // Set the GPIO (bank 3) mask register for setting or clearing channels 34, 36, 38
          MOV r4, 0x08C000;
          // Prep GPIO address register for SET on GPIO bank 3
          MOV r3, 0x481AE194;
          // Apply GPIO bank 3 changes
          SBBO r4, r3, 0, 4; // copy 4 bytes from r3 + 0 into registers starting at r4
          // Prep GPIO address register for CLEAR on GPIO bank 3
          MOV r3, 0x481AE190;
          // Apply GPIO bank 3 changes
          SBBO r4, r3, 0, 4; // copy 4 bytes from r3 + 0 into registers starting at r4
      QBNE l_end_bit_loop, r2.b0, 0;
    // All Data Pins LOW: 25, 27, 29, 31, 33, 35, 37, 39, 41, 43, 45, 47
      // Bank 0
        // Prep GPIO address register for CLEAR on GPIO bank 0
        MOV r3, 0x44E07190;
        // Set the GPIO (bank 0) mask register for setting or clearing channels 27, 29, 33, 45, 47
        MOV r4, 0xC8900000;
        // Apply GPIO bank 0 changes
        SBBO r4, r3, 0, 4; // copy 4 bytes from r3 + 0 into registers starting at r4
      // Bank 1
        // Prep GPIO address register for CLEAR on GPIO bank 1
        MOV r3, 0x4804C190;
        // Set the GPIO (bank 1) mask register for setting or clearing channels 41, 43
        MOV r4, 0x030000;
        // Apply GPIO bank 1 changes
        SBBO r4, r3, 0, 4; // copy 4 bytes from r3 + 0 into registers starting at r4
      // Bank 2
        // Prep GPIO address register for CLEAR on GPIO bank 2
        MOV r3, 0x481AC190;
        // Set the GPIO (bank 2) mask register for setting or clearing channels 25, 31
        MOV r4, 0x800004;
        // Apply GPIO bank 2 changes
        SBBO r4, r3, 0, 4; // copy 4 bytes from r3 + 0 into registers starting at r4
      // Bank 3
        // Prep GPIO address register for CLEAR on GPIO bank 3
        MOV r3, 0x481AE190;
        // Set the GPIO (bank 3) mask register for setting or clearing channels 35, 37, 39
        MOV r4, 0x230000;
        // Apply GPIO bank 3 changes
        SBBO r4, r3, 0, 4; // copy 4 bytes from r3 + 0 into registers starting at r4
  MOV r8, 0x024000;
  LBBO r2, r8, 12, 4; // store 4 bytes into r8 + 12 from registers starting at r2
  SBCO r2, C24, 12, 4;
  QBA main_loop;

  EXIT:
  MOV r2, 255;
  SBCO r2, C24, 12, 4;
  RAISE_ARM_INTERRUPT;
  HALT;
