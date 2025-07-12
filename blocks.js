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