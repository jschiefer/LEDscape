var bbbPinData_1 = require('./bbbPinData');
var pinTable_1 = require('./pinTable');
var shell = require('shelljs');
var stripJsonComments = require('strip-json-comments');
var XXH = require('xxhashjs');
function writeSync(fname, data) {
    var fd = fs.openSync(fname, "w");
    fs.writeSync(fd, data);
    fs.closeSync(fd);
}
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Program Commands
var Commands = {
    "tables": function () {
        pinTable_1.printPinTable("GPIO: BANK_BIT", function (pin) { return pin.gpioNum ? pin.gpioName : ""; });
        pinTable_1.printPinTable("GPIO: Global Number", function (pin) { return pin.gpioNum || ""; });
        pinTable_1.printPinTable("Mapped Channel Index", function (pin) { return pin.mappedChannelIndex != undefined ? pin.mappedChannelIndex : ""; });
        pinTable_1.printPinTable("Unused Channels", function (pin) { return (pin.mappedChannelIndex == undefined && pin.gpioNum != undefined) ? pin.gpioName : ""; });
        console.info("PRU0 Pins: " + bbbPinData_1.pinIndex.pinData.filter(function (d) { return d.r30pru == 0; }).length);
        console.info("PRU1 Pins: " + bbbPinData_1.pinIndex.pinData.filter(function (d) { return d.r30pru == 1; }).length);
        pinTable_1.printPinTable("NAME", function (pin) { return pin.name; });
    },
    "pinout": function () {
        pinTable_1.printPinTable("Internal Channel Index", function (pin) { return pin.mappedChannelIndex != undefined ? pin.mappedChannelIndex : ""; });
    },
    "mapping-data": function () {
        console.info('\t"mappedPinNumberToPinDesignator": {');
        bbbPinData_1.pinData
            .filter(function (pin) { return pin.mappedChannelIndex !== undefined; })
            .sort(function (a, b) { return a.mappedChannelIndex - b.mappedChannelIndex; })
            .forEach(function (pin) {
            console.info('\t\t"' + pin.mappedChannelIndex + '": "' + pin.headerName + '", // GPIO' + pin.gpioName + ', ' + pin.name);
        }, {});
        console.info("\t}");
    },
    "pru-setup": function (options) {
        var tempDir = shell.tempdir() + "/ledscape";
        if (typeof (options.tempDir) === "string") {
            tempDir = options.tempDir;
        }
        var modeName = options.mode;
        if (typeof (modeName) !== "string") {
            usage("--mode requires an argument");
        }
        var channelCount = options["channel-count"] | 0;
        if (!(channelCount > 0 && channelCount <= 48)) {
            usage("--channel-count must be an integer between 1 and 48");
        }
        process.stderr.write("tempDir: " + tempDir + "\n");
        shell.mkdir('-p', tempDir);
        shell.cp("-f", __dirname + "/jstemplates/common.p.h", tempDir);
        function buildProgram(pruNum) {
            var asmGenerationResult = generatePruProgram(modeName, pruNum, channelCount);
            function pathOf(name) { return tempDir + "/" + name; }
            var programName = modeName + "-" + mappingFilename.match(/.*?([^\/\.]+)(\..+)?/)[1] + "-pru" + pruNum + "-" + channelCount + "ch";
            var asmCodeHash = XXH(asmGenerationResult.pruCode, 0x243F6A88).toString(16);
            var asmFileName = programName + ".p";
            var binFileName = programName + ".bin";
            var hashFileName = programName + ".xxh";
            if (!shell.test("-e", pathOf(hashFileName)) || shell.cat(pathOf(hashFileName)) != asmCodeHash) {
                asmGenerationResult.pruCode.to(pathOf(asmFileName));
                execOrDie("Compiling " + pathOf(asmFileName), "cd '" + tempDir + "'; " + __dirname + "/../am335x/pasm/pasm -V3 -b " + asmFileName);
                asmCodeHash.to(pathOf(hashFileName));
            }
            else {
                console.error("Existing PRU Code Matches hash for " + pathOf(asmFileName));
            }
            return {
                binFile: pathOf(binFileName),
                usedPins: asmGenerationResult.usedPins
            };
        }
        var pru0Result = buildProgram(0);
        var pru1Result = buildProgram(1);
        var usedPins = pru0Result.usedPins.concat(pru1Result.usedPins);
        function buildSetupScript() {
            var capemgrDirectories = [
                "/sys/devices/bone_capemgr",
                "/sys/devices/platform/bone_capemgr",
                "/sys/devices/bone_capemgr.9"
            ];
            var setupScriptPath = tempDir + "/" + modeName + "-" + mappingFilename.match(/.*?([^\/\.]+)(\..+)?/)[1] + "-" + channelCount + "ch-setup.sh";
            var setupScript = "\nfunction enableOverlay() {\n\tOVERLAY_NAME=$1\n\t\n\tfor CAPEMGR in " + capemgrDirectories.join(" ") + "; do\n\t\tif [ -d \"$CAPEMGR\" ]; then\n\t\t\tif grep \"$OVERLAY_NAME\" \"$CAPEMGR/slots\" &>/dev/null; then\n\t\t\t\t\techo PRU overlay $OVERLAY_NAME already present in $CAPEMGR/slots\n\t\t\t\telse\n\t\t\t\t\tif echo \"$OVERLAY_NAME\" > \"$CAPEMGR/slots\"; then\n\t\t\t\t\t\techo Enabled PRU using overlay $OVERLAY_NAME into $CAPEMGR/slots\n\t\t\t\t\telse\n\t\t\t\t\t\techo ERROR: Failed to load overlay $OVERLAY_NAME into $CAPEMGR/slots\n\t\t\t\t\t\texit -1\n\t\t\t\t\tfi\n\t\t\t\tfi\n\t\t\treturn\n\t\tfi\n\tdone\n\t\n\techo ERROR: Failed to find a bone_capemgr\n\texit -1\n}\n\necho Enabling PRUs using overlay...\nenableOverlay uio_pruss_enable\n\nif modprobe uio_pruss; then\n\techo Loaded module uio_pruss\nelse\n\techo ERROR: Failed to load module uio_pruss\n\texit -1\nfi\n";
            if (pinMapping.dtbName) {
                var dtboSourceFilename = __dirname + "/../dts/" + pinMapping.dtbName + "-00A0.dtbo";
                var dtboDestFilename = "/lib/firmware/" + pinMapping.dtbName + "-00A0.dtbo";
                setupScript += "\nfor CAPEMGR in " + capemgrDirectories.join(" ") + "; do\n\tif [ -d \"$CAPEMGR\" ]; then\n\t\tif [ -e \"" + dtboSourceFilename + "\" ]; then\n\t\t\tif [ -e \"" + dtboDestFilename + "\" ]; then\n\t\t\t\techo Overlay dtbo already exists: " + dtboDestFilename + "\n\t\t\telif cp \"" + dtboSourceFilename + "\" \"" + dtboDestFilename + "\"; then\n\t\t\t\techo Copied overlay dtbo " + dtboSourceFilename + " to " + dtboDestFilename + "\n\t\t\telse\n\t\t\t\techo ERROR: Failed to copy overlay dtbo from " + dtboSourceFilename + " to " + dtboDestFilename + "\n\t\t\t\texit -1\n\t\t\tfi\n\t\t\t\n\t\t\techo Mapping LEDscape pins using overlay...\n\t\t\tenableOverlay " + pinMapping.dtbName + "\n\t\tfi\n\t\texit 0\n\tfi\ndone\n\necho ERROR: Failed to find a bone_capemgr in /sys/\nexit -1\n\t\t\t\t\t";
            }
            else {
                setupScript += "if [ -d /sys/class/gpio ]; then";
                usedPins.forEach(function (pin) {
                    setupScript += "    echo Setting up channel " + pin.mappedChannelIndex + " (pin " + pin.headerName + ")\n";
                    setupScript += "    echo " + pin.gpioNum + " >> /sys/class/gpio/export\n";
                    setupScript += "    echo out >> /sys/class/gpio/gpio/" + pin.gpioNum + "/direction\n";
                    setupScript += "    echo 0 >> /sys/class/gpio/gpio" + pin.gpioNum + "/value\n";
                });
                setupScript += "\n\t\t\t\telse\n\t\t\t\t\techo ERROR: No /sys/class/gpio found.\n\t\t\t\t\texit -1\n\t\t\t\tfi\n\t\t\t\t";
            }
            setupScript.to(setupScriptPath);
        }
        buildSetupScript();
        console.info("PRU0:", pru0Result.binFile);
        console.info("PRU1:", pru1Result.binFile);
    }
};
function execOrDie(description, commandStr) {
    var result = shell.exec(commandStr, { silent: true });
    if (result.code !== 0) {
        console.error("FAILED: " + description + " (" + result.code + "): " + commandStr);
        console.error(result.output.split("\n").join("\n  "));
        shell.exit(-1);
    }
    else {
        console.error("SUCCESS: " + description + ": " + commandStr);
        return result;
    }
}
function generatePruProgram(modeName, pruNum, globalChannelCount) {
    var ProgramClass = require("./jstemplates/" + modeName).default;
    var instance = new ProgramClass(pruNum, globalChannelCount);
    return instance.generate();
}
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Bootstrap
var mappingFilename = "original-ledscape";
function usage(error) {
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
process.argv.forEach(function (arg, i) {
    function parseArg(a) {
        if (a === "true")
            return true;
        if (a === "false")
            return false;
        if (a === "null")
            return null;
        if (!isNaN(a))
            return 1 * a;
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
        }
        else {
            parsedArgs.push(parseArg(arg));
        }
        lastOptName = null;
    }
});
if ("mapping" in optionMap) {
    if (optionMap["mapping"] === true) {
        usage("--mapping requires an argument");
    }
    else {
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
var pinMapping;
try {
    pinMapping = JSON.parse(stripJsonComments(fs.readFileSync(validPaths[0], "utf8")));
}
catch (e) {
    console.error(e);
    usage("Failed to parse mapping at " + validPaths[0] + "\n");
}
process.stderr.write("Mapping: " + mappingFilename + " (" + pinMapping.name + ")\n");
if (pinMapping.mappedPinNumberToPinDesignator) {
    bbbPinData_1.pinIndex.applyMappingData(pinMapping);
}
else {
    usage("Invalid mapping file format. No mappedPinNumberToPinDesignator field found.");
}
// Call the desired command
commandFunc.call(this, optionMap, parsedArgs);
//# sourceMappingURL=pinmap.js.map