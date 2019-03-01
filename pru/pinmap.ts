import { pinData, pinIndex } from './bbbPinData'
import { printPinTable } from './pinTable'
import * as shell from 'shelljs'
import { ExecOutputReturnValue } from "shelljs";
import stripJsonComments = require('strip-json-comments')
import {PinMappingData} from "./bbbPinData";
import {BasePruProgram} from "./jstemplates/common";
import {GeneratedPruProgram} from "./jstemplates/common";

const XXH = require('xxhashjs');

function writeSync(fname, data) {
	const fd = fs.openSync(fname, "w");
	fs.writeSync(fd, data);
	fs.closeSync(fd);
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Program Commands
const Commands = {
	"tables": function(){
		printPinTable("GPIO: BANK_BIT", pin => pin.gpioNum ? pin.gpioName : "");
		printPinTable("GPIO: Global Number", pin => pin.gpioNum || "");
		printPinTable("Mapped Channel Index", pin => pin.mappedChannelIndex != undefined ? pin.mappedChannelIndex : "");
		printPinTable("HDMI / eMMC Conflicts", pin => pin.mappedChannelIndex != undefined ? (pin.mappedChannelIndex + (pin.bbbHdmiPin?"H":"") + (pin.emmcPin?"E":"")) : "");

		printPinTable("Unused Channels", pin => (pin.mappedChannelIndex == undefined && pin.gpioNum != undefined) ? pin.gpioName : "");

		console.info("PRU0 Pins: " + pinIndex.pinData.filter(d => d.r30pru == 0).length);
		console.info("PRU1 Pins: " + pinIndex.pinData.filter(d => d.r30pru == 1).length);

		printPinTable("NAME", pin => pin.name);
	},

	"pinout": function(){
		printPinTable("Internal Channel Index", pin => pin.mappedChannelIndex != undefined ? pin.mappedChannelIndex : "" );
	},

	"mapping-data": function() {
		console.info('\t"mappedPinNumberToPinDesignator": {');
		pinData
			.filter((pin) => pin.mappedChannelIndex !== undefined)
			.sort((a, b) => a.mappedChannelIndex - b.mappedChannelIndex)
			.forEach((pin) => {
				console.info('\t\t"' + pin.mappedChannelIndex + '": "' + pin.headerName + '", // GPIO' + pin.gpioName + ', ' + pin.name);
			}, {});
		console.info("\t}");
	},

	"pru-setup": function(options) {
		let tempDir = shell.tempdir() + "/ledscape";
		if (typeof(options.tempDir) === "string") {
			tempDir = options.tempDir;
		}

		let modeName = options.mode;
		if (typeof(modeName) !== "string") {
			usage("--mode requires an argument");
		}

		let channelCount = options["channel-count"] | 0;
		if (!(channelCount > 0 && channelCount <= 48)) {
			usage("--channel-count must be an integer between 1 and 48")
		}

		process.stderr.write("tempDir: " + tempDir + "\n");
		shell.mkdir('-p', tempDir);
		shell.cp("-f", __dirname + "/jstemplates/common.p.h", tempDir);

		function buildProgram(pruNum) {
			let asmGenerationResult = generatePruProgram(modeName, pruNum, channelCount);

			function pathOf(name) { return tempDir + "/" + name; }

			let programName = modeName + "-" + mappingFilename.match(/.*?([^\/\.]+)(\..+)?/)[1] + "-pru" + pruNum + "-" + channelCount + "ch";
			let asmCodeHash = XXH(asmGenerationResult.pruCode, 0x243F6A88).toString(16);

			let asmFileName = programName + ".p";
			let binFileName = programName + ".bin";
			let hashFileName = programName + ".xxh";

			if (!shell.test("-e", pathOf(hashFileName)) || shell.cat(pathOf(hashFileName)) != asmCodeHash) {
				(<any>asmGenerationResult.pruCode).to(pathOf(asmFileName));

				execOrDie(
					"Compiling " + pathOf(asmFileName),
					"cd '" + tempDir + "'; " + __dirname + "/../am335x/pasm/pasm -V3 -b " + asmFileName
				);

				asmCodeHash.to(pathOf(hashFileName));
			} else {
				console.error("Existing PRU Code Matches hash for " + pathOf(asmFileName));
			}

			return {
				binFile: pathOf(binFileName),
				usedPins: asmGenerationResult.usedPins
			}
		}

		let pru0Result = buildProgram(0);
		let pru1Result = buildProgram(1);

		let usedPins = pru0Result.usedPins.concat(pru1Result.usedPins);

		function buildSetupScript() {
			const capemgrDirectories = [
				"/sys/devices/bone_capemgr",
				"/sys/devices/platform/bone_capemgr",
				"/sys/devices/bone_capemgr.9"
			];
			const setupScriptPath = tempDir + "/" + modeName + "-" + mappingFilename.match(/.*?([^\/\.]+)(\..+)?/)[1] + "-" + channelCount + "ch-setup.sh";

			let setupScript = `
function enableOverlay() {
	OVERLAY_NAME=$1
	
	for CAPEMGR in ${capemgrDirectories.join(" ")}; do
		if [ -d "$CAPEMGR" ]; then
			if grep "$OVERLAY_NAME" "$CAPEMGR/slots" &>/dev/null; then
					echo PRU overlay $OVERLAY_NAME already present in $CAPEMGR/slots
				else
					if echo "$OVERLAY_NAME" > "$CAPEMGR/slots"; then
						echo Enabled PRU using overlay $OVERLAY_NAME into $CAPEMGR/slots
					else
						echo ERROR: Failed to load overlay $OVERLAY_NAME into $CAPEMGR/slots
						exit -1
					fi
				fi
			return
		fi
	done
	
	echo ERROR: Failed to find a bone_capemgr
	exit -1
}

echo Enabling PRUs using overlay...
enableOverlay uio_pruss_enable

if modprobe uio_pruss; then
	echo Loaded module uio_pruss
else
	echo ERROR: Failed to load module uio_pruss
	exit -1
fi
`;

			if (pinMapping.dtbName) {
				const dtboSourceFilename = __dirname + "/../dts/" + pinMapping.dtbName + "-00A0.dtbo";
				const dtboDestFilename = "/lib/firmware/" + pinMapping.dtbName + "-00A0.dtbo";

				setupScript += `
for CAPEMGR in ${capemgrDirectories.join(" ")}; do
	if [ -d "$CAPEMGR" ]; then
		if [ -e "${dtboSourceFilename}" ]; then
			if [ -e "${dtboDestFilename}" ]; then
				echo Overlay dtbo already exists: ${dtboDestFilename}
			elif cp "${dtboSourceFilename}" "${dtboDestFilename}"; then
				echo Copied overlay dtbo ${dtboSourceFilename} to ${dtboDestFilename}
			else
				echo ERROR: Failed to copy overlay dtbo from ${dtboSourceFilename} to ${dtboDestFilename}
				exit -1
			fi
			
			echo Mapping LEDscape pins using overlay...
			enableOverlay ${pinMapping.dtbName}
		fi
		exit 0
	fi
done

echo ERROR: Failed to find a bone_capemgr in /sys/
exit -1
					`;
			} else {
				setupScript += `if [ -d /sys/class/gpio ]; then\n`;

				usedPins.forEach(
					function (pin) {
						setupScript += `    echo 'Setting up channel ${pin.mappedChannelIndex} (pin ${pin.headerName})'\n`;
						setupScript += `    echo ${pin.gpioNum} >> /sys/class/gpio/export\n`;
						setupScript += `    echo out >> /sys/class/gpio/gpio${pin.gpioNum}/direction\n`;
						setupScript += `    echo 0 >> /sys/class/gpio/gpio${pin.gpioNum}/value\n`;
					}
				);

				setupScript += `
				else
					echo ERROR: No /sys/class/gpio found.
					exit -1
				fi
				`;

			}

			(setupScript as any).to(setupScriptPath);
		}

		buildSetupScript();

		console.info("PRU0:", pru0Result.binFile);
		console.info("PRU1:", pru1Result.binFile);
	}
};

function execOrDie(
	description,
	commandStr
) {
	var result = <ExecOutputReturnValue> shell.exec(commandStr, { silent: true });
	if (result.code !== 0) {
		console.error("FAILED: " + description + " (" + result.code + "): " + commandStr);
		console.error(result.output.split("\n").join("\n  "));
		shell.exit(-1);
	}
	else {
		console.error("SUCCESS: " + description +": " + commandStr);
		return result;
	}
}

function generatePruProgram(
	modeName: string,
	pruNum: number,
	globalChannelCount: number
): GeneratedPruProgram {
	var ProgramClass = require("./jstemplates/" + modeName).default;
	var instance: BasePruProgram = new ProgramClass(
		pruNum,
		globalChannelCount
	);

	return instance.generate();
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Bootstrap

var mappingFilename = "original-ledscape";

function usage(error?: string) {
	if (error) {
		console.error(error);
		console.info();
	}

	console.info("Usage: " + process.execPath + " [--mapping mappingFile] [tables | pru-headers]");
	process.exit(error ? -1 : 0);
}

var commandFunc = Commands.pinout;
var optionMap = {};
var lastOptName = null;
var parsedArgs = [];

process.argv.forEach(function(arg, i) {
	function parseArg(a) {
		if (a === "true") return true;
		if (a === "false") return false;
		if (a === "null") return null;
		if (!isNaN(a)) return 1 * a;
		return a;
	}

	if (arg === "-h" || arg === "-?") {
		usage();
	}

	else if (arg in Commands) {
		commandFunc = Commands[arg];
	}

	else if (arg.substring(0, 2) == "--") {
		lastOptName = arg.substring(2);
		optionMap[lastOptName] = true;
	}

	else if (arg.substring(0, 1) == "-") {
		lastOptName = arg.substring(1);
		optionMap[lastOptName] = true;
	}

	else {
		if (lastOptName !== null) {
			optionMap[lastOptName] = parseArg(arg);
		} else {
			parsedArgs.push(parseArg(arg));
		}
		lastOptName = null;
	}
});

if ("mapping" in optionMap) {
	if (optionMap["mapping"] === true) {
		usage("--mapping requires an argument");
	} else {
		mappingFilename = optionMap["mapping"];
	}
}

var fs = require('fs');
var path = require('path');

// Look for the mapping file in various places... allow the name of the mapping with or without an extension and
// allow references to the mappings in the relative directory mappings/
var validPaths = [
	mappingFilename,
	mappingFilename + ".json",
	path.dirname(require.main.filename) + "/mappings/" + mappingFilename,
	path.dirname(require.main.filename) + "/mappings/" + mappingFilename + ".json"
].filter(fs.existsSync);

if (validPaths.length == 0) {
	usage("Could not find mapping: " + mappingFilename);
}

var pinMapping: PinMappingData;
try {
	pinMapping = JSON.parse(stripJsonComments(fs.readFileSync(validPaths[0], "utf8")));
} catch (e) {
	console.error(e);
	usage("Failed to parse mapping at " + validPaths[0] + "\n");
}

process.stderr.write("Mapping: " + mappingFilename + " (" + pinMapping.name + ")\n");

if (pinMapping.mappedPinNumberToPinDesignator) {
	pinIndex.applyMappingData(pinMapping);
}
else {
	usage("Invalid mapping file format. No mappedPinNumberToPinDesignator field found.");
}

// Call the desired command
commandFunc.call(this, optionMap, parsedArgs);