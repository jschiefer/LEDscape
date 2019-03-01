var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var bbbPinData_1 = require('../bbbPinData');
var PruRegister = (function () {
    function PruRegister(name, offset, size) {
        this.name = name;
        this.offset = offset;
        this.size = size;
    }
    PruRegister.prototype.toString = function () {
        return this.name;
    };
    return PruRegister;
})();
exports.PruRegister = PruRegister;
var PruWholeRegister = (function (_super) {
    __extends(PruWholeRegister, _super);
    function PruWholeRegister(index) {
        _super.call(this, "r" + index, 0, 32);
        this.index = index;
        this.w0 = new PruRegister(this.name + ".w0", 0, 16);
        this.w1 = new PruRegister(this.name + ".w1", 16, 16);
        this.b0 = new PruRegister(this.name + ".b0", 0, 16);
        this.b1 = new PruRegister(this.name + ".b1", 8, 16);
        this.b2 = new PruRegister(this.name + ".b2", 16, 16);
        this.b3 = new PruRegister(this.name + ".b3", 24, 16);
    }
    return PruWholeRegister;
})(PruRegister);
exports.PruWholeRegister = PruWholeRegister;
var GeneratedPruProgram = (function () {
    function GeneratedPruProgram(pruCode, usedPins) {
        this.pruCode = pruCode;
        this.usedPins = usedPins;
    }
    return GeneratedPruProgram;
})();
exports.GeneratedPruProgram = GeneratedPruProgram;
/**
 * Base PRU Program class which provides very little setup.
 */
var BasePruProgram = (function () {
    function BasePruProgram(PRU_NUM) {
        this.PRU_NUM = PRU_NUM;
        this.pruCode = "";
        this.pruWhitespace = [];
        this.labelCounter = 0;
        this.currentWaitNs = 0;
        ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
        this.r0 = new PruWholeRegister(0);
        this.r1 = new PruWholeRegister(1);
        this.r2 = new PruWholeRegister(2);
        this.r3 = new PruWholeRegister(3);
        this.r4 = new PruWholeRegister(4);
        this.r5 = new PruWholeRegister(5);
        this.r6 = new PruWholeRegister(6);
        this.r7 = new PruWholeRegister(7);
        this.r8 = new PruWholeRegister(8);
        this.r9 = new PruWholeRegister(9);
        this.r10 = new PruWholeRegister(10);
        this.r11 = new PruWholeRegister(11);
        this.r12 = new PruWholeRegister(12);
        this.r13 = new PruWholeRegister(13);
        this.r14 = new PruWholeRegister(14);
        this.r15 = new PruWholeRegister(15);
        this.r16 = new PruWholeRegister(16);
        this.r17 = new PruWholeRegister(17);
        this.r18 = new PruWholeRegister(18);
        this.r19 = new PruWholeRegister(19);
        this.r20 = new PruWholeRegister(20);
        this.r21 = new PruWholeRegister(21);
        this.r22 = new PruWholeRegister(22);
        this.r23 = new PruWholeRegister(23);
        this.r24 = new PruWholeRegister(24);
        this.r25 = new PruWholeRegister(25);
        this.r26 = new PruWholeRegister(26);
        this.r27 = new PruWholeRegister(27);
        this.r28 = new PruWholeRegister(28);
        this.r29 = new PruWholeRegister(29);
        this.r30 = new PruWholeRegister(30);
        this.r31 = new PruWholeRegister(31);
        this.C0 = 'C0';
        this.C1 = 'C1';
        this.C2 = 'C2';
        this.C3 = 'C3';
        this.C4 = 'C4';
        this.C5 = 'C5';
        this.C6 = 'C6';
        this.C7 = 'C7';
        this.C8 = 'C8';
        this.C9 = 'C9';
        this.C10 = 'C10';
        this.C11 = 'C11';
        this.C12 = 'C12';
        this.C13 = 'C13';
        this.C14 = 'C14';
        this.C15 = 'C15';
        this.C16 = 'C16';
        this.C17 = 'C17';
        this.C18 = 'C18';
        this.C19 = 'C19';
        this.C20 = 'C20';
        this.C21 = 'C21';
        this.C22 = 'C22';
        this.C23 = 'C23';
        this.C24 = 'C24';
        this.C25 = 'C25';
        this.C26 = 'C26';
        this.C27 = 'C27';
        this.C28 = 'C28';
        this.C29 = 'C29';
        this.C30 = 'C30';
        this.C31 = 'C31';
        ///////////////////////////////////////////////////////////////////////////////////
        // Temp and Control Registers
        this.r_data_addr = this.r0;
        this.r_bit_num = this.r2.b2;
        this.r_data_len = this.r2.w0;
        this.r_temp_addr = this.r3;
        this.r_temp1 = this.r4;
        this.r_temp2 = this.r29;
        this.r_temp3 = this.r1;
        this.r_temp4 = this.r30;
        this.r_data_len2 = this.r29.w0;
        this.r_bit_regs = [
            this.r_data_addr,
            this.r_temp2,
            this.r_temp3,
            this.r_temp4
        ];
        ///////////////////////////////////////////////////////////////////////////////////
        this.r_data0 = this.r5;
        this.r_data1 = this.r6;
        this.r_data2 = this.r7;
        this.r_data3 = this.r8;
        this.r_data4 = this.r9;
        this.r_data5 = this.r10;
        this.r_data6 = this.r11;
        this.r_data7 = this.r12;
        this.r_data8 = this.r13;
        this.r_data9 = this.r14;
        this.r_data10 = this.r15;
        this.r_data11 = this.r16;
        this.r_data12 = this.r17;
        this.r_data13 = this.r18;
        this.r_data14 = this.r19;
        this.r_data15 = this.r20;
        this.r_data16 = this.r21;
        this.r_data17 = this.r22;
        this.r_data18 = this.r23;
        this.r_data19 = this.r24;
        this.r_data20 = this.r25;
        this.r_data21 = this.r26;
        this.r_data22 = this.r27;
        this.r_data23 = this.r28;
        this.r_datas = [
            this.r_data0, this.r_data1, this.r_data2, this.r_data3, this.r_data4, this.r_data5, this.r_data6,
            this.r_data7, this.r_data8, this.r_data9, this.r_data10, this.r_data11, this.r_data12, this.r_data13,
            this.r_data14, this.r_data15, this.r_data16, this.r_data17, this.r_data18, this.r_data19, this.r_data20,
            this.r_data21, this.r_data22, this.r_data23
        ];
        this.PRU0_PRU1_INTERRUPT = 17;
        this.PRU1_PRU0_INTERRUPT = 18;
        this.PRU0_ARM_INTERRUPT = 19;
        this.PRU1_ARM_INTERRUPT = 20;
        this.ARM_PRU0_INTERRUPT = 21;
        this.ARM_PRU1_INTERRUPT = 22;
        this.CONST_PRUDRAM = this.C24;
        this.CONST_SHAREDRAM = this.C28;
        this.CONST_L3RAM = this.C30;
        this.CONST_DDR = this.C31;
        // Address for the Constant table Programmable Pointer Register 0(CTPPR_0)
        this.CTBIR_0 = '0x22020';
        // Address for the Constant table Programmable Pointer Register 0(CTPPR_0)
        this.CTBIR_1 = '0x22024';
        // Address for the Constant table Programmable Pointer Register 0(CTPPR_0)
        this.CTPPR_0 = '0x22028';
        // Address for the Constant table Programmable Pointer Register 1(CTPPR_1)
        this.CTPPR_1 = '0x2202C';
        this.sp = this.r0;
        this.lr = this.r23;
        this.STACK_TOP = (0x2000 - 4);
        this.STACK_BOTTOM = (0x2000 - 0x200);
        /** Mappings of the GPIO devices */
        this.GPIO0 = 0x44E07000;
        this.GPIO1 = 0x4804c000;
        this.GPIO2 = 0x481AC000;
        this.GPIO3 = 0x481AE000;
        this.GPIO_ADDRS = [this.GPIO0, this.GPIO1, this.GPIO2, this.GPIO3];
        /** Offsets for the clear and set registers in the devices */
        this.GPIO_CLEARDATAOUT = 0x190;
        this.GPIO_SETDATAOUT = 0x194;
        ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
        this.PRU_CONTROL_ADDRESS = this.PRU_NUM === 0 ? '0x22000' : '0x24000';
        this.PRU_ARM_INTERRUPT = this.PRU_NUM === 0 ? this.PRU0_ARM_INTERRUPT : this.PRU1_ARM_INTERRUPT;
        this.lastGpioPrepBank = -1;
    }
    BasePruProgram.prototype.generate = function () {
        var _this = this;
        return new GeneratedPruProgram(this.pruCode, bbbPinData_1.pinIndex.pinData.filter(function (pin) { return pin.pruIndex === _this.PRU_NUM; }));
    };
    Object.defineProperty(BasePruProgram.prototype, "pruPins", {
        get: function () {
            return bbbPinData_1.pinIndex.pinsByPruAndPin[this.PRU_NUM];
        },
        enumerable: true,
        configurable: true
    });
    BasePruProgram.prototype.nextLabel = function (prefix) { return prefix + this.labelCounter++; };
    BasePruProgram.prototype.emitLine = function (s) {
        this.pruCode += (s === undefined ? "" : (this.pruWhitespace.join("") + s)) + "\n";
    };
    BasePruProgram.prototype.emitLabel = function (s, skipNewLine) {
        if (!s) {
            s = "_label_" + (++this.labelCounter);
        }
        if (!skipNewLine) {
            this.emitLine();
        }
        this.emitLine(s + ":");
        return s;
    };
    BasePruProgram.prototype.pruBlock = function (arg1, arg2) {
        var code;
        if (typeof (arg1) === "string") {
            this.emitComment(arg1);
            code = arg2;
        }
        else {
            code = arg1;
        }
        this.pruWhitespace.push("  ");
        try {
            return code();
        }
        finally {
            this.pruWhitespace.pop();
        }
    };
    // Generic instructions
    BasePruProgram.prototype.emitInstr = function (name, args, comment) {
        var code = name;
        if (args) {
            for (var i = 0; i < args.length; i++) {
                if (i > 0)
                    code += ", ";
                else
                    code += " ";
                if (isNaN(args[i])) {
                    code += args[i];
                }
                else {
                    code += this.toNumericLiteral(args[i]);
                }
            }
        }
        code += ";";
        if (comment) {
            code += " // " + comment;
        }
        this.emitLine(code);
    };
    BasePruProgram.prototype.emitComment = function (s) {
        this.emitLine("// " + s);
    };
    BasePruProgram.prototype.toNumericLiteral = function (n) {
        n = parseInt(n);
        if (n < 256) {
            return n + "";
        }
        else {
            return this.toHexLiteral(n);
        }
    };
    BasePruProgram.prototype.toHexLiteral = function (n) {
        if (n < 0) {
            n = 0xFFFFFFFF + n + 1;
        }
        var s = n.toString(16).toUpperCase();
        while (s.length % 2 != 0) {
            s = "0" + s;
        }
        return "0x" + s;
    };
    BasePruProgram.prototype.ADC = function (dest, src, op) { this.emitInstr("ADC", [dest, src, op]); };
    BasePruProgram.prototype.ADD = function (dest, src, op) { this.emitInstr("ADD", [dest, src, op], dest + " = " + src + " + " + op); };
    BasePruProgram.prototype.SUB = function (dest, src, op) { this.emitInstr("SUB", [dest, src, op], dest + " = " + src + " - " + op); };
    BasePruProgram.prototype.SUC = function (dest, src, op) { this.emitInstr("SUC", [dest, src, op]); };
    BasePruProgram.prototype.RSB = function (dest, src, op) { this.emitInstr("RSB", [dest, src, op]); };
    BasePruProgram.prototype.RSC = function (dest, src, op) { this.emitInstr("RSC", [dest, src, op]); };
    BasePruProgram.prototype.LSL = function (dest, src, op) { this.emitInstr("LSL", [dest, src, op]); };
    BasePruProgram.prototype.LSR = function (dest, src, op) { this.emitInstr("LSR", [dest, src, op]); };
    BasePruProgram.prototype.AND = function (dest, src, op) { this.emitInstr("AND", [dest, src, op]); };
    BasePruProgram.prototype.OR = function (dest, src, op) { this.emitInstr("OR", [dest, src, op]); };
    BasePruProgram.prototype.XOR = function (dest, src, op) { this.emitInstr("XOR", [dest, src, op]); };
    BasePruProgram.prototype.NOT = function (dest, src) { this.emitInstr("NOT", [dest, src]); };
    BasePruProgram.prototype.MIN = function (dest, src, op) { this.emitInstr("MIN", [dest, src, op]); };
    BasePruProgram.prototype.MAX = function (dest, src, op) { this.emitInstr("MAX", [dest, src, op]); };
    BasePruProgram.prototype.CLR = function (dest, src, op) { this.emitInstr("CLR", [dest, src, op]); };
    BasePruProgram.prototype.SET = function (dest, src, op) { this.emitInstr("SET", [dest, src, op]); };
    BasePruProgram.prototype.SCAN = function (Rn, op) { this.emitInstr("SCAN", [Rn, op]); };
    BasePruProgram.prototype.LMBD = function (dest, src, op) { this.emitInstr("LMBD", [dest, src, op]); };
    BasePruProgram.prototype.MOV = function (dest, op) { this.emitInstr("MOV", [dest, op]); };
    BasePruProgram.prototype.LDI = function (dest, op) { this.emitInstr("LDI", [dest, op]); };
    BasePruProgram.prototype.LBBO = function (srcReg, addrReg, addrOffset, byteCount) {
        this.emitInstr("LBBO", [srcReg, addrReg, addrOffset, byteCount], (addrOffset == 0 && byteCount == 4)
            ? ("store the value of " + srcReg + " into &" + addrReg)
            : ("store " + byteCount + " bytes into " + addrReg + " + " + addrOffset + " from registers starting at " + srcReg));
    };
    BasePruProgram.prototype.SBBO = function (destReg, addrReg, addrOffset, byteCount) {
        this.emitInstr("SBBO", [destReg, addrReg, addrOffset, byteCount], "copy " + byteCount + " bytes into *(" + addrReg + " + " + addrOffset + ") from registers starting at " + destReg);
    };
    BasePruProgram.prototype.LBCO = function (dest, constName, addrOffset, byteCount) { this.emitInstr("LBCO", [dest, constName, addrOffset, byteCount]); };
    BasePruProgram.prototype.SBCO = function (dest, constName, addrOffset, byteCount) { this.emitInstr("SBCO", [dest, constName, addrOffset, byteCount]); };
    // protected LFC()  { this.emitInstr("LFC", arguments);  } // Deprecated
    // protected STC()  { this.emitInstr("STC", arguments);  } // Deprecated
    BasePruProgram.prototype.ZERO = function (startReg, byteCount) { this.emitInstr("ZERO", [startReg, byteCount]); };
    //protected MVIB() { this.emitInstr("MVIB", arguments); }
    //protected MVIW() { this.emitInstr("MVIW", arguments); }
    //protected MVID() { this.emitInstr("MVID", arguments); }
    BasePruProgram.prototype.JMP = function (label) { this.emitInstr("JMP", [label]); };
    BasePruProgram.prototype.JAL = function (reg, label) { this.emitInstr("JAL", [reg, label]); };
    BasePruProgram.prototype.CALL = function (label) { this.emitInstr("CALL", [label]); };
    BasePruProgram.prototype.RET = function () { this.emitInstr("RET", []); };
    BasePruProgram.prototype.QBGT = function (label, reg, op) { this.emitInstr("QBGT", [label, reg, op]); };
    BasePruProgram.prototype.QBGE = function (label, reg, op) { this.emitInstr("QBGE", [label, reg, op]); };
    BasePruProgram.prototype.QBLT = function (label, reg, op) { this.emitInstr("QBLT", [label, reg, op]); };
    BasePruProgram.prototype.QBLE = function (label, reg, op) { this.emitInstr("QBLE", [label, reg, op]); };
    BasePruProgram.prototype.QBEQ = function (label, reg, op) { this.emitInstr("QBEQ", [label, reg, op]); };
    BasePruProgram.prototype.QBNE = function (label, reg, op) { this.emitInstr("QBNE", [label, reg, op]); };
    BasePruProgram.prototype.QBA = function (label) { this.emitInstr("QBA", [label]); };
    BasePruProgram.prototype.QBBS = function (label, reg, bit) {
        this.emitInstr("QBBS", [label, reg, bit], "if (" + reg + " & (1 << " + bit + ") != 0) goto " + label);
    };
    BasePruProgram.prototype.QBBC = function (label, reg, bit) {
        this.emitInstr("QBBC", [label, reg, bit], "if (" + reg + " & (1 << " + bit + ") == 0) goto " + label);
    };
    BasePruProgram.prototype.WBS = function (reg, bit) { this.emitInstr("WBS", [reg, bit]); };
    BasePruProgram.prototype.WBC = function (reg, bit) { this.emitInstr("WBC", [reg, bit]); };
    BasePruProgram.prototype.HALT = function () { this.emitInstr("HALT", []); };
    BasePruProgram.prototype.SLP = function () { this.emitInstr("SLP", []); };
    BasePruProgram.prototype.ST32 = function (src, dst) { this.emitInstr("ST32", [src, dst]); };
    BasePruProgram.prototype.NOP = function () { this.MOV(this.r0, this.r0); };
    BasePruProgram.prototype.DECREMENT = function (r) { this.emitInstr("DECREMENT", [r], r + " --"); };
    BasePruProgram.prototype.RESET_COUNTER = function (tempReg) {
        if (tempReg === void 0) { tempReg = this.r_temp1; }
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
    };
    BasePruProgram.prototype.RAISE_ARM_INTERRUPT = function () { this.emitInstr("RAISE_ARM_INTERRUPT", []); };
    BasePruProgram.prototype.WAITNS = function (waitNs, waitLabel) {
        this.MOV(this.r_temp_addr, "PRU_CONTROL_ADDRESS");
        this.emitLabel(waitLabel);
        this.LBBO(this.r_temp1, this.r_temp_addr, 0xC, 4);
        this.QBGT(waitLabel, this.r_temp1, waitNs / 5);
    };
    BasePruProgram.prototype.WAIT_TIMEOUT = function (timeoutNs, timeoutLabel) { this.emitInstr("WAIT_TIMEOUT", [timeoutNs, timeoutLabel]); };
    BasePruProgram.prototype.SLEEPNS = function (sleepNs, sleepLabel) {
        this.MOV(this.r_temp_addr, sleepNs / 5 - 1);
        this.emitLabel(sleepLabel);
        this.SUB(this.r_temp_addr, this.r_temp_addr, 1);
        this.QBNE(sleepLabel, this.r_temp_addr, 0);
    };
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    BasePruProgram.prototype.INIT_PRU = function () {
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
    };
    BasePruProgram.prototype.PREP_GPIO_FOR_CLEAR = function (gpioBank) {
        this.emitComment("Prep GPIO address register for CLEAR on GPIO bank " + gpioBank);
        this.MOV(this.r_temp_addr, this.GPIO_ADDRS[gpioBank] | this.GPIO_CLEARDATAOUT);
        this.lastGpioPrepBank = gpioBank;
    };
    BasePruProgram.prototype.PREP_GPIO_FOR_SET = function (gpioBank) {
        this.emitComment("Prep GPIO address register for SET on GPIO bank " + gpioBank);
        this.MOV(this.r_temp_addr, this.GPIO_ADDRS[gpioBank] | this.GPIO_SETDATAOUT);
        this.lastGpioPrepBank = gpioBank;
    };
    BasePruProgram.prototype.APPLY_GPIO_CHANGES = function (maskReg) {
        if (maskReg === void 0) { maskReg = this.r_temp1; }
        this.emitComment("Apply GPIO bank " + this.lastGpioPrepBank + " changes");
        this.SBBO(maskReg, this.r_temp_addr, 0, 4);
    };
    /**
     * Zeros the registers used to store which bits should be one for each GPIO bank
     */
    BasePruProgram.prototype.RESET_GPIO_MASK = function () {
        this.emitComment("Reset GPIO one registers");
        this.MOV(this.r_temp1, 0);
    };
    /**
     * Checks if the given pin is zero, and clears the corresponding r30 bit in the given register.
     *
     * @param pin The pin whose bit should be tested
     * @param r30Reg Register where the R30 bit should be set.
     */
    BasePruProgram.prototype.TEST_BIT_ZERO_R30 = function (pin, r30Reg) {
        if (r30Reg === void 0) { r30Reg = this.r_temp2; }
        var label_name = "channel_" + pin.pruDataChannel + "_zero_skip";
        this.emitComment("Test if pin (pruDataChannel=" + pin.pruDataChannel + ", global=" + pin.dataChannelIndex + ") is ZERO and SET bit " + pin.r30bit + " in " + r30Reg + " for use with r30");
        this.QBBS(label_name, this.r_datas[pin.dataChannelIndex], this.r_bit_num);
        this.CLR(r30Reg, r30Reg, pin.r30bit);
        this.emitLabel(label_name, true);
    };
    /**
     * Checks if the bit indexed by the r_bit_num register in the regN register is a zero, and if so, sets the bit in the
     * corresponding _zeros register. CHANNEL_BANK_NAME and CHANNEL_BIT are used to lookup the bank and bit num.
     *
     * @param pin The pin whose bit should be tested
     * @param gpioReg Register where the GPIO bit should be set.
     */
    BasePruProgram.prototype.TEST_BIT_ZERO = function (pin, gpioReg) {
        if (gpioReg === void 0) { gpioReg = this.r_temp1; }
        var label_name = "channel_" + pin.pruDataChannel + "_zero_skip";
        this.emitComment("Test if pin (pruDataChannel=" + pin.pruDataChannel + ", global=" + pin.dataChannelIndex + ") is ZERO and SET bit " + pin.gpioBit + " in GPIO" + pin.gpioBank + " register");
        this.QBBS(label_name, this.r_datas[pin.pruDataChannel], this.r_bit_num);
        this.SET(gpioReg, gpioReg, pin.gpioBit);
        this.emitLabel(label_name, true);
    };
    /**
     * Checks if the bit indexed by the r_bit_num register in the regN register is a one, and if so, sets the bit in the
     * corresponding _ones register. CHANNEL_BANK_NAME and CHANNEL_BIT are used to lookup the bank and bit num.
     *
     * @param pin The pin whose bit should be tested
     * @param gpioReg Register where the GPIO bit should be set.
     */
    BasePruProgram.prototype.TEST_BIT_ONE = function (pin, gpioReg) {
        if (gpioReg === void 0) { gpioReg = this.r_temp1; }
        var label_name = "channel_" + pin.pruDataChannel + "_one_skip";
        this.emitComment("Test if pin (pruDataChannel=" + pin.pruDataChannel + ", global=" + pin.dataChannelIndex + ") is ONE and SET bit " + pin.gpioBit + " in GPIO" + pin.gpioBank + " register");
        this.QBBC(label_name, this.r_datas[pin.pruDataChannel], this.r_bit_num);
        this.SET(gpioReg, gpioReg, pin.gpioBit);
        this.emitLabel(label_name, true);
    };
    BasePruProgram.prototype.shortNameForPin = function (pin) {
        return pin.mappedChannelIndex >= 0 ? pin.mappedChannelIndex : pin.gpioFullName;
    };
    BasePruProgram.prototype.LOAD_CHANNEL_DATA = function (firstPin, firstChannel, channelCount) {
        //this.emitComment("Load the data address from the constant table");
        //this.LBCO(this.r_data_addr, this.CONST_PRUDRAM, 0, 4);
        this.emitComment("Load " + channelCount + " channels of data into data registers");
        this.LBBO(this.r_data0, this.r_data_addr, firstPin.dataChannelIndex * 4 + firstChannel * 4, channelCount * 4);
    };
    BasePruProgram.prototype.PREP_GPIO_MASK_FOR_PINS_R30 = function (pins, reg) {
        if (reg === void 0) { reg = this.r_temp1; }
        this.emitComment("Set " + reg + " with a mask for setting or clearing channels " + pins.map(this.shortNameForPin).join(", "));
        var mask = 0;
        pins.forEach(function (pin) {
            mask |= 1 << pin.r30bit;
        });
        this.MOV(reg, this.toHexLiteral(mask));
    };
    BasePruProgram.prototype.PREP_GPIO_MASK_FOR_PINS = function (pins) {
        this.emitComment("Set the GPIO (bank " + pins[0].gpioBank + ") mask register for setting or clearing channels " + pins.map(this.shortNameForPin).join(", "));
        var mask = 0;
        var bank = -1;
        pins.forEach(function (pin) {
            if (bank != -1 && bank != pin.gpioBank) {
                throw new Error("Cannot load mask for multiple GPIO banks: " + pins);
            }
            else {
                bank = pin.gpioBank;
            }
            mask |= 1 << pin.gpioBit;
        });
        this.MOV(this.r_temp1, this.toHexLiteral(mask));
    };
    BasePruProgram.prototype.groupByBank = function (allPins, callback) {
        var _this = this;
        var pinsByBank = [[], [], [], []];
        allPins.forEach(function (pin) {
            pinsByBank[pin.gpioBank].push(pin);
        });
        var usedBanks = pinsByBank.filter(function (bankPins) { return bankPins.length > 0; });
        var multipleBanksUsed = usedBanks.length > 1;
        var usedBankIndex = 0;
        pinsByBank.forEach(function (pins, bankIndex) {
            if (pins.length > 0) {
                if (multipleBanksUsed) {
                    _this.pruBlock("Bank " + bankIndex, function () { return callback(pins, bankIndex, usedBankIndex++, usedBanks.length); });
                }
                else {
                    callback(pins, bankIndex, usedBankIndex++, usedBanks.length);
                }
            }
        });
    };
    BasePruProgram.prototype.PINS_HIGH = function (pins, pinsLabel) {
        var _this = this;
        this.emitComment((pinsLabel || "") + ' Pins HIGH: ' + pins.map(this.shortNameForPin).join(", "));
        this.pruBlock(function () {
            _this.groupByBank(pins, function (pins, gpioBank) {
                _this.PREP_GPIO_FOR_SET(gpioBank);
                _this.PREP_GPIO_MASK_FOR_PINS(pins);
                _this.APPLY_GPIO_CHANGES();
            });
        });
    };
    BasePruProgram.prototype.PINS_LOW_R30 = function (pins, pinsLabel) {
        this.emitComment((pinsLabel || "") + ' Pins LOW: ' + pins.map(this.shortNameForPin).join(", "));
        this.MOV(this.r_temp2, this.toHexLiteral(0xFFFFFFFF ^ pins.map(function (p) { return 1 << p.r30bit; }).reduce(function (a, b) { return a | b; })));
        this.AND(this.r30, this.r30, this.r_temp2);
    };
    BasePruProgram.prototype.PINS_HIGH_R30 = function (pins, pinsLabel) {
        this.emitComment((pinsLabel || "") + ' Pins LOW: ' + pins.map(this.shortNameForPin).join(", "));
        this.MOV(this.r_temp2, this.toHexLiteral(pins.map(function (p) { return 1 << p.r30bit; }).reduce(function (a, b) { return a | b; })));
        this.OR(this.r30, this.r30, this.r_temp2);
    };
    BasePruProgram.prototype.PINS_LOW = function (pins, pinsLabel) {
        var _this = this;
        this.emitComment((pinsLabel || "") + ' Pins LOW: ' + pins.map(this.shortNameForPin).join(", "));
        this.pruBlock(function () {
            _this.groupByBank(pins, function (pins, gpioBank) {
                _this.PREP_GPIO_FOR_CLEAR(gpioBank);
                _this.PREP_GPIO_MASK_FOR_PINS(pins);
                _this.APPLY_GPIO_CHANGES();
            });
        });
    };
    BasePruProgram.prototype.PINS_HIGH_LOW = function (pins, pinsLabel) {
        var _this = this;
        this.emitComment((pinsLabel || "") + ' Pins HIGH-LOW pulse: ' + pins.map(this.shortNameForPin).join(", "));
        this.pruBlock(function () {
            _this.groupByBank(pins, function (pins, gpioBank) {
                _this.PREP_GPIO_MASK_FOR_PINS(pins);
                _this.PREP_GPIO_FOR_SET(gpioBank);
                _this.APPLY_GPIO_CHANGES();
                _this.PREP_GPIO_FOR_CLEAR(gpioBank);
                _this.APPLY_GPIO_CHANGES();
            });
        });
    };
    return BasePruProgram;
})();
exports.BasePruProgram = BasePruProgram;
var BaseSetupPruProgram = (function (_super) {
    __extends(BaseSetupPruProgram, _super);
    function BaseSetupPruProgram(PRU_NUM, overallChannelCount) {
        _super.call(this, PRU_NUM);
        this.overallChannelCount = overallChannelCount;
    }
    BaseSetupPruProgram.prototype.generate = function () {
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
        return _super.prototype.generate.call(this);
    };
    return BaseSetupPruProgram;
})(BasePruProgram);
exports.BaseSetupPruProgram = BaseSetupPruProgram;
//# sourceMappingURL=common.js.map