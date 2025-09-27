import { readFileSync } from "node:fs";
import { join } from "node:path";
import { getGrubwars } from "./datahandler.js";
import { items } from "./grubwars-data.js";
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

export function commaListify (list) {
	let lastIndex = list.length - 1;
	if (list.length > 1) list[lastIndex] = "and " + list[lastIndex];
	return ((list.length > 2) ? list.join(", ") : list.join(" "));
}

export function effectsToText (effects) {
	let effectsCombined = {};
	let now = Date.now();
	
	// add effects of the same name together (if currently valid)
	effects.forEach(effect => {
		if (now > effect.expires) return;
		if (!(effect.name in effectsCombined)) effectsCombined[effect.name] = 0;
		effectsCombined[effect.name] += 1;
	});
	
	// combine into a list array
	let effectsText = [];
	Object.entries(effectsCombined).forEach(effect => {
		let [name, quantity] = effect;
		let parts = name.split("-");
		let isForeign = false;
		if (parts[1] === "thrown") isForeign = true;
		effectsText.push(count(quantity, (isForeign ? "foreign " : "") + items[parts[0]].name));
	});
	
	// add 'and' if long enough
	let length = effectsText.length;
	if (length > 1) {
		effectsText[length - 2] += ", and " + effectsText[length - 1];
		effectsText.pop();
	}
	
	return effectsText.join(", ");
}
