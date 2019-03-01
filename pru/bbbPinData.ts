export class BbbPinMappingInfo {
	sharedClockBank: number;

	pruIndex: number;
	pruPin: number;

	mappedChannelIndex: number;
	specialName: string;

	dataChannelIndex: number;
	clockChannelIndex: number;

	pruDataChannel: number;
	pruClockChannel: number;
}

function isNumeric(n: any) {
	return typeof(n) === "number" || parseFloat(n) == n;
}

export class BbbPinInfo extends BbbPinMappingInfo {
	public header: number;
	public headerPin: number;
	public gpioNum: number;
	public name: string;

	public gpioBank: number;
	public gpioBit: number;
	public gpioName: string;
	public gpioFullName: string;
	public headerName: string;

	public r30pru: number;
	public r30bit: number;

	public emmcPin: boolean;
	public bbbHdmiPin: boolean;

	constructor(data: {
		header: number
		headerPin: number
		gpioNum: number
		name: string,
		r30pru: number,
		r30bit: number,
		emmcPin: boolean,
		bbbHdmiPin: boolean
	}) {
		super();

		this.header = data.header;
		this.headerPin = data.headerPin;
		this.gpioNum = data.gpioNum;
		this.name = data.name;

		this.r30pru = data.r30pru;
		this.r30bit = data.r30bit;

		this.gpioBank = Math.floor(this.gpioNum / 32);
		this.gpioBit = this.gpioNum % 32;
		this.gpioName = this.gpioBank + "_" + this.gpioBit;
		this.gpioFullName = "GPIO" + this.gpioName;
		this.headerName = "P" + this.header + "_" + this.headerPin;

		this.emmcPin = data.emmcPin;
		this.bbbHdmiPin = data.bbbHdmiPin;
	}
}

export interface PinMappingData {
	id: string;
	name: string;
	description: string;
	dtbName?: string;
	maxChannelCount?: number;
	capeSupport: {
		org: string;
		id: string;
	}[];
	mappedPinNumberToPinDesignator: {
		[channelNumber: string]: string
	};
}

export class BbbPinIndex {
	pinsByHeaderAndPin: { [headerNum: number]: BbbPinInfo[] };
	pinsByGpioNum: { [gpioNum: number]: BbbPinInfo };
	pinsByGpioBankAndBit: { [gpioBank: number]: {[gpioBit: number]: BbbPinInfo} };
	pinsByName: { [name: string]: BbbPinInfo };
	pinsByGpioFullName: { [gpioFullName: string]: BbbPinInfo };
	pinsByHeaderName: { [headerName: string]: BbbPinInfo };

	/**
	 * Map of pins by the data channel it will output. This only exists after a PRU program assigns pins to itself.
	 */
	pinsByDataChannelIndex: { [dataChannelIndex: number]: BbbPinInfo };

	/**
	 * Map of pins by the clock channel it will output. This only exists after a PRU program assigns pins to itself,
	 * and only for those programs that use the data pins for clock signal.
	 */
	pinsByClockChannelIndex: { [clockChannelIndex: number]: BbbPinInfo };

	/**
	 * Map of pins by which PRU they are assigned to. This only exists after a PRU program assigns pins to itself.
	 */
	pinsByPruAndPin: { [pruNum: number]: BbbPinInfo[] };

	/**
	 * Map of pins by the channel number indicated in the mapping file.
	 */
	pinsByMappedChannelIndex: BbbPinInfo[];

	/**
	 * Map of pins that aren't used for indexed LED channel output, such as shared clock pins.
	 */
	pinsBySpecialName: BbbPinInfo[];

	constructor(public pinData: BbbPinInfo[]) {
		this.rebuild();
	}

	public rebuild() {
		this.pinsByHeaderAndPin = { 8: [], 9: [] };
		this.pinsByGpioNum = {};
		this.pinsByGpioBankAndBit = { 0: {}, 1: {}, 2: {}, 3: {} };
		this.pinsByName = {};
		this.pinsByGpioFullName = {};
		this.pinsByHeaderName = {};
		this.pinsByDataChannelIndex = {};
		this.pinsByClockChannelIndex = {};
		this.pinsByPruAndPin = { 0: [], 1: [] };
		this.pinsByMappedChannelIndex = [];
		this.pinsBySpecialName = [];

		pinData.forEach(pin => {
			this.pinsByHeaderAndPin[pin.header][pin.headerPin] = pin;
			this.pinsByGpioNum[pin.gpioNum] = pin;
			if (pin.gpioBank >= 0 && pin.gpioBit >= 0) {
				this.pinsByGpioBankAndBit[pin.gpioBank][pin.gpioBit] = pin;
			}
			this.pinsByName[pin.name] = pin;
			this.pinsByGpioFullName[pin.gpioFullName] = pin;
			this.pinsByHeaderName[pin.headerName] = pin;
			this.pinsByDataChannelIndex[pin.dataChannelIndex] = pin;
			this.pinsByClockChannelIndex[pin.clockChannelIndex] = pin;

			if (isNumeric(pin.pruIndex) && isNumeric(pin.pruPin)) {
				this.pinsByPruAndPin[pin.pruIndex][pin.pruPin] = pin;
			}

			if (isNumeric(pin.mappedChannelIndex)) {
				this.pinsByMappedChannelIndex[pin.mappedChannelIndex] = pin;
			}

			if (pin.specialName) {
				this.pinsBySpecialName[pin.specialName] = pin;
			}
		});
	}

	private resetPinPruMapping() {
		this.pinData.forEach(pin => {
			pin.pruClockChannel = undefined;
			pin.pruDataChannel = undefined;
			pin.pruIndex = undefined;
			pin.pruPin = undefined;
		});
	}

	public applyPerPruClockMapping(
		pinsPerPru
	) {
		this.resetPinPruMapping();

		var totalPinCount = pinsPerPru * 2;

		pinData.forEach(function(pin) {
			if (isNumeric(pin.mappedChannelIndex)) {
				pin.pruIndex = pin.mappedChannelIndex < 24 ? 0 : 1;
				var pruPin = pin.mappedChannelIndex - (pin.pruIndex * 24);

				if (pruPin < pinsPerPru) {
					pin.pruPin = pruPin;
					pin.pruDataChannel = pin.pruPin;

					if (pin.pruPin < pinsPerPru) {
						pin.dataChannelIndex = pin.pruIndex * pinsPerPru + pin.pruPin;
					}
				}
			} else if (pin.specialName) {
				var specialNameMatch = pin.specialName.match(/^clock(\d)$/);

				if (specialNameMatch) {
					pin.pruIndex = parseInt(specialNameMatch[1]);
				}
			}
		});

		this.rebuild();
	}

	public applyInterlacedClockPinMapping(
		pinsPerPru
	) {
		this.resetPinPruMapping();

		var totalPinCount = pinsPerPru * 2;

		pinData.forEach(function(pin) {
			if (pin.mappedChannelIndex < totalPinCount) {
				pin.pruIndex = pin.mappedChannelIndex < pinsPerPru ? 0 : 1;

				pin.pruPin = pin.mappedChannelIndex - (pin.pruIndex * pinsPerPru);

				if (pin.pruPin % 2 == 1) {
					// Data Pin
					pin.dataChannelIndex = Math.floor(pin.mappedChannelIndex / 2);
					pin.pruDataChannel = Math.floor(pin.pruPin / 2);
				} else {
					pin.clockChannelIndex = Math.floor(pin.mappedChannelIndex / 2);
					pin.pruClockChannel = Math.floor(pin.pruPin / 2);
				}
			}
		});

		this.rebuild();
	}

	public applySingleDataPinMapping(
		pinsPerPru
	) {
		this.resetPinPruMapping();

		pinData.forEach(function(pin) {
			if (pin.mappedChannelIndex < pinsPerPru*2) {
				pin.pruIndex = pin.mappedChannelIndex < pinsPerPru ? 0 : 1;
				pin.pruPin = pin.mappedChannelIndex - (pin.pruIndex * pinsPerPru);
				pin.pruDataChannel = pin.pruPin;

				if (pin.pruPin < pinsPerPru) {
					pin.dataChannelIndex = pin.pruIndex * pinsPerPru + pin.pruPin;
				}
			}
		});

		this.rebuild();
	}

	public applyR30PinMapping() {
		this.resetPinPruMapping();

		const pruPinCount = [0, 0];

		pinData.forEach(function(pin) {
			if (typeof(pin.r30pru) === "number" && typeof(pin.mappedChannelIndex) === "number") {
				pin.pruIndex = pin.r30pru;
				pin.pruPin = pruPinCount[pin.r30pru] ++;
				pin.pruDataChannel = pin.mappedChannelIndex;
				pin.dataChannelIndex = pin.mappedChannelIndex;
			}
		});

		this.rebuild();
	}

	public applyMappingData(
		pinMapping: PinMappingData
	) {
		var mappedCount = 0;

		var mappedPinNumberToPinDesignator = pinMapping.mappedPinNumberToPinDesignator;

		// Clear current mapping information
		pinData.forEach(pin => pin.mappedChannelIndex = undefined);

		for (var mappedName in mappedPinNumberToPinDesignator) if (mappedPinNumberToPinDesignator.hasOwnProperty(mappedName)) {
			var designator = ("" + pinMapping.mappedPinNumberToPinDesignator[mappedName]).toUpperCase().trim();
			var pin = this.pinsByHeaderName[designator] || this.pinsByName[designator] || this.pinsByGpioFullName[designator];

			if (pin) {

				if (parseInt(mappedName) as any == mappedName) {
					pin.mappedChannelIndex = parseInt(mappedName);
				} else {
					pin.specialName = mappedName;
				}

				if (console.debug) console.debug(`Mapped ${JSON.stringify(pin)} (found for ${designator}) to ${pin.mappedChannelIndex}`);
				mappedCount++;
			} else {
				throw new Error("No pin matches designator " + designator + " for pin " + mappedName);
			}
		}

		this.rebuild();
	}
}


// PRU GPIO mapping from http://elinux.org/Ti_AM33XX_PRUSSv2#Beaglebone_PRU_connections_and_modes
// eMMC and HDMI Pin Data from: https://www.mathworks.com/help/supportpkg/beaglebone/examples/pin-muxing.html
export var pinData = [
	new BbbPinInfo({ header: 8, headerPin:  1, gpioNum: 0  , name: "GND"       , r30pru: null, r30bit: null, bbbHdmiPin: false, emmcPin: false }),
	new BbbPinInfo({ header: 8, headerPin:  2, gpioNum: 0  , name: "GND"       , r30pru: null, r30bit: null, bbbHdmiPin: false, emmcPin: false }),
	new BbbPinInfo({ header: 8, headerPin:  3, gpioNum: 38 , name: "GPIO1_6"   , r30pru: null, r30bit: null, bbbHdmiPin: false, emmcPin: true  }),
	new BbbPinInfo({ header: 8, headerPin:  4, gpioNum: 39 , name: "GPIO1_7"   , r30pru: null, r30bit: null, bbbHdmiPin: false, emmcPin: true  }),
	new BbbPinInfo({ header: 8, headerPin:  5, gpioNum: 34 , name: "GPIO1_2"   , r30pru: null, r30bit: null, bbbHdmiPin: false, emmcPin: true  }),
	new BbbPinInfo({ header: 8, headerPin:  6, gpioNum: 35 , name: "GPIO1_3"   , r30pru: null, r30bit: null, bbbHdmiPin: false, emmcPin: true  }),
	new BbbPinInfo({ header: 8, headerPin:  7, gpioNum: 66 , name: "TIMER4"    , r30pru: null, r30bit: null, bbbHdmiPin: false, emmcPin: false }),
	new BbbPinInfo({ header: 8, headerPin:  8, gpioNum: 67 , name: "TIMER7"    , r30pru: null, r30bit: null, bbbHdmiPin: false, emmcPin: false }),
	new BbbPinInfo({ header: 8, headerPin:  9, gpioNum: 69 , name: "TIMER5"    , r30pru: null, r30bit: null, bbbHdmiPin: false, emmcPin: false }),
	new BbbPinInfo({ header: 8, headerPin: 10, gpioNum: 68 , name: "TIMER6"    , r30pru: null, r30bit: null, bbbHdmiPin: false, emmcPin: false }),
	new BbbPinInfo({ header: 8, headerPin: 11, gpioNum: 45 , name: "GPIO1_13"  , r30pru:    0, r30bit:   15, bbbHdmiPin: false, emmcPin: false }),
	new BbbPinInfo({ header: 8, headerPin: 12, gpioNum: 44 , name: "GPIO1_12"  , r30pru:    0, r30bit:   14, bbbHdmiPin: false, emmcPin: false }),
	new BbbPinInfo({ header: 8, headerPin: 13, gpioNum: 23 , name: "EHRPWM2B"  , r30pru: null, r30bit: null, bbbHdmiPin: false, emmcPin: false }),
	new BbbPinInfo({ header: 8, headerPin: 14, gpioNum: 26 , name: "GPIO0_26"  , r30pru: null, r30bit: null, bbbHdmiPin: false, emmcPin: false }),
	new BbbPinInfo({ header: 8, headerPin: 15, gpioNum: 47 , name: "GPIO1_15"  , r30pru: null, r30bit: null, bbbHdmiPin: false, emmcPin: false }),
	new BbbPinInfo({ header: 8, headerPin: 16, gpioNum: 46 , name: "GPIO1_14"  , r30pru: null, r30bit: null, bbbHdmiPin: false, emmcPin: false }),
	new BbbPinInfo({ header: 8, headerPin: 17, gpioNum: 27 , name: "GPIO0_27"  , r30pru: null, r30bit: null, bbbHdmiPin: false, emmcPin: false }),
	new BbbPinInfo({ header: 8, headerPin: 18, gpioNum: 65 , name: "GPIO2_1"   , r30pru: null, r30bit: null, bbbHdmiPin: false, emmcPin: false }),
	new BbbPinInfo({ header: 8, headerPin: 19, gpioNum: 22 , name: "EHRPWM2A"  , r30pru: null, r30bit: null, bbbHdmiPin: false, emmcPin: false }),
	new BbbPinInfo({ header: 8, headerPin: 20, gpioNum: 63 , name: "GPIO1_31"  , r30pru:    1, r30bit:   13, bbbHdmiPin: false, emmcPin: true  }),
	new BbbPinInfo({ header: 8, headerPin: 21, gpioNum: 62 , name: "GPIO1_30"  , r30pru:    1, r30bit:   12, bbbHdmiPin: false, emmcPin: true  }),
	new BbbPinInfo({ header: 8, headerPin: 22, gpioNum: 37 , name: "GPIO1_5"   , r30pru: null, r30bit: null, bbbHdmiPin: false, emmcPin: true  }),
	new BbbPinInfo({ header: 8, headerPin: 23, gpioNum: 36 , name: "GPIO1_4"   , r30pru: null, r30bit: null, bbbHdmiPin: false, emmcPin: true  }),
	new BbbPinInfo({ header: 8, headerPin: 24, gpioNum: 33 , name: "GPIO1_1"   , r30pru: null, r30bit: null, bbbHdmiPin: false, emmcPin: true  }),
	new BbbPinInfo({ header: 8, headerPin: 25, gpioNum: 1  , name: "GPIO1_0"   , r30pru: null, r30bit: null, bbbHdmiPin: false, emmcPin: true  }),
	new BbbPinInfo({ header: 8, headerPin: 26, gpioNum: 61 , name: "GPIO1_29"  , r30pru: null, r30bit: null, bbbHdmiPin: false, emmcPin: false }),
	new BbbPinInfo({ header: 8, headerPin: 27, gpioNum: 86 , name: "GPIO2_22"  , r30pru:    1, r30bit:    8, bbbHdmiPin: true,  emmcPin: false }),
	new BbbPinInfo({ header: 8, headerPin: 28, gpioNum: 88 , name: "GPIO2_24"  , r30pru:    1, r30bit:   10, bbbHdmiPin: true,  emmcPin: false }),
	new BbbPinInfo({ header: 8, headerPin: 29, gpioNum: 87 , name: "GPIO2_23"  , r30pru:    1, r30bit:    9, bbbHdmiPin: true,  emmcPin: false }),
	new BbbPinInfo({ header: 8, headerPin: 30, gpioNum: 89 , name: "GPIO2_25"  , r30pru:    1, r30bit:   11, bbbHdmiPin: true,  emmcPin: false }),
	new BbbPinInfo({ header: 8, headerPin: 31, gpioNum: 10 , name: "UART5_CTSN", r30pru: null, r30bit: null, bbbHdmiPin: true,  emmcPin: false }),
	new BbbPinInfo({ header: 8, headerPin: 32, gpioNum: 11 , name: "UART5_RTSN", r30pru: null, r30bit: null, bbbHdmiPin: true,  emmcPin: false }),
	new BbbPinInfo({ header: 8, headerPin: 33, gpioNum: 9  , name: "UART4_RTSN", r30pru: null, r30bit: null, bbbHdmiPin: true,  emmcPin: false }),
	new BbbPinInfo({ header: 8, headerPin: 34, gpioNum: 81 , name: "UART3_RTSN", r30pru: null, r30bit: null, bbbHdmiPin: true,  emmcPin: false }),
	new BbbPinInfo({ header: 8, headerPin: 35, gpioNum: 8  , name: "UART4_CTSN", r30pru: null, r30bit: null, bbbHdmiPin: true,  emmcPin: false }),
	new BbbPinInfo({ header: 8, headerPin: 36, gpioNum: 80 , name: "UART3_CTSN", r30pru: null, r30bit: null, bbbHdmiPin: true,  emmcPin: false }),
	new BbbPinInfo({ header: 8, headerPin: 37, gpioNum: 78 , name: "UART5_TXD" , r30pru: null, r30bit: null, bbbHdmiPin: true,  emmcPin: false }),
	new BbbPinInfo({ header: 8, headerPin: 38, gpioNum: 79 , name: "UART5_RXD" , r30pru: null, r30bit: null, bbbHdmiPin: true,  emmcPin: false }),
	new BbbPinInfo({ header: 8, headerPin: 39, gpioNum: 76 , name: "GPIO2_12"  , r30pru:    1, r30bit:    6, bbbHdmiPin: true,  emmcPin: false }),
	new BbbPinInfo({ header: 8, headerPin: 40, gpioNum: 77 , name: "GPIO2_13"  , r30pru:    1, r30bit:    7, bbbHdmiPin: true,  emmcPin: false }),
	new BbbPinInfo({ header: 8, headerPin: 41, gpioNum: 74 , name: "GPIO2_10"  , r30pru:    1, r30bit:    4, bbbHdmiPin: true,  emmcPin: false }),
	new BbbPinInfo({ header: 8, headerPin: 42, gpioNum: 75 , name: "GPIO2_11"  , r30pru:    1, r30bit:    5, bbbHdmiPin: true,  emmcPin: false }),
	new BbbPinInfo({ header: 8, headerPin: 43, gpioNum: 72 , name: "GPIO2_8"   , r30pru:    1, r30bit:    2, bbbHdmiPin: true,  emmcPin: false }),
	new BbbPinInfo({ header: 8, headerPin: 44, gpioNum: 73 , name: "GPIO2_9"   , r30pru:    1, r30bit:    3, bbbHdmiPin: true,  emmcPin: false }),
	new BbbPinInfo({ header: 8, headerPin: 45, gpioNum: 70 , name: "GPIO2_6"   , r30pru:    1, r30bit:    0, bbbHdmiPin: true,  emmcPin: false }),
	new BbbPinInfo({ header: 8, headerPin: 46, gpioNum: 71 , name: "GPIO2_7"   , r30pru:    1, r30bit:    1, bbbHdmiPin: true,  emmcPin: false }),
	new BbbPinInfo({ header: 9, headerPin:  1, gpioNum: 0  , name: "GND"       , r30pru: null, r30bit: null, bbbHdmiPin: false, emmcPin: false }),
	new BbbPinInfo({ header: 9, headerPin:  2, gpioNum: 0  , name: "GND"       , r30pru: null, r30bit: null, bbbHdmiPin: false, emmcPin: false }),
	new BbbPinInfo({ header: 9, headerPin:  3, gpioNum: 0  , name: "VDD_3V3EXP", r30pru: null, r30bit: null, bbbHdmiPin: false, emmcPin: false }),
	new BbbPinInfo({ header: 9, headerPin:  4, gpioNum: 0  , name: "VDD_3V3EXP", r30pru: null, r30bit: null, bbbHdmiPin: false, emmcPin: false }),
	new BbbPinInfo({ header: 9, headerPin:  5, gpioNum: 0  , name: "VDD_5V"    , r30pru: null, r30bit: null, bbbHdmiPin: false, emmcPin: false }),
	new BbbPinInfo({ header: 9, headerPin:  6, gpioNum: 0  , name: "VDD_5V"    , r30pru: null, r30bit: null, bbbHdmiPin: false, emmcPin: false }),
	new BbbPinInfo({ header: 9, headerPin:  7, gpioNum: 0  , name: "SYS_5V"    , r30pru: null, r30bit: null, bbbHdmiPin: false, emmcPin: false }),
	new BbbPinInfo({ header: 9, headerPin:  8, gpioNum: 0  , name: "SYS_5V"    , r30pru: null, r30bit: null, bbbHdmiPin: false, emmcPin: false }),
	new BbbPinInfo({ header: 9, headerPin:  9, gpioNum: 0  , name: "PWR_BUT"   , r30pru: null, r30bit: null, bbbHdmiPin: false, emmcPin: false }),
	new BbbPinInfo({ header: 9, headerPin: 10, gpioNum: 0  , name: "SYS_RESETn", r30pru: null, r30bit: null, bbbHdmiPin: false, emmcPin: false }),
	new BbbPinInfo({ header: 9, headerPin: 11, gpioNum: 30 , name: "UART4_RXD" , r30pru: null, r30bit: null, bbbHdmiPin: false, emmcPin: false }),
	new BbbPinInfo({ header: 9, headerPin: 12, gpioNum: 60 , name: "GPIO1_28"  , r30pru: null, r30bit: null, bbbHdmiPin: false, emmcPin: false }),
	new BbbPinInfo({ header: 9, headerPin: 13, gpioNum: 31 , name: "UART4_TXD" , r30pru: null, r30bit: null, bbbHdmiPin: false, emmcPin: false }),
	new BbbPinInfo({ header: 9, headerPin: 14, gpioNum: 50 , name: "EHRPWM1A"  , r30pru: null, r30bit: null, bbbHdmiPin: false, emmcPin: false }),
	new BbbPinInfo({ header: 9, headerPin: 15, gpioNum: 48 , name: "GPIO1_16"  , r30pru: null, r30bit: null, bbbHdmiPin: false, emmcPin: false }),
	new BbbPinInfo({ header: 9, headerPin: 16, gpioNum: 51 , name: "EHRPWM1B"  , r30pru: null, r30bit: null, bbbHdmiPin: false, emmcPin: false }),
	new BbbPinInfo({ header: 9, headerPin: 17, gpioNum: 5  , name: "I2C1_SCL"  , r30pru: null, r30bit: null, bbbHdmiPin: false, emmcPin: false }),
	new BbbPinInfo({ header: 9, headerPin: 18, gpioNum: 4  , name: "I2C1_SDA"  , r30pru: null, r30bit: null, bbbHdmiPin: false, emmcPin: false }),
	new BbbPinInfo({ header: 9, headerPin: 19, gpioNum: 13 , name: "I2C2_SCL"  , r30pru: null, r30bit: null, bbbHdmiPin: false, emmcPin: false }),
	new BbbPinInfo({ header: 9, headerPin: 20, gpioNum: 12 , name: "I2C2_SDA"  , r30pru: null, r30bit: null, bbbHdmiPin: false, emmcPin: false }),
	new BbbPinInfo({ header: 9, headerPin: 21, gpioNum: 3  , name: "UART2_TXD" , r30pru: null, r30bit: null, bbbHdmiPin: false, emmcPin: false }),
	new BbbPinInfo({ header: 9, headerPin: 22, gpioNum: 2  , name: "UART2_RXD" , r30pru: null, r30bit: null, bbbHdmiPin: false, emmcPin: false }),
	new BbbPinInfo({ header: 9, headerPin: 23, gpioNum: 49 , name: "GPIO1_17"  , r30pru: null, r30bit: null, bbbHdmiPin: false, emmcPin: false }),
	new BbbPinInfo({ header: 9, headerPin: 24, gpioNum: 15 , name: "UART1_TXD" , r30pru: null, r30bit: null, bbbHdmiPin: false, emmcPin: false }),
	new BbbPinInfo({ header: 9, headerPin: 25, gpioNum: 117, name: "GPIO3_21"  , r30pru:    0, r30bit:    7, bbbHdmiPin: false, emmcPin: false }),
	new BbbPinInfo({ header: 9, headerPin: 26, gpioNum: 14 , name: "UART1_RXD" , r30pru: null, r30bit: null, bbbHdmiPin: false, emmcPin: false }),
	new BbbPinInfo({ header: 9, headerPin: 27, gpioNum: 115, name: "GPIO3_19"  , r30pru:    0, r30bit:    5, bbbHdmiPin: false, emmcPin: false }),
	new BbbPinInfo({ header: 9, headerPin: 28, gpioNum: 113, name: "SPI1_CS0"  , r30pru:    0, r30bit:    3, bbbHdmiPin: false, emmcPin: false }),
	new BbbPinInfo({ header: 9, headerPin: 29, gpioNum: 111, name: "SPI1_MISO" , r30pru:    0, r30bit:    1, bbbHdmiPin: false, emmcPin: false }), // Was SPI1_D0 (Input)
	new BbbPinInfo({ header: 9, headerPin: 30, gpioNum: 112, name: "SPI1_MOSI" , r30pru:    0, r30bit:    2, bbbHdmiPin: false, emmcPin: false }), // Was SPI1_D1 (Output)
	new BbbPinInfo({ header: 9, headerPin: 31, gpioNum: 110, name: "SPI1_CLK"  , r30pru:    0, r30bit:    0, bbbHdmiPin: false, emmcPin: false }),
	new BbbPinInfo({ header: 9, headerPin: 32, gpioNum: 0  , name: "VDD_ADC"   , r30pru: null, r30bit: null, bbbHdmiPin: false, emmcPin: false }),
	new BbbPinInfo({ header: 9, headerPin: 33, gpioNum: 0  , name: "AIN4"      , r30pru: null, r30bit: null, bbbHdmiPin: false, emmcPin: false }),
	new BbbPinInfo({ header: 9, headerPin: 34, gpioNum: 0  , name: "GNDA_ADC"  , r30pru: null, r30bit: null, bbbHdmiPin: false, emmcPin: false }),
	new BbbPinInfo({ header: 9, headerPin: 35, gpioNum: 0  , name: "AIN6"      , r30pru: null, r30bit: null, bbbHdmiPin: false, emmcPin: false }),
	new BbbPinInfo({ header: 9, headerPin: 36, gpioNum: 0  , name: "AIN5"      , r30pru: null, r30bit: null, bbbHdmiPin: false, emmcPin: false }),
	new BbbPinInfo({ header: 9, headerPin: 37, gpioNum: 0  , name: "AIN2"      , r30pru: null, r30bit: null, bbbHdmiPin: false, emmcPin: false }),
	new BbbPinInfo({ header: 9, headerPin: 38, gpioNum: 0  , name: "AIN3"      , r30pru: null, r30bit: null, bbbHdmiPin: false, emmcPin: false }),
	new BbbPinInfo({ header: 9, headerPin: 39, gpioNum: 0  , name: "AIN0"      , r30pru: null, r30bit: null, bbbHdmiPin: false, emmcPin: false }),
	new BbbPinInfo({ header: 9, headerPin: 40, gpioNum: 0  , name: "AIN1"      , r30pru: null, r30bit: null, bbbHdmiPin: false, emmcPin: false }),
	new BbbPinInfo({ header: 9, headerPin: 41, gpioNum: 20 , name: "CLKOUT2"   , r30pru:    0, r30bit:    6, bbbHdmiPin: false, emmcPin: false }),
	new BbbPinInfo({ header: 9, headerPin: 42, gpioNum: 7  , name: "GPIO1_7"   , r30pru:    0, r30bit:    4, bbbHdmiPin: false, emmcPin: false }),
	new BbbPinInfo({ header: 9, headerPin: 43, gpioNum: 0  , name: "GND"       , r30pru: null, r30bit: null, bbbHdmiPin: false, emmcPin: false }),
	new BbbPinInfo({ header: 9, headerPin: 44, gpioNum: 0  , name: "GND"       , r30pru: null, r30bit: null, bbbHdmiPin: false, emmcPin: false }),
	new BbbPinInfo({ header: 9, headerPin: 45, gpioNum: 0  , name: "GND"       , r30pru: null, r30bit: null, bbbHdmiPin: false, emmcPin: false }),
	new BbbPinInfo({ header: 9, headerPin: 46, gpioNum: 0  , name: "GND"       , r30pru: null, r30bit: null, bbbHdmiPin: false, emmcPin: false }),
];
export var pinIndex = new BbbPinIndex(pinData);