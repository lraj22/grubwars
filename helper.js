import { readFileSync } from "node:fs";
import { join } from "node:path";
import { getGrubwars } from "./datahandler.js";
const dataFilePath = join(import.meta.dirname, "data/grubwars.json");
let grubwars = JSON.parse(readFileSync(dataFilePath, "utf8"));

export function getTeamOf (playerId, expanded) {
	grubwars = getGrubwars();
	
	let inHackgrub = grubwars.teams.hackgrub.includes(playerId);
	if (inHackgrub) return expanded ? "Hack Grub" : "hackgrub";
	
	let inSnackclub = grubwars.teams.snackclub.includes(playerId);
	if (inSnackclub) return expanded ? "Snack Club" : "snackclub";
	
	return null;
}

export function getUserAt (text) {
	text = text.trim();
	let targetId = text.match(/<@([A-Z0-9]+?)\|.+?>/);
	let targetName;
	if (targetId) {
		targetId = targetId[1];
		targetName = text.match(/<@[A-Z0-9]+?\|(.+?)>/)[1];
		return [targetId, targetName];
	}
	return [null, null];
}

export function count (quantity, itemName) {
	let pluralizer = itemName.match(/[hx]$/) ? "es" : "s"; // if ends in h (sandwich, peach) or x (box), use 'es'
	return quantity + " " + itemName + ((quantity === 1) ? "" : pluralizer);
}
