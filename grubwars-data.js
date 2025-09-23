const grubwarsEventChannelId = "C095GK7G5FG";

// items details
const items = {
	// rarity: basic
	"lowFatMilk": {
		"name": "Low Fat Milk",
		"rarity": "basic",
		"use": "+5 points",
		"throw": "-5 points",
		"image": "https://producersdairy.com/wp-content/uploads/2018/10/LowFatMilk.jpg",
	},
	"apple": {
		"name": "Apple",
		"rarity": "basic",
		"use": "+8 points",
		"throw": "-8 points",
		"image": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/Red_Apple.jpg/800px-Red_Apple.jpg",
	},
	"chocolateMilk": {
		"name": "Chocolate Milk",
		"rarity": "basic",
		"use": "+12 points",
		"throw": "-12 points",
		"image": "https://driftwooddairy.com/__static/0c3f5d72ea73b28165da4ce860a375da/chocnon.jpg",
	},
	"grilledCheeseSandwich": {
		"name": "Grilled Cheese Sandwich",
		"rarity": "basic",
		"use": "+15 points",
		"throw": "-15 points",
		"image": "https://theschooldaze.com/cdn/shop/files/Grilled-Cheese-wrap__80495.jpg",
	},
	"grape": {
		"name": "Grape",
		"rarity": "basic",
		"use": "needs 20+ grapes to make wine; more grapes = more potent wine",
		"throw": "-2 points",
		"image": "https://static.wikia.nocookie.net/fruit/images/a/a1/Download_%286%29.jpg/revision/latest",
		"multiplier": randRangeFn(3, 8),
	},
	
	// rarity: uncommon
	"peach": {
		"name": "Peach",
		"rarity": "uncommon",
		"use": "+15 points",
		"throw": "-10 points; 15% chance of becoming a giant peach (+3 peaches & double damage)",
		"image": "https://static.libertyprim.com/files/familles/peche-large.jpg",
	},
	"pizzaSlice": {
		"name": "Pizza Slice",
		"rarity": "uncommon",
		"use": "full team +4 points",
		"throw": "target's whole team -3 points",
		"image": "https://3.files.edl.io/7f1e/21/12/06/150624-3b518680-b7eb-46a2-898c-b83fcaef7ca8.jpg",
	},
	"spork": {
		"name": "Spork",
		"rarity": "uncommon",
		"use": "+5% throw accuracy for 1 hour",
		"throw": "target has -10% throw accuracy for 2 hours",
		"image": "https://arc-anglerfish-washpost-prod-washpost.s3.amazonaws.com/public/JLSJNYUS6YI6LIWW6V4QQWALD4",
	},
	
	// rarity: rare
	"lemonDrizzleCake": {
		"name": "Lemon Drizzle Cake",
		"rarity": "rare",
		"use": "+20% points for next hour",
		"throw": "target has -20% points for next 12 hours",
		"image": "https://www.serendipitycakecompany.co.uk/wp-content/uploads/2020/04/Lemon-Drizzle-Cake.jpeg",
	},
	"trashGrabber": {
		"name": "Trash Grabber",
		"rarity": "rare",
		"use": "+50 points",
		"throw": "take 1 item of choice from target",
		"image": "https://m.media-amazon.com/images/I/51VavEMsIhL._SX522_.jpg",
	},
	"pizzaBox": {
		"name": "Pizza Box",
		"rarity": "rare",
		"use": "needs 4 pizza slices; +75 points",
		"throw": "-20 points & target loses random(2–4) pizza slices", // en dash
		"image": "https://i.redd.it/fr9rcq5irlj81.jpg",
	},
	
	// rarity: epic
	"wine": {
		"name": "Wine",
		"rarity": "epic",
		"use": "points multiplier based on number of grapes: 20 grapes = 1.4x, 25 grapes = 1.5x, 30 grapes = 1.6x, etc.\nAlso, your throw success rate drops to random(50–70)%", // en dash
		"throw": "target's attacks are 10% less effective, and their throw success rate also drops to random(50–70)%", // en dash
		"properties": ["confiscatable"],
		"image": "https://img.freepik.com/premium-vector/bottle-spirit-drink-stemware-no-alcohol-allowed-sign-no-drinking-sign-prohibiting-alcohol-beverages-ban-wine-drink-prohibition-sign-icon-illustration-no-binge-icon-stop-alcohol_91248-1073.jpg",
	},
	"bullyingPower": {
		"name": "Bullying Power",
		"rarity": "epic",
		"use": null,
		"throw": "if 3 people use this towards one target, that target's full inventory and lunch money is stolen and distributed to bullies",
		"image": "https://news.jrn.msu.edu/bullying/wp-content/uploads/2012/01/site-Bullying-cafeteria-%C2%A9-Christopher-Futcher1.jpg",
	},
};

// BEFORE WE GO ANY FURTHER: fill empty fields
for (let key of Object.keys(items)) {
	if (!("properties" in items[key])) items[key].properties = [];
	if (!items[key].image) items[key].image = "https://upload.wikimedia.org/wikipedia/commons/1/14/No_Image_Available.jpg";
}

/*
 * still need shop items
 * citation
 * curse of starvation
 * boon of immunity
 * curse of isolation
 * boon of giving
 * curse of confiscation
 */

// these are displayed in /grubwars-help
const helpGuides = {
	// general help guide
	"general":
`General help: GrubWars is a game where you can join one of two teams, :burger-grub: Hack Grub or :snack: Snack Club, and compete against each other by collecting items, scoring points, and using various effects to gain an advantage over the other team. :ultrafastparrot:

You can join a team with \`/grubwars-join\`	(all commands are prefixed with \`/grubwars-\`). Collect items with \`/grubwars-claim\`. You can claim prizes once every five hours (this may change), except for in <#C095GK7G5FG|grubwars-event>, where you can claim once per UTC day.

Running \`/grubwars-use\` enables you to use (or throw!) an item from your inventory. Using items usually gives you or your team some benefit, while throwing items at someone usually gives them a negative effect (you _can_ throw stuff at yourself or your teammates - be careful!).

:money_with_wings: There is also a shop where you can buy items with your lunch money, which you earn every day you play GrubWars. You can view the shop with \`/grubwars-shop\`. Here, you can buy spells and other useful (and sometimes unobtainable!) items.

:kirby-run: Quick commands: \`/grubwars-help\` for help, \`/grubwars-stats\` to view a player's stats & inventory, \`/grubwars-leaderboard\` to view the game leaderboard, \`/grubwars-give\` to transfer some of your inventory to someone else.

*Select another item from the dropdown to see more help items!*`,
	
	// claiming items help guide
	"claiming":
`You can run \`/grubwars-claim\` which will give you a random selection of items. You might get anywhere from a few to a lot. They are more likely to be basic than epic.

You can only run the command once per five hours, with <#C095GK7G5FG|grubwars-event> being an exception where you can claim once per UTC day, and it doesn't count in the five hour cooldown.

The more you claim prizes, the more you will have, and the more you can use/throw to win!`,
	
	// using and throwing items help guide
	"useThrow":
`In this game, you can either USE an item, or THROW it. Most items have both a use and a throw effect, but some only have one or the other. Using an item usually gives you or your team some benefit, while throwing an item at someone usually gives the target a negative effect.

To use or throw an item, run \`/grubwars-use\` and select the item you want to use/throw. If you have multiple of the same item, you can select how many you want to use/throw. Using an item has no target, it's just yourself using it. If you throw an item, you must select a target, which can be yourself, a teammate, or an opponent. The target will receive the negative effect of the item.

Using an item has a 100% success rate, while throwing has a 90% success rate. Some items affect the success rates of throws, so make sure you are aware of how likely you are to succeed!

You can throw items at ANYONE, including yourself and your teammates. Be careful!`,
};

const easyHelpNames = {
	"general": "General help (default)",
	"claiming": "Claiming items",
	"useThrow": "Using and throwing items",
};

// add all items to the help guides
Object.entries(items).forEach(([key, item]) => {
	// create help info	
	let propertiesInfo = "";
	if (item.properties.length) {
		propertiesInfo = "*Properties*\n" + item.properties.map(prop => {
			return "- " + ({
				"confiscatable": "Can be confiscated by Curse of Confiscation"
			}[prop] || `Unknown property: ${prop}`);
		}).join("\n");
	}
	
	let text = `*${item.name}* (${item.rarity})\n\n`
		+ (item.use ? ("*When used*: " + item.use) : "*Cannot be used*") + "\n\n"
		+ (item.throw ? ("*When thrown*: " + item.throw) : "*Cannot be thrown*") + "\n\n"
		+ (propertiesInfo);
	
	// add help info to guides & easy names
	helpGuides[key] = text;
	easyHelpNames[key] = "Item: " + item.name;
});

function randRange (min, max) {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randRangeFn (min, max) {
	return function () {
		return randRange(min, max);
	};
}

const normalPrizes = {
	// rarity: basic
	"lowFatMilk": 18,
	"apple": 17,
	"chocolateMilk": 16,
	"grilledCheeseSandwich": 15,
	"grape": 14,
	
	// rarity: uncommon
	"peach": 13,
	"pizzaSlice": 11,
	"spork": 12,
	
	// rarity: rare
	"lemonDrizzleCake": 8,
	"trashGrabber": 8,
	"pizzaBox": 6,
	
	// rarity: epic
	"wine": 0, // can only be bought
	"bullyingPower": 4,
};

const weightings = {
	normalPrizes,
};

function pickRandomWeighted (weights) {
	let total = Object.values(weights).reduce(function (accumulator, current) {
		return accumulator + current;
	});
	let keys = Object.keys(weights);
	let random = Math.random();
	let pickCeiling = 0;
	for (let i = 0; i < keys.length; i++) {
		pickCeiling += (weights[keys[i]] / total);
		if (random < pickCeiling) return keys[i];
	}
}
function weightsToPercents (weights) { // developer visualization purposes, not actually used
	let percents = {};
	let cleanOutput = [];
	let total = Object.values(weights).reduce(function (accumulator, current) {
		return accumulator + current;
	});
	let keys = Object.keys(weights);
	for (let i = 0; i < keys.length; i++) {
		percents[keys[i]] = ("" + ((weights[keys[i]] / total) * 100).toFixed(3) + "%");
		let itemName = items[keys[i]].name;
		cleanOutput.push(itemName + new Array(3 - Math.floor(itemName.length / 8)).fill("\t").join("") + ((weights[keys[i]] / total) * 100).toFixed(3).padStart(6, "0") + "%");
	}
	return [percents, cleanOutput.join("\n")];
}

const wineDisasterReasons = [
	"the wine blurs your vision and you miss.",
	"as you throw the item intoxicated, it disappears. Huh? Whatever.",
	"as you get ready to throw, you realize that you had one too many bottles of wine.",
	"the item you just attempted to throw acted all intoxicated and refused to be thrown.",
].map(reason => "Don't do underage drinking... " + reason);

const disasterReasons = [
	"You slipped on a banana peel!",
	"The table you were standing on fell over. Hmm.",
	"Someone accidentally hit you thinking you were someone else!",
	"A strong breeze makes everything fall out of your hand.",
	"Your eyes were splattered with lemon meringue pie the instant you tried to throw. It... didn't go very well.",
	"A teacher appears in your peripheral and you instinctually run.",
];

export {
	items,
	helpGuides,
	easyHelpNames,
	grubwarsEventChannelId,
	pickRandomWeighted,
	weightings,
	randRange,
	wineDisasterReasons,
	disasterReasons,
};