import * as fs from 'fs';
import {BasePruProgram} from "./common";
import {pinIndex} from "../bbbPinData";
import {BaseSetupPruProgram} from "./common";

export default class WS281xR30Program extends BaseSetupPruProgram {
	constructor(
		PRU_NUM: number,
		overallChannelCount: number
	) {
		super(PRU_NUM, Math.min(24, overallChannelCount));
		pinIndex.applyR30PinMapping();
		//console.error("Using " + this.pruChannelCount + " channels on PRU" + PRU_NUM);
	}

	protected fileHeader() {
		this.emitComment("//////////////////////////////////////////////////////////////////////////////////////////////////////");
		this.emitComment("WS281x Mapping for PRU" + this.PRU_NUM);
		this.emitComment("Overall Channels: " + this.overallChannelCount);
		//this.emitComment("PRU Channels: " + this.pruChannelCount);
		this.emitComment("//////////////////////////////////////////////////////////////////////////////////////////////////////");
	}

	protected frameCode() {
		const g = this;

		// Bit timings from http://wp.josh.com/2014/05/13/ws2812-neopixels-are-not-so-finicky-once-you-get-to-know-them/
		// ZERO_HIGH: 200 - 350 - 500
		// ONE_HIGH:  550 - 700 - 5,500
		// ONE_LOW:   450 - 600 - 6,000
		// The following values are not the actual times. They are hand-tuned values determined using a scope.
		const ZERO_PULSE_NS  = 200; // Actual:
		const ONE_PULSE_NS   = 520; // Actual: 630
		const INTERBIT_NS    = 375; // Actual:
		const INTERFRAME_NS  = 15000;

		g.pruBlock(() => {
			var l_word_loop = g.emitLabel("l_word_loop");

			// Load all the data.
			g.LOAD_CHANNEL_DATA(pinIndex.pinsByMappedChannelIndex[0], 0, this.overallChannelCount);

			// Store the data register in the unused bits of the data registers so it can be used for one of the
			// GPIO banks
			//g.MOV(g.r_data0.b3, g.r_data_addr.b0);
			//g.MOV(g.r_data1.b3, g.r_data_addr.b1);
			//g.MOV(g.r_data2.b3, g.r_data_addr.b2);
			//g.MOV(g.r_data3.b3, g.r_data_addr.b3);

			// for bit in 24 to 0
			g.emitComment("Loop over the 24 bits in a word");
			g.MOV(g.r_bit_num, 24);

			const r30tempReg = this.r_temp3;

			g.pruBlock(() => {
				var l_bit_loop = "l_bit_loop";
				g.emitLabel(l_bit_loop);
				g.DECREMENT(g.r_bit_num);

				// Initialize the temp register with all ones for the future AND operation with r30
				g.MOV(r30tempReg, 0xFFFFFFFF);

				g.pruPins.forEach(pin => {
					g.TEST_BIT_ZERO_R30(pin, r30tempReg);
				});

				g.WAITNS(ONE_PULSE_NS, "one_bits_wait");

				g.PINS_LOW_R30(g.pruPins);

				g.SLEEPNS(INTERBIT_NS, "interbit_wait");

				g.RESET_COUNTER();

				g.PINS_HIGH_R30(g.pruPins);

				g.WAITNS(ZERO_PULSE_NS, "zero_bits_wait");

				// Zeros low
				g.AND(g.r30, g.r30, r30tempReg);

				g.QBNE(l_bit_loop, g.r_bit_num, 0);
			});


			// Restore the data pointers from the data registers.
			//g.MOV(g.r_data_addr.b0, g.r_data0.b3);
			//g.MOV(g.r_data_addr.b1, g.r_data1.b3);
			//g.MOV(g.r_data_addr.b2, g.r_data2.b3);
			//g.MOV(g.r_data_addr.b3, g.r_data3.b3);

			// The RGB streams have been clocked out
			// Move to the next pixel on each row
			g.ADD(g.r_data_addr, g.r_data_addr, 48 * 4);
			g.DECREMENT(g.r_data_len);
			g.QBNE(l_word_loop, g.r_data_len, 0);
		});

		g.WAITNS(ONE_PULSE_NS, "one_bits_wait_end");
		g.PINS_LOW_R30(g.pruPins);

		g.SLEEPNS(INTERFRAME_NS, "interframe_wait");
	}
}