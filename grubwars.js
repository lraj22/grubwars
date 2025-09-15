import { getGrubwars, saveState } from "./datahandler.js";
import { items, disasterReasons } from "./grubwars-data.js";
import { count, effectsToText, getTeamOf } from "./helper.js";

let grubwars = {};

function clamp (min, val, max) {
	min = ((typeof min === "number") ? min : -Infinity);
	max = ((typeof max === "number") ? max : +Infinity);
	return Math.max(min, Math.min(val, max));
}

function changeQuantity (playerId, itemName, quantity) {
	if (typeof grubwars.players[playerId].inventory[itemName] === "number") {
		grubwars.players[playerId].inventory[itemName] += quantity;
	} else {
		grubwars.players[playerId].inventory[itemName] = quantity;
	}
	grubwars.players[playerId].inventory[itemName] = clamp(0, grubwars.players[playerId].inventory[itemName], null);
}

function changeScore (playerId, quantity) {
	grubwars.players[playerId].score = clamp(null, grubwars.players[playerId].score + quantity, null);
}

function scoreDiff (playerId, oldScore) {
	return grubwars.players[playerId].score - oldScore;
}

async function useItem ({ playerId, item, quantity }) {
	grubwars = getGrubwars();
	let response = "";
	let oldScore = grubwars.players[playerId].score;
	let easyName = items[item].name;
	let isSuccess = true;
	
	let effectsThatDidSomething = [];
	if (effectsThatDidSomething.length) {
		response += `Just an FYI, your throw was affected by ${effectsToText(effectsThatDidSomething)}.\n`
	}
	
	switch (item) {
		// rarity: basic
		case "lowFatMilk":
			changeQuantity(playerId, item, -quantity);
			changeScore(playerId, 5 * quantity);
			response += `You used ${count(quantity, easyName)} and gained ${count(scoreDiff(playerId, oldScore), "point")}!`;
			break;
			
		case "apple":
			changeQuantity(playerId, item, -quantity);
			changeScore(playerId, 8 * quantity);
			response += `You used ${count(quantity, easyName)} and gained ${count(scoreDiff(playerId, oldScore), "point")}!`;
			break;
			
		case "chocolateMilk":
			changeQuantity(playerId, item, -quantity);
			changeScore(playerId, 12 * quantity);
			response += `You used ${count(quantity, easyName)} and gained ${count(scoreDiff(playerId, oldScore), "point")}!`;
			break;
			
		case "grilledCheeseSandwich":
			changeQuantity(playerId, item, -quantity);
			changeScore(playerId, 15 * quantity);
			response += `You used ${count(quantity, easyName)} and gained ${count(scoreDiff(playerId, oldScore), "point")}!`;
			break;
			
		case "grape":
			if (quantity < 20) {
				response += "Error: You must use _at least_ 20 grapes at once to make wine.";
				isSuccess = false;
				break;
			}
			response += "This item is not yet supported. :[";
			isSuccess = false;
			break;
			

		// rarity: uncommon
		case "peach":
			changeQuantity(playerId, item, -quantity);
			changeScore(playerId, 15 * quantity);
			response += `You used ${count(quantity, easyName)} and gained ${count(scoreDiff(playerId, oldScore), "point")}!`;
			break;
			
		case "pizzaSlice":
			changeQuantity(playerId, item, -quantity);
			let team = getTeamOf(playerId);
			grubwars.teams[team].forEach(memberId => changeScore(memberId, 4 * quantity));
			response += `WOAH! Every member on your team gained ${4 * quantity} points!`;
			break;
			
		case "spork":
			changeQuantity(playerId, item, -quantity);
			let expiresTime = Date.now () + 1 * 60 * 60e3; // now + 1 hour
			let effectsToAdd = new Array(quantity).fill({
				"name": "spork-used",
				"expires": expiresTime,
				"expiresReadable": new Date(expiresTime).toUTCString(),
			});
			grubwars.players[playerId].effects.push(...effectsToAdd);
			let sporkCount = grubwars.players[playerId].effects.reduce((acc, cur) => acc + (cur.name.startsWith("spork") ? 1 : 0), 0); // count number of spork effects
			response += `You are now under ${count(sporkCount, "spork effect")}.`;
			break;
			

		// rarity: rare
		case "lemonDrizzleCake":
			response += "This item is not yet supported. :[";
			isSuccess = false;
			break;
			
		case "trashGrabber":
			response += "This item is not yet supported. :[";
			isSuccess = false;
			break;
			
		case "pizzaBox":
			response += "This item is not yet supported. :[";
			isSuccess = false;
			break;
			

		// rarity: epic
		case "wine":
			response += "This item is not yet supported. :[";
			isSuccess = false;
			break;
			
		case "bullyingPower":
			response += "This item is not yet supported. :[";
			isSuccess = false;
			break;
			
		default:
			response += "Unknown item selected...";
			isSuccess = false;
	}
	
	saveState(grubwars);
	
	return [isSuccess, response];
}

async function throwItem ({ playerId, item, quantity, targetId }) {
	grubwars = getGrubwars();
	let player = grubwars.players[playerId];
	let target = grubwars.players[targetId];
	let oldScore = grubwars.players[playerId].score;
	let oldTargetScore = grubwars.players[targetId].score;
	let easyName = items[item].name;
	let response = "";
	let isSuccess = true;
	
	changeQuantity(playerId, item, -quantity);
	
	let chanceToSucceed = 0.90;
	let effectsThatDidSomething = [];
	
	player.effects.forEach(function (effect) {
		if (Date.now() > effect.expires) return; // if expired, ignore
		
		if (effect.name.startsWith("spork-used")) {
			chanceToSucceed *= 1.05; // self spork: 5% accuracy boost
			effectsThatDidSomething.push(effect);
		}
		if (effect.name.startsWith("spork-thrown")) {
			chanceToSucceed *= 0.90; // foreign spork: 10% accuracy nerf
			effectsThatDidSomething.push(effect);
		}
	});
	
	if (effectsThatDidSomething.length) {
		response += `Just an FYI, your throw was affected by ${effectsToText(effectsThatDidSomething)}.\n`
	}
	
	if (Math.random () >= chanceToSucceed) { // WHOOPS YOU JUST MISSED
		response += `Whoops! ${disasterReasons[Math.floor(Math.random() * disasterReasons.length)]} You just lost the ${count(quantity, easyName)} you were about to throw! Oh well.... :P`;
		saveState(grubwars);
		return [isSuccess, response];
	}
	
	switch (item) {
		// rarity: basic
		case "lowFatMilk":
			changeScore(targetId, -5 * quantity);
			response += `You threw ${count(quantity, easyName)} and ${target.preferredName} lost ${count(-scoreDiff(targetId, oldTargetScore), "point")}!`;
			break;
			
		case "apple":
			changeScore(targetId, -8 * quantity);
			response += `You threw ${count(quantity, easyName)} and ${target.preferredName} lost ${count(-scoreDiff(targetId, oldTargetScore), "point")}!`;
			break;
			
		case "chocolateMilk":
			changeScore(targetId, -12 * quantity);
			response += `You threw ${count(quantity, easyName)} and ${target.preferredName} lost ${count(-scoreDiff(targetId, oldTargetScore), "point")}!`;
			break;
			
		case "grilledCheeseSandwich":
			changeScore(targetId, -15 * quantity);
			response += `You threw ${count(quantity, easyName)} and ${target.preferredName} lost ${count(-scoreDiff(targetId, oldTargetScore), "point")}!`;
			break;
			
		case "grape":
			changeScore(targetId, -2 * quantity);
			response += `You threw ${count(quantity, easyName)} and ${target.preferredName} lost ${count(-scoreDiff(targetId, oldTargetScore), "point")}!`;
			break;
			
			
		// rarity: uncommon
		case "peach":
			let extraResponse = "";
			let giantPeachCount = new Array(quantity).fill(0).map(_ => +(Math.random() < 0.15)).reduce((acc, cur) => acc + cur, 0);
			if (giantPeachCount) {
				changeQuantity(playerId, item, 3 * giantPeachCount);
				if (giantPeachCount === 1) {
					extraResponse = ` Also, 1 of your peaches turned into a Giant Peach! You gained 3 peaches and did 10 extra damage!`;
				} else {
					extraResponse = ` Also, ${giantPeachCount} of your peaches turned into Giant Peaches! You gained ${3 * giantPeachCount} peaches and did ${10 * giantPeachCount} extra damage!`;
				}
			}
			changeScore(targetId, -10 * (quantity + giantPeachCount));
			response += `You threw ${count(quantity, easyName)} and ${target.preferredName} lost ${count(-scoreDiff(targetId, oldTargetScore), "point")}!` + extraResponse;
			break;
			
		case "pizzaSlice":
			let team = getTeamOf(targetId);
			grubwars.teams[team].forEach(memberId => changeScore(memberId, -3 * quantity));
			response += `YIKES! Every member on ${target.preferredName}'s team LOST ${3 * quantity} points!`;
			break;
			
		case "spork":
			let expiresTime = Date.now () + 2 * 60 * 60e3; // now + 1 hour
			let effectsToAdd = new Array(quantity).fill({
				"name": "spork-thrown",
				"expires": expiresTime,
				"expiresReadable": new Date(expiresTime).toUTCString(),
			});
			grubwars.players[targetId].effects.push(...effectsToAdd);
			let sporkCount = grubwars.players[targetId].effects.reduce((effect, cur) => cur + (effect.name.startsWith("spork") ? 1 : 0), 0); // count number of spork effects
			response += `${target.preferredName} is now under ${count(sporkCount, "spork effect")}.`;
			break;
			

		// rarity: rare
		case "lemonDrizzleCake":
			response += "This item is not yet supported. :[";
			isSuccess = false;
			break;
			
		case "trashGrabber":
			response += "This item is not yet supported. :[";
			isSuccess = false;
			break;
			
		case "pizzaBox":
			response += "This item is not yet supported. :[";
			isSuccess = false;
			break;
			

		// rarity: epic
		case "wine":
			response += "This item is not yet supported. :[";
			isSuccess = false;
			break;
			
		case "bullyingPower":
			response += "This item is not yet supported. :[";
			isSuccess = false;
			break;
			
		default:
			response += "Unknown item selected...";
			isSuccess = false;
	}
	
	saveState(grubwars);
	
	return [isSuccess, response];
}

export {
	useItem,
	throwItem,
};
