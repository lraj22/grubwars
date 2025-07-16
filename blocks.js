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

blocks.useThrow = JSON.stringify([
	{
		"type": "section",
		"text": {
			"type": "mrkdwn",
			"text": "Time to plan something! Use/throw items in your inventory. Using/throwing more than one item at a time is equivalent to repeating the action multiple times unless otherwise specified."
		}
	},
	{
		"type": "divider"
	},
	{
		"type": "section",
		"text": {
			"type": "mrkdwn",
			"text": "*Use or throw?*"
		},
		"accessory": {
			"type": "static_select",
			"placeholder": {
				"type": "plain_text",
				"text": "Required",
				"emoji": true
			},
			"options": [
				{
					"text": {
						"type": "plain_text",
						"text": "Use!",
						"emoji": true
					},
					"value": "use"
				},
				{
					"text": {
						"type": "plain_text",
						"text": "Throw!",
						"emoji": true
					},
					"value": "throw"
				}
			],
			"initial_option": {
				"text": {
					"type": "plain_text",
					"text": "{methodUpper}!",
					"emoji": true
				},
				"value": "{method}"
			},
			"action_id": "ut-select-method"
		}
	},
	{
		"type": "section",
		"text": {
			"type": "mrkdwn",
			"text": "*Which item?*"
		},
		"accessory": {
			"type": "static_select",
			"placeholder": {
				"type": "plain_text",
				"text": "Select an item (required)",
				"emoji": true
			},
			"options": "r:inventory",
			"action_id": "ut-select-item"
		}
	},
	{
		"type": "input",
		"element": {
			"type": "plain_text_input",
			"placeholder": {
				"type": "plain_text",
				"text": "Default: one (1)",
				"emoji": true
			},
			"action_id": "ut-select-quantity"
		},
		"label": {
			"type": "plain_text",
			"text": "How many?",
			"emoji": true
		}
	},
	{
		"type": "divider"
	},
	{
		"type": "section",
		"text": {
			"type": "mrkdwn",
			"text": "*Select your target* (only for throws)"
		},
		"accessory": {
			"type": "users_select",
			"placeholder": {
				"type": "plain_text",
				"text": "Default: yourself",
				"emoji": true
			},
			"action_id": "ut-select-target"
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
					"text": ":x: Cancel",
					"emoji": true
				},
				"value": "cancel",
				"action_id": "cancel-ut"
			},
			{
				"type": "button",
				"text": {
					"type": "plain_text",
					"text": ":white_check_mark: Go!",
					"emoji": true
				},
				"value": "confirm",
				"action_id": "confirm-ut"
			}
		]
	}
]);

blocks.closableText = JSON.stringify([
	{
		"type": "section",
		"text": {
			"type": "mrkdwn",
			"text": "{text}"
		}
	},
	{
		"type": "actions",
		"elements": [
			{
				"type": "button",
				"text": {
					"type": "plain_text",
					"text": "Close message",
					"emoji": true
				},
				"value": "close",
				"action_id": "close-self"
			}
		]
	}
]);

function getBlock (blockName, data) {
	let block = blocks[blockName];
	if (!block) return {};
	if (!data) data = {};
	
	return JSON.parse(block, (_, value) => {
		if (typeof value === "string") {
			if (value.startsWith("r:")) {
				let k = value.slice(2);
				value = ((k in data) ? data[k] : value);
				if (typeof value !== "string") return value;
			}
			return value.replace(/{(.+?)}/g, (_, k) => (
				(typeof data[k] === "undefined") ? `{${k}}` : data[k]
			));
		}
		else return value;
	});
}

export default getBlock;