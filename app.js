import app from "./client.js";
import {
	log,
	logInteraction,
	saveState,
	userRef,
} from "./datahandler.js";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import getBlock from "./blocks.js";
import { getTeamOf, getUserAt } from "./helper.js";

const dataFilePath = join(import.meta.dirname, "data/grubwars.json");
let grubwars = JSON.parse(readFileSync(dataFilePath, "utf8"));
delete grubwars.debug; // it will be added back in saveState

app.command("/grubwars-join", async (interaction) => {
	await interaction.ack();
	await logInteraction(interaction);
	
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
		"blocks": getBlock("joinTeam"),
		"delete_original": true,
	});
});

app.command("/grubwars-stats", async (interaction) => {
	// acknowledge & log
	await interaction.ack();
	await logInteraction(interaction);
	let intRef = await userRef(interaction);
	
	// determine requested user
	let [targetId, targetName] = getUserAt(interaction.command.text);
	if (!targetId) {
		targetId = interaction.body.user_id;
		targetName = interaction.body.user_name;
	}
	
	// get user stats
	if (!(targetId in grubwars.players)) {
		log(`❌ ${intRef} tried to get stats for ${await userRef(targetId, targetName)} but they are not registered.`);
		return await interaction.respond({
			"response_type": "ephemeral",
			"text": `<@${targetId}> isn't registered for GrubWars Summer 2025!`,
		});
	}
	
	let data = {
		"user": grubwars.players[targetId].preferredName,
		"inventory": Object.keys(grubwars.players[targetId].inventory).length ? Object.keys(grubwars.players[targetId].inventory).join(", ") : "None",
		"team": getTeamOf(targetId, true) || "None",
		"score": grubwars.players[targetId].score || 0,
		"effects": Object.keys(grubwars.players[targetId].effects).length ? Object.keys(grubwars.players[targetId].effects).join(", ") : "None",
	};
	
	await interaction.respond({
		"response_type": "ephemeral",
		"blocks": getBlock("stats", data),
	});
});

app.action(/^join-(hackgrub|snackclub)$/, async (interaction) => {
	// acknowledge & log
	await interaction.ack();
	await logInteraction(interaction);
	let intRef = await userRef(interaction);
	
	let { id, username } = interaction.body.user;
	let team = interaction.action.action_id.split("-")[1];
	
	// confirm they're not already in a team
	let currentTeam = getTeamOf(id, true);
	if (currentTeam) {
		log(`❌ ${intRef} tried to join ${team} but is already in ${currentTeam}.`);
		return await interaction.respond({
			"response_type": "ephemeral",
			"text": `You already joined Team ${currentTeam}!`,
		});
	}
	
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
	log(`✅ ${intRef} successfully joined ${team}!`);
	await interaction.respond({
		"response_type": "ephemeral",
		"text": `Welcome, ${username}! You have joined Team ${team}!`,
	});
});
