import bolt from "@slack/bolt";
import { log } from "./datahandler.js";
const { App } = bolt;

const startTime = Date.now();

const app = new App({
	"token": process.env.SLACK_BOT_TOKEN,
	"signingSecret": process.env.SLACK_SIGNING_SECRET,
});

await app.start(process.env.PORT || 3000);
log(`✅ Slack bot ready in ${Date.now() - startTime}ms.`);

export default app;
