import fs from "node:fs";
import { join } from "node:path";
import { createHash } from "node:crypto";
import app from "./client.js";
import { getUserAt } from "./helper.js";

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

async function logInteraction (interaction) {
	let user = await userRef(interaction);
	let channel = interaction.payload.channel_name || interaction.body.channel.name || "<no channel>";
	
	if (interaction.command) {
		log(`[${channel}] ${user} ran command ${interaction.command.command} ${JSON.stringify(await userRefify(interaction.command.text))}`);
	} else if (interaction.action) {
		log(`[${channel}] ${user} clicked action ${interaction.action.action_id}`);
	} else {
		log(`Unknown interaction logged: ${JSON.stringify(interaction, null, "\t")}`);
	}
}

async function userRef (interaction, defaultName) {
	// get id and name from interaction
	let id, name;
	if (typeof interaction === "string") {
		id = interaction;
	} else {
		id = interaction.payload.user_id || interaction.body.user.id || "<no id>";
	}
	
	if (id in grubwars.players) {
		// player registered! Use preferred name
		name = grubwars.players[id].preferredName;
		return `<u:${name}>`;
	} else if (typeof interaction === "string") {
		// just an ID
		if (defaultName) name = defaultName;
		else {
			name = (await app.client.users.info({
				"user": id
			})).user.name;
			log(`🔍 Couldn't find ${id}, lookup resulted in ${name}`);
		}
	} else {
		// an interaction object. Let's check its properties
		name = interaction.payload.user_name || interaction.body.user.name || defaultName || "<no name>";
	}
	
	// return generic response
	return `<@${id}|${name}>`;
}

async function userRefify (text, limit) {
	if (!limit) limit = Infinity;
	while (limit--) {
		let [id, name] = getUserAt(text);
		if (!id) break;
		
		let ref = await userRef(id, name);
		text = text.replace(/<@[A-Z0-9]+\|.*>/, ref);
	}
	return text;
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
	saveState,
	getGrubwars,
	log,
	logInteraction,
	userRef,
};
