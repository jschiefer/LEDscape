import { BbbPinInfo, pinData, pinIndex } from './bbbPinData'

var Color = {
	black: 30,
	blue: 34,
	cyan: 36,
	green: 32,
	magenta: 35,
	red: 31,
	yellow: 33,
	grey: 90,
	brightBlack: 90,
	brightRed: 91,
	brightGreen: 92,
	brightYellow: 93,
	brightBlue: 94,
	brightMagenta: 95,
	brightCyan: 96,
	brightWhite: 97,
};

var defaultCellSize = 5;
var rowStr = "";
function cell(
	content: any,
	color: number = null,
	cellSize: number = defaultCellSize
) {
	var contentStr = "" + content;
	var paddingHalf = (cellSize - contentStr.length) / 2;
	for (var i=0; i<Math.ceil(paddingHalf); i++) { contentStr = " " + contentStr };
	for (var i=0; i<Math.floor(paddingHalf); i++) { contentStr = contentStr + " " };

	if (color) { rowStr += "\x1b[01;" + color + "m"; }
	rowStr += contentStr;
	if (color) { rowStr += "\x1b[0m"; }
}

function endRow() {
	console.info(rowStr);
	rowStr = "";
}

export function printPinTable(
	tableTitle: string,
	infoCellFunc: (pin: BbbPinInfo) => any
) {
	var infoColumnWidth = 12;

	var headerColumnsWidth = defaultCellSize*3 + infoColumnWidth*2;
	cell(tableTitle, Color.brightBlue, headerColumnsWidth*2 + defaultCellSize);
	endRow();

	cell("Row", Color.brightMagenta);
	cell("Pin#", Color.brightMagenta);
	cell("P9", Color.blue, 24);
	cell("Pin#", Color.brightMagenta);
	cell("|", null, 4);
	cell("Pin#", Color.brightMagenta);
	cell("P8", Color.blue, 24);
	cell("Pin#", Color.brightMagenta);
	cell("Row", Color.brightMagenta);
	endRow();

	for (var row = 0; row < 23; row++) {
		cell(row+1, Color.cyan);
		cell(row*2+1, Color.yellow);
		cell(infoCellFunc(pinIndex.pinsByHeaderAndPin[9][row*2+1]), Color.brightGreen, infoColumnWidth);
		cell(infoCellFunc(pinIndex.pinsByHeaderAndPin[9][row*2+2]), Color.brightGreen, infoColumnWidth);
		cell(row*2+2, Color.yellow);
		cell("|", null, 4);
		cell(row*2+1, Color.yellow);
		cell(infoCellFunc(pinIndex.pinsByHeaderAndPin[8][row*2+1]), Color.brightGreen, infoColumnWidth);
		cell(infoCellFunc(pinIndex.pinsByHeaderAndPin[8][row*2+2]), Color.brightGreen, infoColumnWidth);
		cell(row*2+2, Color.yellow);
		cell(row+1, Color.cyan);
		endRow();
	}
	endRow();
}