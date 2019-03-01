#define AM33XX

.origin 0
.entrypoint START

// ***************************************
// *     Global Register Assignments     *
// ***************************************

#define r_data_addr r0
#define r_data_len r1

#define r_bit_num       r2.w0
#define r_sleep_counter r2.w1
#define r_temp_addr r3
#define r_temp1 r4


// ***************************************
// *      Global Macro definitions       *
// ***************************************

#ifdef AM33XX

// Refer to this mapping in the file - \prussdrv\include\pruss_intc_mapping.h
#define PRU0_PRU1_INTERRUPT     17
#define PRU1_PRU0_INTERRUPT     18
#define PRU0_ARM_INTERRUPT      19
#define PRU1_ARM_INTERRUPT      20
#define ARM_PRU0_INTERRUPT      21
#define ARM_PRU1_INTERRUPT      22

#ifdef PRU0
	#define PRU_CONTROL_ADDRESS 0x22000
	#define PRU_ARM_INTERRUPT PRU0_ARM_INTERRUPT
#endif

#ifdef PRU1
	#define PRU_CONTROL_ADDRESS 0x24000
	#define PRU_ARM_INTERRUPT PRU1_ARM_INTERRUPT
#endif

#define CONST_PRUDRAM   C24
#define CONST_SHAREDRAM C28
#define CONST_L3RAM     C30
#define CONST_DDR       C31

// Address for the Constant table Programmable Pointer Register 0(CTPPR_0)
#define CTBIR_0         0x22020
// Address for the Constant table Programmable Pointer Register 0(CTPPR_0)
#define CTBIR_1         0x22024

// Address for the Constant table Programmable Pointer Register 0(CTPPR_0)
#define CTPPR_0         0x22028
// Address for the Constant table Programmable Pointer Register 1(CTPPR_1)
#define CTPPR_1         0x2202C

#else

// Refer to this mapping in the file - \prussdrv\include\pruss_intc_mapping.h
#define PRU0_PRU1_INTERRUPT     32
#define PRU1_PRU0_INTERRUPT     33
#define PRU0_ARM_INTERRUPT      34
#define PRU1_ARM_INTERRUPT      35
#define ARM_PRU0_INTERRUPT      36
#define ARM_PRU1_INTERRUPT      37

#define CONST_PRUDRAM   C3
#define CONST_HPI       C15
#define CONST_DSPL2     C28
#define CONST_L3RAM     C30
#define CONST_DDR       C31

// Address for the Constant table Programmable Pointer Register 0(CTPPR_0)      
#define CTPPR_0         0x7028
// Address for the Constant table Programmable Pointer Register 1(CTPPR_1)      
#define CTPPR_1         0x702C

#endif

.macro  LD32
.mparam dst,src
    LBBO    dst,src,#0x00,4
.endm

.macro  LD16
.mparam dst,src
    LBBO    dst,src,#0x00,2
.endm

.macro  LD8
.mparam dst,src
    LBBO    dst,src,#0x00,1
.endm

.macro ST32
.mparam src,dst
    SBBO    src,dst,#0x00,4
.endm

.macro ST16
.mparam src,dst
    SBBO    src,dst,#0x00,2
.endm

.macro ST8
.mparam src,dst
    SBBO    src,dst,#0x00,1
.endm


#define sp r0
#define lr r23
#define STACK_TOP       (0x2000 - 4)
#define STACK_BOTTOM    (0x2000 - 0x200)

#define NOP       mov r0, r0

.macro stack_init
    mov     sp, STACK_BOTTOM
.endm

.macro push
.mparam reg, cnt
    sbbo    reg, sp, 0, 4*cnt
    add     sp, sp, 4*cnt
.endm

.macro pop
.mparam reg, cnt
    sub     sp, sp, 4*cnt
    lbbo    reg, sp, 0, 4*cnt
.endm

.macro INCREMENT
.mparam reg
    add reg, reg, 1
.endm

.macro DECREMENT
.mparam reg
    sub reg, reg, 1
.endm


// Sleep a given number of nanoseconds with 10 ns resolution.
//
// This busy waits for a given number of cycles.  Not for use
// with things that must happen on a tight schedule.
//
.macro SLEEPNS
.mparam ns,inst,lab
	MOV r_sleep_counter, (ns/5)-1-inst // ws2811 -- high speed
lab:
	SUB r_sleep_counter, r_sleep_counter, 1
	QBNE lab, r_sleep_counter, 0
.endm


// Wait for the cycle counter to reach a given value
.macro WAITNS
.mparam ns,lab
	MOV r_temp_addr, PRU_CONTROL_ADDRESS // control register

lab:
	LBBO r_sleep_counter, r_temp_addr, 0xC, 2 // read the cycle counter
	QBGT lab, r_sleep_counter, (ns)/5
.endm

// Used after WAITNS to jump to a label if too much time has elapsed
.macro WAIT_TIMEOUT
.mparam timeoutNs, timeoutLabel
    // Check that we haven't waited too long (waiting for memory, etc...) and if we have, jump to a timeout label
    MOV r_sleep_counter, (timeoutNs)/5
    QBGT timeoutLabel, r_sleep_counter, r_temp1
.endm

// Reset the cycle counter
.macro RESET_COUNTER
		// Disable the counter and clear it, then re-enable it
		MOV r_temp_addr, PRU_CONTROL_ADDRESS // control register
		LBBO r_temp1, r_temp_addr, 0, 4
		CLR r_temp1, r_temp1, 3 // disable counter bit
		SBBO r_temp1, r_temp_addr, 0, 4 // write it back

		MOV r_temp1, 12
		SBBO r_temp1, r_temp_addr, 0x0C, 4 // clear the timer

		LBBO r_temp1, r_temp_addr, 0, 4
		SET r_temp1, r_temp1, 3 // enable counter bit
		SBBO r_temp1, r_temp_addr, 0, 4 // write it back

		// Read the current counter value
		// Should be zero.
		// LBBO r_sleep_counter, r_temp_addr, 0xC, 4
.endm

// Send an interrupt to the ARM
.macro RAISE_ARM_INTERRUPT
	#ifdef AM33XX
		MOV R31.b0, PRU_ARM_INTERRUPT+16
	#else
		MOV R31.b0, PRU_ARM_INTERRUPT
	#endif
.endm

// ***************************************
// *    Global Structure Definitions     *
// ***************************************

// Mappings of the GPIO devices
#define GPIO0 0x44E07000
#define GPIO1 0x4804c000
#define GPIO2 0x481AC000
#define GPIO3 0x481AE000

// Offsets for the clear and set registers in the devices
#define GPIO_CLEARDATAOUT 0x190
#define GPIO_SETDATAOUT 0x194

// #define NOP       mov r0, r0
