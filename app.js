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
import { helpGuides, items } from "./grubwars-data.js";

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
	
	function memberCount (team) {
		let count = grubwars.teams[team].length;
		return (count === 1) ? "1 member" : `${count} members`;
	}
	
	// allow them to join
	await interaction.respond({
		"response_type": "ephemeral",
		"blocks": getBlock("joinTeam", {
			"hg-count": memberCount("hackgrub"),
			"sc-count": memberCount("snackclub"),
		}),
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

app.command("/grubwars-dev", async (interaction) => {
	// acknowledge & log
	await interaction.ack();
	await logInteraction(interaction);
	let intRef = await userRef(interaction);
	
	// only devs can use this command (Lakshya & Lavith Raj)
	if (!(["U08QZ5TQFMF", "U0947SL6AKB"].includes(interaction.body.user_id))) {
		log(`❌ ${intRef} tried to use /grubwars-dev, lol!`);
		await interaction.respond({
			"response_type": "ephemeral",
			"text": "You are not allowed to use this command, lol.",
		});
		return;
	}
	
	let [targetId] = getUserAt(interaction.command.text);
	if (!targetId) {
		targetId = interaction.body.user_id;
	}
	grubwars.teams.hackgrub = grubwars.teams.hackgrub.filter(id => id !== targetId);
	grubwars.teams.snackclub = grubwars.teams.snackclub.filter(id => id !== targetId);
	if (interaction.command.text.includes("!")) delete grubwars.players[targetId];
	saveState(grubwars);
});

app.command("/grubwars-help", async (interaction) => {
	// acknowledge & log
	await interaction.ack();
	await logInteraction(interaction);
	
	let helpBlock = getBlock("help", {
		"help-data": helpGuides.general, // no help data until they select an option
	});
	
	await interaction.respond({
		"response_type": "ephemeral",
		"blocks": helpBlock,
		"replace_original": true,
	});
});

app.action("help-selected", async (interaction) => {
	// acknowledge & log
	await interaction.ack();
	// await logInteraction(interaction); // no need, we log it in more detail
	let intRef = await userRef(interaction);
	
	let helpItem = interaction.action.selected_option.value;
	log(`${intRef} selected help item: ${helpItem}`);
	let helpBlock = getBlock("help", {
		"help-data": helpGuides[helpItem] || "No help data available for this item. This is a bug, please report it to <@U08QZ5TQFMF>!",
	});
	
	// only add image if exists (for example "General" has no image)
	if ((helpItem in items) && items[helpItem].image) {
		helpBlock.push({
			"type": "image",
			"title": {
				"type": "plain_text",
				"text": items[helpItem].name,
				"emoji": true
			},
			"image_url": items[helpItem].image,
			"alt_text": items[helpItem].name,
		});
	}
	
	await interaction.respond({
		"response_type": "ephemeral",
		"blocks": helpBlock,
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
		"lunchMoney": 0,
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
