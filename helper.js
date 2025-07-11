import { readFileSync } from "node:fs";
import { dataFilePath, getGrubwars } from "./datahandler.js";
let grubwars = JSON.parse(readFileSync(dataFilePath, "utf8"));

export function getTeamOf (playerId, expanded) {
	grubwars = getGrubwars();
	
	let inHackgrub = grubwars.teams.hackgrub.includes(playerId);
	if (inHackgrub) return expanded ? "Hack Grub" : "hackgrub";
	
	let inSnackclub = grubwars.teams.snackclub.includes(playerId);
	if (inSnackclub) return expanded ? "Snack Club" : "snackclub";
	
	return null;
}
