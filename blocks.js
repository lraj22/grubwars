const blocks = {};

blocks.joinTeam = [
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
					"text": ":burger-grub: Team Hack Grub",
					"emoji": true
				},
				"value": "hackgrub",
				"action_id": "join-hackgrub"
			},
			{
				"type": "button",
				"text": {
					"type": "plain_text",
					"text": ":snack: Team Snack Club",
					"emoji": true
				},
				"value": "snackclub",
				"action_id": "join-snackclub"
			}
		]
	},
];

export default blocks;