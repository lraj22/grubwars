import app from "./client.js";
import {
	getGrubwars,
	log,
	logInteraction,
	saveState,
	userRef,
} from "./datahandler.js";
import getBlock from "./blocks.js";
import { count, effectsToText, getTeamOf, getUserAt } from "./helper.js";
import {
	grubwarsEventChannelId,
	helpGuides,
	items,
	pickRandomWeighted,
	randRange,
	weightings
} from "./grubwars-data.js";
import { throwItem, useItem } from "./grubwars.js";

app.command("/grubwars-join", async (interaction) => {
	await interaction.ack();
	await logInteraction(interaction);
	let grubwars = getGrubwars();
	
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
		"blocks": getBlock("joinTeam", {
			"hg-count": count(grubwars.teams["hackgrub"].length, "member"),
			"sc-count": count(grubwars.teams["snackclub"].length, "member"),
		}),
		"delete_original": true,
	});
});

function isSameUtcDay (time1, time2) {
	time1 = new Date(time1);
	time2 = new Date(time2);
	return ((time1.getUTCFullYear() === time2.getUTCFullYear()) && (time1.getUTCMonth() === time2.getUTCMonth()) && (time1.getUTCDate() === time2.getUTCDate()));
}

function commaListify (list) {
	let lastIndex = list.length - 1;
	if (list.length > 1) list[lastIndex] = "and " + list[lastIndex];
	return ((list.length > 2) ? list.join(", ") : list.join(" "));
}

function timeDiffToString (time1, time2) {
	let diff = Math.round(Math.abs(new Date(time1) - new Date(time2)) / 1000);
	let hours = 0, minutes = 0, seconds = 0;
	if (diff >= 3600) {
		hours = Math.floor(diff / 3600);
		diff %= 3600;
	}
	if (diff >= 60) {
		minutes = Math.floor(diff / 60);
		diff %= 60;
	}
	seconds = diff;
	
	let parts = [];
	if (hours) parts.push(`${hours} hour${(hours > 1) ? "s" : ""}`);
	if (minutes) parts.push(`${minutes} minute${(minutes > 1) ? "s" : ""}`);
	if (seconds) parts.push(`${seconds} second${(seconds > 1) ? "s" : ""}`);
	return commaListify(parts);
}

app.command("/grubwars-claim", async (interaction) => {
	// acknowledge & log
	await interaction.ack();
	await logInteraction(interaction);
	let grubwars = getGrubwars();
	let intRef = await userRef(interaction);
	let playerId = interaction.body.user_id;
	
	// ensure they are registered
	let currentTeam = getTeamOf(playerId);
	if (!currentTeam) {
		log(`❌ ${intRef} tried to claim items but is not registered.`);
		await interaction.respond({
			"response_type": "ephemeral",
			"text": "You are not registered for GrubWars Summer 2025! Please join a team first using `/grubwars-join`.",
		});
		return;
	}
	
	// ensure that they CAN claim right now
	let lastClaimed = new Date(grubwars.players[playerId].lastClaimed);
	let lastClaimedGWC = new Date(grubwars.players[playerId].lastClaimedGWC);
	let now = new Date();
	let minBoost = 0;
	if(process.env.GRUBWARS_IGNORE_LASTCLAIMED_LIMITATIONS === "true");else
	if (interaction.body.channel_id === grubwarsEventChannelId) {
		if (isSameUtcDay(lastClaimedGWC, now)) { // can't claim on same utc day
			log(`❌ ${intRef} tried to claim items in GWC but it's the same day. lcgwc: ${lastClaimedGWC.toISOString()}, now: ${now.toISOString()}.`);
			let nextClaimTime = new Date(now);
			nextClaimTime.setUTCDate(nextClaimTime.getUTCDate() + 1); // next day
			nextClaimTime.setUTCHours(0, 0, 0, 0);
			await interaction.respond({
				"response_type": "ephemeral",
				"text": `It's the same UTC day, please wait for ${timeDiffToString(nextClaimTime, now)}`,
			});
			return;
		}
		grubwars.players[playerId].lastClaimedGWC = +now;
		minBoost = 1;
	} else {
		if ((now - lastClaimed) < 5 * 60e6) { // must wait 5 hours
			log(`❌ ${intRef} tried to claim items but it's too soon. lc: ${lastClaimed.toISOString()}, now: ${now.toISOString()}.`);
			let nextClaimTime = new Date(now);
			nextClaimTime.setHours(nextClaimTime.getHours() + 5);
			await interaction.respond({
				"response_type": "ephemeral",
				"text": `You can only claim items once every 5 hours. Please wait for ${timeDiffToString(nextClaimTime, now)}`,
			});
			return;
		}
		grubwars.players[playerId].lastClaimed = +now;
	}
	
	let numberOfItems = randRange(2 + minBoost, 6);
	let prizes = new Array(numberOfItems).fill(null).map(_ => pickRandomWeighted(weightings.normalPrizes)); // collect ${numberOfItems} random prizes
	let gain = {}; // describes exactly what player gained (i.e. combines 1 apple & 1 apple into 2 apples)
	prizes.forEach(prize => {
		// calculate how much of it to earn
		let amount = 1;
		if ("multiplier" in items[prize]) amount = items[prize].multiplier();
		
		// add it to inventory
		if (!(prize in grubwars.players[playerId].inventory)) grubwars.players[playerId].inventory[prize] = 0;
		grubwars.players[playerId].inventory[prize] += amount;
		
		// add it to gains
		if (!(prize in gain)) gain[prize] = 0;
		gain[prize] += amount;
	});
	
	// you earned 2 apples, 1 trash grabber, 1 milk carton, and 1 peach
	let gainedItemsList = commaListify(Object.entries(gain).map(([itemName, quantity]) => count(quantity, items[itemName].name.toLowerCase())));
	
	// total of 57 items
	let totalItemsCount = Object.values(grubwars.players[playerId].inventory).reduce((acc, cur) => acc + cur, 0);
	
	saveState(grubwars);
	
	await interaction.respond({
		"response_type": "in_channel",
		"text": `Lunch has been served! <@${playerId}> just got ${gainedItemsList}. You have ${count(totalItemsCount, "item")} in your inventory now.`,
	});
});

app.command(/^\/grubwars-(use|throw)$/, async (interaction) => {
	// acknowledge & log
	await interaction.ack();
	await logInteraction(interaction);
	let grubwars = getGrubwars();
	let intRef = await userRef(interaction);
	let playerId = interaction.body.user_id;
	let method = interaction.command.command.split("-")[1];
	
	// ensure they are registered
	let currentTeam = getTeamOf(playerId);
	if (!currentTeam) {
		log(`❌ ${intRef} tried to claim items but is not registered.`);
		await interaction.respond({
			"response_type": "ephemeral",
			"text": "You are not registered for GrubWars Summer 2025! Please join a team first using `/grubwars-join`.",
		});
		return;
	}
	
	let inventory = Object.entries(grubwars.players[playerId].inventory)
		.filter(([_, quantity]) =>  quantity > 0)
		.map(([itemName, quantity]) => {
			return {
				"text": {
					"type": "plain_text",
					"text": items[itemName].name + ` (${quantity})`,
					"emoji": false,
				},
				"value": itemName,
			};
		});
	
	await interaction.respond({
		"response_type": "ephemeral",
		"blocks": getBlock("useThrow", {
			"method": method,
			"methodUpper": method[0].toUpperCase() + method.slice(1),
			"inventory": inventory,
		}),
		"delete_original": true,
	});
});

app.command("/grubwars-stats", async (interaction) => {
	// acknowledge & log
	await interaction.ack();
	await logInteraction(interaction);
	let intRef = await userRef(interaction);
	let grubwars = getGrubwars();
	
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
	
	let targetPlayer = grubwars.players[targetId];
	
	let data = {
		"user": targetPlayer.preferredName,
		"inventory": (Object.keys(targetPlayer.inventory).length ? commaListify(Object.entries(targetPlayer.inventory).map(([itemName, quantity]) => count(quantity, items[itemName].name.toLowerCase()))) : "None"),
		"team": getTeamOf(targetId, true) || "None",
		"score": targetPlayer.score || 0,
		"effects": targetPlayer.effects.length ? (effectsToText(targetPlayer.effects) || "None") : "None",
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
	let grubwars = getGrubwars();
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

function getValues (interaction) {
	// slack block kit will be the end of me
	// this code will NOT be explained because it is complicated, though not unnecessarily complicated
	// just complicated enough to accomodate slack block kit
	
	return Object.fromEntries(Object.values(interaction.body.state.values).map(inputInfo => {
		let [key, input] = Object.entries(inputInfo)[0];
		key = key.split("-");
		key = key[key.length - 1];
		let inputValue = ("selected_option" in input) ? input.selected_option?.value : (input.value || input.selected_user);
		return [key, inputValue];
	}))
}

app.action("confirm-ut", async (interaction) => {
	// acknowledge & log
	await interaction.ack();
	// await logInteraction(interaction); // no need, we log it in more detail
	let grubwars = getGrubwars();
	let intRef = await userRef(interaction);
	let playerId = interaction.body.user.id;
	let player = grubwars.players[playerId];
	let response = `<@${playerId}> `;
	
	async function ephMessage (message) {
		return await interaction.client.chat.postEphemeral({
			"channel": interaction.body.channel.id,
			"user": playerId,
			"text": response,
			"blocks": getBlock("closableText", {
				"text": message,
			}),
		});
	}
	
	let { method, item, quantity, target: targetId } = getValues(interaction);
	
	// make sure quantity is valid
	quantity = ((typeof quantity === "string") ? quantity : "1");
	quantity = parseInt(quantity);
	if (isNaN(quantity)) {
		return await ephMessage("The quantity must be an integer (1, 2, ..., max) or blank (1).");
	}
	
	// make sure item is valid
	if (typeof item !== "string") {
		return await ephMessage("Please select an item.");
	}
	
	let availableQuantity = player.inventory[item] || 0;
	let easyName = items[item].name;
	
	if (availableQuantity < quantity) {
		return await ephMessage(`You don't have ${count(quantity, easyName)}, only ${availableQuantity}.`);
	}
	
	// TODO: make sure item can be used/thrown!
	
	if ((method === "throw") && (!targetId)) {
		return await ephMessage(`You must specify a target when you throw an item.`);
	}
	
	// time to process the item!
	let isSuccess = true;
	
	if ((method === "use") && (targetId)) response += "By the way, the target you selected has been ignored since you are *using* this item instead of *throwing* it.\n";
	
	let actionResponse = "";
	if (method === "use") [isSuccess, actionResponse] = await useItem({ playerId, item, quantity });
	if (method === "throw") [isSuccess, actionResponse] = await throwItem({ playerId, item, quantity, targetId });
	response += actionResponse;
	
	// remove interface if successful
	if (isSuccess) {
		// remove original interface, operation success
		await interaction.respond({ "delete_original": true });
		// post message
		return await interaction.client.chat.postMessage({
			"channel": interaction.body.channel.id,
			"text": response,
		});
	} else {
		// don't delete original, just post a closable ephemeral message
		return await ephMessage(response);
	}
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
	let grubwars = getGrubwars();
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
		"effects": [],
		"lastClaimed": 0,
		"lastClaimedGWC": 0,
	};
	saveState(grubwars);
	
	team = ((team === "hackgrub") ? "Hack Grub" : "Snack Club");
	log(`✅ ${intRef} successfully joined ${team}!`);
	await interaction.respond({
		"response_type": "ephemeral",
		"text": `Welcome, ${username}! You have joined Team ${team}!`,
	});
});

// they selected something in the use/throw interface - no relevance to us until cancel/confirm
app.action(/^ut-.+$/, async (interaction) => {
	await interaction.ack();
});

// a closable text prompt has requested to close itself. so be it!
async function closeSelf (interaction) {
	await interaction.ack();
	await interaction.respond({
		"delete_original": true,
	});
}
app.action("close-self", closeSelf);
app.action("cancel-ut", closeSelf);
