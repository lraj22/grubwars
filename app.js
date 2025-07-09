import app from "./client.js";

app.command("/hi", async (interaction) => {
	await interaction.ack();
	await interaction.say(`Hi <@${interaction.body.user_id}> (<@${interaction.context.userId}>)!`);
});
