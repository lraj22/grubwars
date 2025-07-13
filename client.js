import bolt from "@slack/bolt";
import { log } from "./datahandler.js";
const { App } = bolt;

const startTime = Date.now();

const app = new App({
	"token": process.env.GRUBWARS_BOT_TOKEN,
	"signingSecret": process.env.GRUBWARS_SIGNING_SECRET,
	"socketMode": process.env.GRUBWARS_SOCKET_MODE === "true", // only true in development
	"appToken": process.env.GRUBWARS_APP_TOKEN,
	"endpoints": {
		"events": "/slack/grubwars/events",
	},
});

await app.start(process.env.GRUBWARS_PORT || 5040);
log(`⚡ Slack bot ready in ${Date.now() - startTime}ms.`);

export default app;
