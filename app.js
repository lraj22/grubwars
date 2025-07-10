import app from "./client.js";
import {
	dataFilePath,
	saveState,
} from "./datahandler.js";
import { readFileSync } from "node:fs";

let grubwars = JSON.parse(readFileSync(dataFilePath, "utf8"));
delete grubwars.debug; // it will be added back in saveState

app.command("/grubwars-join", async (interaction) => {
	await interaction.ack();
	await interaction.say(`Hi <@${interaction.body.user_id}>! This functionality hasn't been implemented yet. 😔`);
	grubwars.mostRecentInteraction = interaction.body.user_name;
	console.log(grubwars);
	saveState(grubwars);
});
