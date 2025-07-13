import { easyHelpNames, items } from "./grubwars-data.js";

const blocks = {};

blocks.joinTeam = JSON.stringify([
	{
		"type": "section",
		"text": {
			"type": "mrkdwn",
			"text": "Welcome to GrubWars! Please join a team :]"
		}
	},
	{
		"type": "divider"
	},
	{
		"type": "actions",
		"elements": [
			{
				"type": "button",
				"text": {
					"type": "plain_text",
					"text": ":burger-grub: Team Hack Grub ({hg-count})",
					"emoji": true
				},
				"value": "hackgrub",
				"action_id": "join-hackgrub"
			},
			{
				"type": "button",
				"text": {
					"type": "plain_text",
					"text": ":snack: Team Snack Club ({sc-count})",
					"emoji": true
				},
				"value": "snackclub",
				"action_id": "join-snackclub"
			}
		]
	},
]);

blocks.stats = JSON.stringify([
	{
		"type": "header",
		"text": {
			"type": "plain_text",
			"text": "{user}'s stats",
			"emoji": true
		}
	},
	{
		"type": "section",
		"fields": [
			{
				"type": "mrkdwn",
				"text": "*Inventory*\n{inventory}"
			},
			{
				"type": "mrkdwn",
				"text": "*Team*\n{team}"
			},
			{
				"type": "mrkdwn",
				"text": "*Score*\n{score}"
			},
			{
				"type": "mrkdwn",
				"text": "*Effects*\n{effects}"
			}
		]
	}
]);

const helpOptions = Object.entries(easyHelpNames).map(([key, easyName]) => {
	return {
		"text": {
			"type": "plain_text",
			"text": easyName,
			"emoji": true,
		},
		"value": key,
	};
});

blocks.help = JSON.stringify([
	{
		"type": "header",
		"text": {
			"type": "plain_text",
			"text": "GrubWars Help",
			"emoji": true
		}
	},
	{
		"type": "section",
		"text": {
			"type": "plain_text",
			"text": "It can get confusing! We're here to help. Select any topic and learn more about it!",
			"emoji": true
		}
	},
	{
		"type": "section",
		"text": {
			"type": "mrkdwn",
			"text": "Pick an item from the dropdown list"
		},
		"accessory": {
			"type": "static_select",
			"placeholder": {
				"type": "plain_text",
				"text": "Select an item",
				"emoji": true
			},
			"options": helpOptions,
			"action_id": "help-selected"
		}
	},
	{
		"type": "section",
		"text": {
			"type": "mrkdwn",
			"text": "{help-data}"
		}
	}
]);

function getBlock (blockName, data) {
	let block = blocks[blockName];
	if (!block) return {};
	if (!data) data = {};
	
	return JSON.parse(block, (_, value) => {
		if (typeof value === "string") {
			return value.replace(/{(.+?)}/g, (_, k) => (
				(typeof data[k] === "undefined") ? `{${k}}` : data[k]
			));
		}
		else return value;
	});
}

export default getBlock;