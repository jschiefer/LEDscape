import { pinData, pinIndex, BbbPinInfo } from '../bbbPinData'

export class PruRegister {
	constructor(
		public name: string,
		public offset: number,
		public size: number
	) {}

	toString() {
		return this.name;
	}
}

export class PruWholeRegister extends PruRegister {
	constructor(
		public index: number
	) {
		super("r" + index, 0, 32);
	}

	public w0 = new PruRegister(this.name + ".w0", 0, 16);
	public w1 = new PruRegister(this.name + ".w1", 16, 16);

	public b0 = new PruRegister(this.name + ".b0", 0, 16);
	public b1 = new PruRegister(this.name + ".b1", 8, 16);
	public b2 = new PruRegister(this.name + ".b2", 16, 16);
	public b3 = new PruRegister(this.name + ".b3", 24, 16);
}

export class GeneratedPruProgram {
	constructor(
		public pruCode: string,
		public usedPins: BbbPinInfo[]
	) {}
}

/**
 * Base PRU Program class which provides very little setup.
 */
export abstract class BasePruProgram {
	protected pruCode = "";
	protected pruWhitespace = [];
	protected labelCounter = 0;

	constructor(
		public PRU_NUM: number
	) {}

	public generate() {
		return new GeneratedPruProgram(
			this.pruCode,
			pinIndex.pinData.filter(pin => pin.pruIndex === this.PRU_NUM)
		)
	}

	protected get pruPins(): BbbPinInfo[] {
		return pinIndex.pinsByPruAndPin[this.PRU_NUM];
	}

	protected nextLabel(prefix) { return prefix + this.labelCounter ++ }

	protected emitLine(s?: string) {
		this.pruCode += (s === undefined ? "" : (this.pruWhitespace.join("") + s)) + "\n";
	}
	
	protected emitLabel(s, skipNewLine?:boolean): string {
		if (!s) {
			s = "_label_" + (++this.labelCounter);
		}
		if (! skipNewLine) {
			this.emitLine();
		}
		this.emitLine(s + ":");
		return s;
	}

	protected pruBlock(arg1?: string | { (): void }, arg2?: { (): void }) {
		var code: { (): void };

		if (typeof(arg1) === "string") {
			this.emitComment(arg1);
			code = arg2;
		} else {
			code = <{(): void}>arg1;
		}

		this.pruWhitespace.push("  ");
		try {
			return code();
		} finally {
			this.pruWhitespace.pop();
		}
	}


// Generic instructions
	protected emitInstr(
		name: string,
		args: any[],
		comment?: string
	) {
		var code = name;

		if (args) {
			for (var i = 0; i < args.length; i++) {
				if (i > 0) code+= ", ";
				else code += " ";
				if (isNaN(args[i])) {
					code += args[i];
				} else {
					code += this.toNumericLiteral(args[i]);
				}
			}
		}
		code += ";";
		if (comment) {
			code += " // " + comment;
		}
		this.emitLine(code);
	}

	protected emitComment(s) {
		this.emitLine("// " + s);
	}

	protected toNumericLiteral(n) {
		n = parseInt(n);
		if (n < 256) {
			return n + "";
		} else {
			return this.toHexLiteral(n);
		}
	}

	protected toHexLiteral(n) {
		if (n < 0) {
			n = 0xFFFFFFFF + n + 1;
		}
		var s =  n.toString(16).toUpperCase();
		while (s.length % 2 != 0) {
			s = "0" + s;
		}
		return "0x" + s;
	}

	protected ADC(dest: PruRegister, src: PruRegister, op: PruRegister | number)  { this.emitInstr("ADC", [ dest, src, op ]);  }
	protected ADD(dest: PruRegister, src: PruRegister, op: PruRegister | number)  { this.emitInstr("ADD", [ dest, src, op ], dest + " = " + src + " + " + op);  }
	protected SUB(dest: PruRegister, src: PruRegister, op: PruRegister | number)  { this.emitInstr("SUB", [ dest, src, op ], dest + " = " + src + " - " + op);  }
	protected SUC(dest: PruRegister, src: PruRegister, op: PruRegister | number)  { this.emitInstr("SUC", [ dest, src, op ]);  }
	protected RSB(dest: PruRegister, src: PruRegister, op: PruRegister | number)  { this.emitInstr("RSB", [ dest, src, op ]);  }
	protected RSC(dest: PruRegister, src: PruRegister, op: PruRegister | number)  { this.emitInstr("RSC", [ dest, src, op ]);  }
	protected LSL(dest: PruRegister, src: PruRegister, op: PruRegister | number)  { this.emitInstr("LSL", [ dest, src, op ]);  }
	protected LSR(dest: PruRegister, src: PruRegister, op: PruRegister | number)  { this.emitInstr("LSR", [ dest, src, op ]);  }
	protected AND(dest: PruRegister, src: PruRegister, op: PruRegister | number)  { this.emitInstr("AND", [ dest, src, op ]);  }
	protected  OR(dest: PruRegister, src: PruRegister, op: PruRegister | number)  { this.emitInstr("OR",  [ dest, src, op ]);  }
	protected XOR(dest: PruRegister, src: PruRegister, op: PruRegister | number)  { this.emitInstr("XOR", [ dest, src, op ]);  }
	protected NOT(dest: PruRegister, src: PruRegister    )  { this.emitInstr("NOT", [ dest, src ]);  }
	protected MIN(dest: PruRegister, src: PruRegister, op: PruRegister | number)  { this.emitInstr("MIN", [ dest, src, op ]);  }
	protected MAX(dest: PruRegister, src: PruRegister, op: PruRegister | number)  { this.emitInstr("MAX", [ dest, src, op ]);  }
	protected CLR(dest: PruRegister, src: PruRegister, op: PruRegister | number)  { this.emitInstr("CLR", [ dest, src, op ]);  }
	protected SET(dest: PruRegister, src: PruRegister, op: PruRegister | number)  { this.emitInstr("SET", [ dest, src, op ]);  }
	protected SCAN(Rn, op) { this.emitInstr("SCAN", [ Rn, op ]); }
	protected LMBD(dest: PruRegister, src: PruRegister, op: number) { this.emitInstr("LMBD", [dest, src, op]); }
	protected MOV(dest: PruRegister, op)  { this.emitInstr("MOV", [dest, op]);  }
	protected LDI(dest: PruRegister, op)  { this.emitInstr("LDI", [dest, op]);  }
	protected LBBO(srcReg: PruRegister, addrReg: PruRegister, addrOffset: number, byteCount: number) {
		this.emitInstr(
			"LBBO",
			[ srcReg, addrReg, addrOffset, byteCount ],
			(addrOffset == 0 && byteCount == 4)
				? ("store the value of " + srcReg + " into &" + addrReg)
				: ("store " + byteCount + " bytes into " + addrReg + " + " + addrOffset + " from registers starting at " + srcReg)
		);
	}
	protected SBBO(destReg: PruRegister, addrReg: PruRegister, addrOffset: number, byteCount: number) {
		this.emitInstr(
			"SBBO",
			[ destReg, addrReg, addrOffset, byteCount ],
			"copy " + byteCount + " bytes into *(" + addrReg + " + " + addrOffset + ") from registers starting at " + destReg
		);
	}
	protected LBCO(dest: PruRegister, constName: string, addrOffset: number, byteCount: number) { this.emitInstr("LBCO", [ dest, constName, addrOffset, byteCount ]); }
	protected SBCO(dest: PruRegister, constName: string, addrOffset: number, byteCount: number) { this.emitInstr("SBCO", [ dest, constName, addrOffset, byteCount ]); }
	// protected LFC()  { this.emitInstr("LFC", arguments);  } // Deprecated
	// protected STC()  { this.emitInstr("STC", arguments);  } // Deprecated
	protected ZERO(startReg: PruRegister, byteCount: PruRegister|number) { this.emitInstr("ZERO", [ startReg, byteCount ]); }
	//protected MVIB() { this.emitInstr("MVIB", arguments); }
	//protected MVIW() { this.emitInstr("MVIW", arguments); }
	//protected MVID() { this.emitInstr("MVID", arguments); }
	protected JMP(label: string)  { this.emitInstr("JMP", [ label ]); }
	protected JAL(reg: PruRegister, label: string)  { this.emitInstr("JAL", [ reg, label ]); }
	protected CALL(label) { this.emitInstr("CALL", [ label ]); }
	protected RET()  { this.emitInstr("RET", []);  }
	protected QBGT(label: string, reg: PruRegister, op) { this.emitInstr("QBGT", [ label, reg, op ]); }
	protected QBGE(label: string, reg: PruRegister, op) { this.emitInstr("QBGE", [ label, reg, op ]); }
	protected QBLT(label: string, reg: PruRegister, op) { this.emitInstr("QBLT", [ label, reg, op ]); }
	protected QBLE(label: string, reg: PruRegister, op) { this.emitInstr("QBLE", [ label, reg, op ]); }
	protected QBEQ(label: string, reg: PruRegister, op) { this.emitInstr("QBEQ", [ label, reg, op ]); }
	protected QBNE(label: string, reg: PruRegister, op) { this.emitInstr("QBNE", [ label, reg, op ]); }
	protected QBA(label: string)  { this.emitInstr("QBA", [ label ]);  }
	protected QBBS(label: string, reg: PruRegister, bit: number | PruRegister) {
		this.emitInstr("QBBS", [ label, reg, bit ], "if (" + reg + " & (1 << " + bit + ") != 0) goto " + label);
	}
	protected QBBC(label: string, reg: PruRegister, bit: number | PruRegister) {
		this.emitInstr("QBBC", [ label, reg, bit ], "if (" + reg + " & (1 << " + bit + ") == 0) goto " + label);
	}
	protected WBS(reg: PruRegister, bit: number | PruRegister)  { this.emitInstr("WBS", [ reg, bit ]);  }
	protected WBC(reg: PruRegister, bit: number | PruRegister)  { this.emitInstr("WBC", [ reg, bit ]);  }
	protected HALT() { this.emitInstr("HALT", []); }
	protected SLP()  { this.emitInstr("SLP", []);  }

	protected ST32(src: PruRegister, dst: PruRegister) { this.emitInstr("ST32", [src, dst]); }
	protected NOP() { this.MOV(this.r0, this.r0); }
	protected DECREMENT(r: PruRegister) { this.emitInstr("DECREMENT", [r], r + " --"); }


	protected currentWaitNs = 0;
	protected RESET_COUNTER(tempReg = this.r_temp1) {
		this.currentWaitNs = 0;

		// Disable the counter and clear it, then re-enable it
		this.MOV(this.r_temp_addr, "PRU_CONTROL_ADDRESS"); // control register
		this.LBBO(tempReg, this.r_temp_addr, 0, 4);
		this.CLR(tempReg, tempReg, 3); // disable counter bit
		this.SBBO(tempReg, this.r_temp_addr, 0, 4); // write it back

		this.MOV(tempReg, 12);
		this.SBBO(tempReg, this.r_temp_addr, 0x0C, 4); // clear the timer

		this.LBBO(tempReg, this.r_temp_addr, 0, 4);
		this.SET(tempReg, tempReg, 3); // enable counter bit
		this.SBBO(tempReg, this.r_temp_addr, 0, 4); // write it back
	}
	protected RAISE_ARM_INTERRUPT() { this.emitInstr("RAISE_ARM_INTERRUPT", []); }

	protected WAITNS(waitNs: number, waitLabel: string) {

		this.MOV(this.r_temp_addr, "PRU_CONTROL_ADDRESS");
		this.emitLabel(waitLabel);

		this.LBBO(this.r_temp1, this.r_temp_addr, 0xC, 4);
		this.QBGT(waitLabel, this.r_temp1, waitNs/5)
	}
	protected WAIT_TIMEOUT(timeoutNs: number, timeoutLabel: string) { this.emitInstr("WAIT_TIMEOUT", [timeoutNs, timeoutLabel]); }
	protected SLEEPNS(sleepNs: number, sleepLabel: string) {
		this.MOV(this.r_temp_addr, sleepNs / 5 - 1);
		this.emitLabel(sleepLabel);
		this.SUB(this.r_temp_addr, this.r_temp_addr, 1);
		this.QBNE(sleepLabel, this.r_temp_addr, 0);
	}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	protected r0  = new PruWholeRegister( 0);
	protected r1  = new PruWholeRegister( 1);
	protected r2  = new PruWholeRegister( 2);
	protected r3  = new PruWholeRegister( 3);
	protected r4  = new PruWholeRegister( 4);
	protected r5  = new PruWholeRegister( 5);
	protected r6  = new PruWholeRegister( 6);
	protected r7  = new PruWholeRegister( 7);
	protected r8  = new PruWholeRegister( 8);
	protected r9  = new PruWholeRegister( 9);
	protected r10 = new PruWholeRegister(10);
	protected r11 = new PruWholeRegister(11);
	protected r12 = new PruWholeRegister(12);
	protected r13 = new PruWholeRegister(13);
	protected r14 = new PruWholeRegister(14);
	protected r15 = new PruWholeRegister(15);
	protected r16 = new PruWholeRegister(16);
	protected r17 = new PruWholeRegister(17);
	protected r18 = new PruWholeRegister(18);
	protected r19 = new PruWholeRegister(19);
	protected r20 = new PruWholeRegister(20);
	protected r21 = new PruWholeRegister(21);
	protected r22 = new PruWholeRegister(22);
	protected r23 = new PruWholeRegister(23);
	protected r24 = new PruWholeRegister(24);
	protected r25 = new PruWholeRegister(25);
	protected r26 = new PruWholeRegister(26);
	protected r27 = new PruWholeRegister(27);
	protected r28 = new PruWholeRegister(28);
	protected r29 = new PruWholeRegister(29);
	protected r30 = new PruWholeRegister(30);
	protected r31 = new PruWholeRegister(31);

	protected C0  = 'C0';
	protected C1  = 'C1';
	protected C2  = 'C2';
	protected C3  = 'C3';
	protected C4  = 'C4';
	protected C5  = 'C5';
	protected C6  = 'C6';
	protected C7  = 'C7';
	protected C8  = 'C8';
	protected C9  = 'C9';
	protected C10 = 'C10';
	protected C11 = 'C11';
	protected C12 = 'C12';
	protected C13 = 'C13';
	protected C14 = 'C14';
	protected C15 = 'C15';
	protected C16 = 'C16';
	protected C17 = 'C17';
	protected C18 = 'C18';
	protected C19 = 'C19';
	protected C20 = 'C20';
	protected C21 = 'C21';
	protected C22 = 'C22';
	protected C23 = 'C23';
	protected C24 = 'C24';
	protected C25 = 'C25';
	protected C26 = 'C26';
	protected C27 = 'C27';
	protected C28 = 'C28';
	protected C29 = 'C29';
	protected C30 = 'C30';
	protected C31 = 'C31';

	///////////////////////////////////////////////////////////////////////////////////
	// Temp and Control Registers
	protected r_data_addr     = this.r0;
	protected r_bit_num       = this.r2.b2;
	protected r_data_len      = this.r2.w0;
	protected r_temp_addr     = this.r3;
	protected r_temp1         = this.r4;
	protected r_temp2         = this.r29;
	protected r_temp3         = this.r1;
	protected r_temp4         = this.r30;
	protected r_data_len2     = this.r29.w0;

	protected r_bit_regs = [
		this.r_data_addr,
		this.r_temp2,
		this.r_temp3,
		this.r_temp4
	];
	///////////////////////////////////////////////////////////////////////////////////

	protected r_data0         = this.r5;
	protected r_data1         = this.r6;
	protected r_data2         = this.r7;
	protected r_data3         = this.r8;
	protected r_data4         = this.r9;
	protected r_data5         = this.r10;
	protected r_data6         = this.r11;
	protected r_data7         = this.r12;
	protected r_data8         = this.r13;
	protected r_data9         = this.r14;
	protected r_data10        = this.r15;
	protected r_data11        = this.r16;
	protected r_data12        = this.r17;
	protected r_data13        = this.r18;
	protected r_data14        = this.r19;
	protected r_data15        = this.r20;
	protected r_data16        = this.r21;
	protected r_data17        = this.r22;
	protected r_data18        = this.r23;
	protected r_data19        = this.r24;
	protected r_data20        = this.r25;
	protected r_data21        = this.r26;
	protected r_data22        = this.r27;
	protected r_data23        = this.r28;

	protected r_datas: PruRegister[] = [
		this.r_data0, this.r_data1,  this.r_data2,  this.r_data3,  this.r_data4,  this.r_data5,  this.r_data6,
		this.r_data7,  this.r_data8,  this.r_data9,  this.r_data10, this.r_data11, this.r_data12, this.r_data13,
		this.r_data14, this.r_data15, this.r_data16, this.r_data17, this.r_data18, this.r_data19, this.r_data20,
		this.r_data21, this.r_data22, this.r_data23
	];

	protected PRU0_PRU1_INTERRUPT = 17;
	protected PRU1_PRU0_INTERRUPT = 18;
	protected PRU0_ARM_INTERRUPT  = 19;
	protected PRU1_ARM_INTERRUPT  = 20;
	protected ARM_PRU0_INTERRUPT  = 21;
	protected ARM_PRU1_INTERRUPT  = 22;

	protected CONST_PRUDRAM       = this.C24;
	protected CONST_SHAREDRAM     = this.C28;
	protected CONST_L3RAM         = this.C30;
	protected CONST_DDR           = this.C31;

// Address for the Constant table Programmable Pointer Register 0(CTPPR_0)
	protected CTBIR_0 = '0x22020';
// Address for the Constant table Programmable Pointer Register 0(CTPPR_0)
	protected CTBIR_1 = '0x22024';

// Address for the Constant table Programmable Pointer Register 0(CTPPR_0)
	protected CTPPR_0 = '0x22028';
// Address for the Constant table Programmable Pointer Register 1(CTPPR_1)
	protected CTPPR_1 = '0x2202C';

	protected sp           = this.r0;
	protected lr           = this.r23;
	protected STACK_TOP    = (0x2000 - 4);
	protected STACK_BOTTOM = (0x2000 - 0x200);


	/** Mappings of the GPIO devices */
	protected GPIO0 = 0x44E07000;
	protected GPIO1 = 0x4804c000;
	protected GPIO2 = 0x481AC000;
	protected GPIO3 = 0x481AE000;
	protected GPIO_ADDRS = [this.GPIO0, this.GPIO1, this.GPIO2, this.GPIO3];

	/** Offsets for the clear and set registers in the devices */
	protected GPIO_CLEARDATAOUT = 0x190;
	protected GPIO_SETDATAOUT = 0x194;

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	protected PRU_CONTROL_ADDRESS = this.PRU_NUM === 0 ? '0x22000' : '0x24000';
	protected PRU_ARM_INTERRUPT = this.PRU_NUM === 0 ? this.PRU0_ARM_INTERRUPT : this.PRU1_ARM_INTERRUPT;

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	protected INIT_PRU() {
		var g = this;

		g.emitLine("#define PRU" + this.PRU_NUM);
		g.emitLine('#include "common.p.h"');
		g.emitComment("Intialize the PRU");

		g.emitLine("START:");

		g.emitComment('Enable OCP master port');
		g.emitComment('clear the STANDBY_INIT bit in the SYSCFG register,');
		g.emitComment('otherwise the PRU will not be able to write outside the');
		g.emitComment('PRU memory space and to the BeagleBone\'s pins.');
		g.LBCO(g.r0, g.C4, 4, 4);
		g.CLR(g.r0, g.r0, 4);
		g.SBCO(g.r0, g.C4, 4, 4);

		g.emitComment('Configure the programmable pointer register for PRU0 by setting');
		g.emitComment('c28_pointer[15:0] field to 0x0120.  This will make C28 point to');
		g.emitComment('0x00012000 (PRU shared RAM).');
		g.MOV(g.r0, '0x00000120');
		g.MOV(g.r1, g.CTPPR_0);
		g.ST32(g.r0, g.r1);

		g.emitComment('Configure the programmable pointer register for PRU0 by setting');
		g.emitComment('c31_pointer[15:0] field to 0x0010.  This will make C31 point to');
		g.emitComment('0x80001000 (DDR memory).');
		g.MOV(g.r0, '0x00100000');
		g.MOV(g.r1, g.CTPPR_1);
		g.ST32(g.r0, g.r1);

		g.emitComment('Write a 0x1 into the response field so that they know we have started');
		g.MOV(g.r2, 1);
		g.SBCO(g.r2, g.CONST_PRUDRAM, 12, 4);
		g.MOV(g.r20, '0xFFFFFFFF');
	}



	protected lastGpioPrepBank = -1;

	protected PREP_GPIO_FOR_CLEAR(gpioBank: number) {
		this.emitComment("Prep GPIO address register for CLEAR on GPIO bank " + gpioBank);
		this.MOV(this.r_temp_addr, this.GPIO_ADDRS[gpioBank] | this.GPIO_CLEARDATAOUT);
		this.lastGpioPrepBank = gpioBank;
	}

	protected PREP_GPIO_FOR_SET(gpioBank: number) {
		this.emitComment("Prep GPIO address register for SET on GPIO bank " + gpioBank);
		this.MOV(this.r_temp_addr, this.GPIO_ADDRS[gpioBank] | this.GPIO_SETDATAOUT);
		this.lastGpioPrepBank = gpioBank;
	}

	protected APPLY_GPIO_CHANGES(maskReg: PruRegister = this.r_temp1) {
		this.emitComment("Apply GPIO bank " + this.lastGpioPrepBank + " changes");
		this.SBBO(maskReg, this.r_temp_addr, 0, 4);
	}

	/**
	 * Zeros the registers used to store which bits should be one for each GPIO bank
	 */
	protected RESET_GPIO_MASK() {
		this.emitComment("Reset GPIO one registers");
		this.MOV(this.r_temp1, 0);
	}

	/**
	 * Checks if the given pin is zero, and clears the corresponding r30 bit in the given register.
	 *
	 * @param pin The pin whose bit should be tested
	 * @param r30Reg Register where the R30 bit should be set.
	 */
	protected TEST_BIT_ZERO_R30(pin: BbbPinInfo, r30Reg: PruRegister = this.r_temp2) {
		var label_name = "channel_" + pin.pruDataChannel + "_zero_skip";

		this.emitComment("Test if pin (pruDataChannel=" + pin.pruDataChannel + ", global="+pin.dataChannelIndex+") is ZERO and SET bit " + pin.r30bit + " in " + r30Reg + " for use with r30");
		this.QBBS(label_name, this.r_datas[pin.dataChannelIndex], this.r_bit_num);
		this.CLR(r30Reg, r30Reg, pin.r30bit);
		this.emitLabel(label_name, true);
	}

	/**
	 * Checks if the bit indexed by the r_bit_num register in the regN register is a zero, and if so, sets the bit in the
	 * corresponding _zeros register. CHANNEL_BANK_NAME and CHANNEL_BIT are used to lookup the bank and bit num.
	 *
	 * @param pin The pin whose bit should be tested
	 * @param gpioReg Register where the GPIO bit should be set.
	 */
	protected TEST_BIT_ZERO(pin: BbbPinInfo, gpioReg: PruRegister = this.r_temp1) {
		var label_name = "channel_" + pin.pruDataChannel + "_zero_skip";

		this.emitComment("Test if pin (pruDataChannel=" + pin.pruDataChannel + ", global="+pin.dataChannelIndex+") is ZERO and SET bit " + pin.gpioBit + " in GPIO" + pin.gpioBank + " register");
		this.QBBS(label_name, this.r_datas[pin.pruDataChannel], this.r_bit_num);
		this.SET(gpioReg, gpioReg, pin.gpioBit);
		this.emitLabel(label_name, true);
	}

	/**
	 * Checks if the bit indexed by the r_bit_num register in the regN register is a one, and if so, sets the bit in the
	 * corresponding _ones register. CHANNEL_BANK_NAME and CHANNEL_BIT are used to lookup the bank and bit num.
	 *
	 * @param pin The pin whose bit should be tested
	 * @param gpioReg Register where the GPIO bit should be set.
	 */
	protected TEST_BIT_ONE(pin: BbbPinInfo, gpioReg: PruRegister = this.r_temp1) {
		var label_name = "channel_" + pin.pruDataChannel + "_one_skip";

		this.emitComment("Test if pin (pruDataChannel=" + pin.pruDataChannel + ", global="+pin.dataChannelIndex+") is ONE and SET bit " + pin.gpioBit + " in GPIO" + pin.gpioBank + " register");

		this.QBBC(label_name, this.r_datas[pin.pruDataChannel], this.r_bit_num);
		this.SET(gpioReg, gpioReg, pin.gpioBit);
		this.emitLabel(label_name, true);
	}

	protected shortNameForPin(pin: BbbPinInfo) {
		return pin.mappedChannelIndex >= 0 ? pin.mappedChannelIndex : pin.gpioFullName;
	}

	protected LOAD_CHANNEL_DATA(firstPin: BbbPinInfo, firstChannel: number, channelCount: number) {
		//this.emitComment("Load the data address from the constant table");
		//this.LBCO(this.r_data_addr, this.CONST_PRUDRAM, 0, 4);

		this.emitComment("Load " + channelCount + " channels of data into data registers");
		this.LBBO(
			this.r_data0,
			this.r_data_addr,
			firstPin.dataChannelIndex*4 + firstChannel*4,
			channelCount*4
		);
	}

	protected PREP_GPIO_MASK_FOR_PINS_R30(pins: BbbPinInfo[], reg: PruRegister = this.r_temp1) {
		this.emitComment("Set " + reg + " with a mask for setting or clearing channels " + pins.map(this.shortNameForPin).join(", "));

		var mask = 0;

		pins.forEach((pin) => {
			mask |= 1 << pin.r30bit;
		});

		this.MOV(reg, this.toHexLiteral(mask));
	}

	protected PREP_GPIO_MASK_FOR_PINS(pins: BbbPinInfo[]) {
		this.emitComment("Set the GPIO (bank " + pins[0].gpioBank + ") mask register for setting or clearing channels " + pins.map(this.shortNameForPin).join(", "));

		var mask = 0;
		var bank = -1;

		pins.forEach((pin) => {
			if (bank != -1 && bank != pin.gpioBank) {
				throw new Error("Cannot load mask for multiple GPIO banks: " + pins);
			} else {
				bank = pin.gpioBank;
			}

			mask |= 1 << pin.gpioBit;
		});

		this.MOV(this.r_temp1, this.toHexLiteral(mask));
	}

	protected groupByBank(
		allPins: BbbPinInfo[],
		callback: (
			bankPins: BbbPinInfo[],
			bankIndex: number,
			usedBankIndex: number,
			usedBankCount: number
		) => void
	) {
		var pinsByBank = [[], [], [], []];
		allPins.forEach((pin) => {
			pinsByBank[pin.gpioBank].push(pin);
		});

		var usedBanks = pinsByBank.filter(bankPins => bankPins.length > 0);
		var multipleBanksUsed = usedBanks.length > 1;

		var usedBankIndex = 0;
		pinsByBank.forEach((pins, bankIndex) => {
			if (pins.length > 0) {
				if (multipleBanksUsed) {
					this.pruBlock(
						"Bank " + bankIndex,
						() => callback(pins, bankIndex, usedBankIndex ++, usedBanks.length)
					);
				} else {
					callback(pins, bankIndex, usedBankIndex ++, usedBanks.length);
				}
			}
		});
	}


	protected PINS_HIGH(pins: BbbPinInfo[], pinsLabel?: string) {
		this.emitComment((pinsLabel || "") + ' Pins HIGH: ' + pins.map(this.shortNameForPin).join(", "));

		this.pruBlock(() => {
			this.groupByBank(pins, (pins, gpioBank) => {
				this.PREP_GPIO_FOR_SET(gpioBank);
				this.PREP_GPIO_MASK_FOR_PINS(pins);
				this.APPLY_GPIO_CHANGES();
			});
		});
	}

	protected PINS_LOW_R30(pins: BbbPinInfo[], pinsLabel?: string) {
		this.emitComment((pinsLabel || "") + ' Pins LOW: ' + pins.map(this.shortNameForPin).join(", "));
		this.MOV(this.r_temp2, this.toHexLiteral(0xFFFFFFFF ^ pins.map(p => 1 << p.r30bit).reduce((a,b) => a|b)));
		this.AND(this.r30, this.r30, this.r_temp2);
	}

	protected PINS_HIGH_R30(pins: BbbPinInfo[], pinsLabel?: string) {
		this.emitComment((pinsLabel || "") + ' Pins LOW: ' + pins.map(this.shortNameForPin).join(", "));
		this.MOV(this.r_temp2, this.toHexLiteral(pins.map(p => 1 << p.r30bit).reduce((a,b) => a|b)));
		this.OR(this.r30, this.r30, this.r_temp2);
	}

	protected PINS_LOW(pins: BbbPinInfo[], pinsLabel?: string) {
		this.emitComment((pinsLabel || "") + ' Pins LOW: ' + pins.map(this.shortNameForPin).join(", "));

		this.pruBlock(() => {
			this.groupByBank(pins, (pins, gpioBank) => {
				this.PREP_GPIO_FOR_CLEAR(gpioBank);
				this.PREP_GPIO_MASK_FOR_PINS(pins);
				this.APPLY_GPIO_CHANGES();
			});
		});
	}

	protected PINS_HIGH_LOW(pins: BbbPinInfo[], pinsLabel?: string) {
		this.emitComment((pinsLabel || "") + ' Pins HIGH-LOW pulse: ' + pins.map(this.shortNameForPin).join(", "));

		this.pruBlock(() => {
			this.groupByBank(pins, (pins, gpioBank) => {
				this.PREP_GPIO_MASK_FOR_PINS(pins);

				this.PREP_GPIO_FOR_SET(gpioBank);
				this.APPLY_GPIO_CHANGES();

				this.PREP_GPIO_FOR_CLEAR(gpioBank);
				this.APPLY_GPIO_CHANGES();
			});
		});
	}
}

export abstract class BaseSetupPruProgram extends BasePruProgram {
	constructor(
		PRU_NUM: number,
		protected overallChannelCount: number
	) {
		super(PRU_NUM);
	}

	public generate():GeneratedPruProgram {
		var g = this;

		this.fileHeader();

		g.INIT_PRU();
		g.RESET_COUNTER();

		var _exit = "EXIT";

		g.emitComment("Wait for the start condition from the main program to indicate");
		g.emitComment("that we have a rendered frame ready to clock out.  This also");
		g.emitComment("handles the exit case if an invalid value is written to the start");
		g.emitComment("start position.");
		var l_main_loop = g.emitLabel("main_loop");
		g.SLEEPNS(7000, "frame_break");

		g.emitComment("Let ledscape know that we're starting the loop again. It waits for this");
		g.emitComment("interrupt before sending another frame");
		g.RAISE_ARM_INTERRUPT();

		g.emitComment("Load the pointer to the buffer from PRU DRAM into r0 and the");
		g.emitComment("length (in bytes-bit words) into r1.");
		g.emitComment("start command into r2");
		g.LBCO(g.r_data_addr, g.CONST_PRUDRAM, 0, 12);

		g.emitComment("Wait for a non-zero command");
		g.QBEQ(l_main_loop, g.r2, 0);

		g.emitComment("Zero out the start command so that they know we have received it");
		g.emitComment("This allows maximum speed frame drawing since they know that they");
		g.emitComment("can now swap the frame buffer pointer and write a new start command.");
		g.MOV(g.r3, 0);
		g.SBCO(g.r3, g.CONST_PRUDRAM, 8, 4);

		g.emitComment("Command of 0xFF is the signal to exit");
		g.QBEQ(_exit, g.r2, 0xFF);

		g.emitComment("Reset the sleep timer");

		g.RESET_COUNTER();

		g.emitComment("Move the length into it's register");
		g.MOV(g.r_data_len, g.r1);

		this.frameCode();

		// Write out that we are done!
		// Store a non-zero response in the buffer so that they know that we are done
		// aso a quick hack, we write the counter so that we know how
		// long it took to write out.
		g.MOV(g.r8, g.PRU_CONTROL_ADDRESS); // control register
		g.LBBO(g.r2, g.r8, 0xC, 4);
		g.SBCO(g.r2, g.CONST_PRUDRAM, 12, 4);

		// Go back to waiting for the next frame buffer
		g.RESET_COUNTER();
		g.QBA(l_main_loop);

		g.emitLabel(_exit);
		// Write a 0xFF into the response field so that they know we're done
		g.MOV(g.r2, 0xFF);
		g.SBCO(g.r2, g.CONST_PRUDRAM, 12, 4);

		g.RAISE_ARM_INTERRUPT();
		g.HALT();

		return super.generate();
	}

	protected abstract fileHeader();
	protected abstract frameCode();
}