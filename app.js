import app from "./client.js";
import {
	dataFilePath,
	saveState,
} from "./datahandler.js";
import { readFileSync } from "node:fs";
import blocks from "./blocks.js";
import { getTeamOf } from "./helper.js";

let grubwars = JSON.parse(readFileSync(dataFilePath, "utf8"));
delete grubwars.debug; // it will be added back in saveState

app.command("/grubwars-join", async (interaction) => {
	await interaction.ack();
	
	// ensure they're not already in a team
	let currentTeam = getTeamOf(interaction.body.user_id, true);
	if (currentTeam) {
		await interaction.respond({
			"response_type": "ephemeral",
			"text": `You have already joined Team ${currentTeam}!`,
		});
		return;
	}
	
	// allow them to join
	await interaction.respond({
		"response_type": "ephemeral",
		"blocks": blocks.joinTeam,
		"delete_original": true,
	});
});

app.action(/^join-(hackgrub|snackclub)$/, async (interaction) => {
	await interaction.ack();
	
	let { id, username } = interaction.body.user;
	let team = interaction.action.action_id.split("-")[1];
	
	// confirm they're not already in a team
	if (getTeamOf(id)) return await interaction.respond({
		"response_type": "ephemeral",
		"text": "You already joined a team!",
	});
	
	// register player
	grubwars.teams[team].push(id);
	grubwars.players[id] = {
		"preferredName": username,
		"score": 0,
		"inventory": {},
		"effects": {},
	};
	saveState(grubwars);
	
	team = ((team === "hackgrub") ? "Hack Grub" : "Snack Club");
	await interaction.respond({
		"response_type": "ephemeral",
		"text": `Welcome, ${username}! You have joined Team ${team}!`,
	});
});
