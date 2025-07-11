import fs from "node:fs";
import { join } from "node:path";
import { createHash } from "node:crypto";

const dataFile = "data/grubwars.json";
const dataFilePath = join(import.meta.dirname, dataFile);
let grubwars = JSON.parse(fs.readFileSync(dataFilePath, "utf8"));
const shortMonths = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const logStream = fs.createWriteStream(join(import.meta.dirname, "data/grubwars.log"), {
	"flags": "a",
});

function hourlyBackup (scheduleNext) {
	log(`💾 Hourly backup! ${scheduleNext ? "S" : "Not s"}cheduling next.`);
	
	// schedule next if necessary
	if (scheduleNext) {
		let nextBackupTime = new Date();
		nextBackupTime.setMinutes(0);
		nextBackupTime.setSeconds(0);
		nextBackupTime.setMilliseconds(0);
		nextBackupTime.setHours(nextBackupTime.getHours() + 1);
		setTimeout(() => {
			hourlyBackup(true);
		}, nextBackupTime - Date.now());
	}
	
	// ensure backup is necessary (i.e. not duplicate)
	const luhFile = join(import.meta.dirname, "data/lastUpdatedHash.txt");
	const lastUpdatedHash = fs.readFileSync(luhFile, "utf8");
	const currentHash = createHash("sha256").update(JSON.stringify(grubwars)).digest("hex");
	if (currentHash === lastUpdatedHash) {
		log(`💾 Save canceled: hash matched (${currentHash})`)
		return;
	}
	
	// backup grubwars
	let now = new Date();
	let backupPath = "backups/hourly-"
		+ now.getFullYear()
		+ "-"
		+ pad0(now.getMonth() + 1)
		+ "-"
		+ pad0(now.getDate())
		+ "-"
		+ pad0(now.getHours())
		+ "h.json";
	fs.writeFileSync(join(import.meta.dirname, backupPath), JSON.stringify(grubwars, null, "\t"));
	
	// update new hash, too
	fs.writeFileSync(luhFile, currentHash);
	log(`💾 Saved with new hash ${currentHash}`);
}

// start the loop now
hourlyBackup(true);

function log (message) {
	var now = new Date();
	var timecode = "["
		+ now.getFullYear()
		+ "_"
		+ shortMonths[now.getMonth()]
		+ "_"
		+ pad0(now.getDate())
		+ ", "
		+ pad0(now.getHours())
		+ ":"
		+ pad0(now.getMinutes())
		+ ":"
		+ pad0(now.getSeconds())
		+ "."
		+ pad0(now.getMilliseconds(), 3)
		+ "] ";
	if (typeof message === "object") message = JSON.stringify(message);
	console.log(timecode + message);
	logStream.write(timecode + message + "\n");
}

function getGrubwars () {
	return cloneObj(grubwars);
}

function saveState (data) {
	// update 'grubwars' so hourly backup is in the know
	grubwars = cloneObj(data);
	
	// add debug info to bottom (hence delete first)
	let saveObj = cloneObj(data);
	delete saveObj.debug;
	saveObj.debug = {
		"lastUpdated": Date.now(),
		"lastUpdatedReadable": new Date().toString(),
	};
	fs.writeFileSync(dataFilePath, JSON.stringify(saveObj, null, "\t"));
}

function pad0 (string, length) {
	return string.toString().padStart(length || 2, "0");
}

// cloneObj function taken from https://stackoverflow.com/a/7574273
function cloneObj (obj) {
	if (obj == null || typeof (obj) != 'object') {
		return obj;
	}

	var clone = new obj.constructor();
	for (var key in obj) {
		if (obj.hasOwnProperty(key)) {
			clone[key] = cloneObj(obj[key]);
		}
	}

	return clone;
}

export {
	dataFilePath,
	saveState,
	getGrubwars,
	log,
};
