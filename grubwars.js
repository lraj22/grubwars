import { getGrubwars, saveState } from "./datahandler.js";
import { items } from "./grubwars-data.js";
import { count } from "./helper.js";

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
	
	changeQuantity(playerId, item, -quantity);
	
	switch (item) {
		// rarity: basic
		case "lowFatMilk":
			changeScore(playerId, 5 * quantity);
			response += `You used ${count(quantity, easyName)} and gained ${count(scoreDiff(playerId, oldScore), "point")}!`;
			break;
			
		case "apple":
			changeScore(playerId, 8 * quantity);
			response += `You used ${count(quantity, easyName)} and gained ${count(scoreDiff(playerId, oldScore), "point")}!`;
			break;
			
		case "chocolateMilk":
			changeScore(playerId, 12 * quantity);
			response += `You used ${count(quantity, easyName)} and gained ${count(scoreDiff(playerId, oldScore), "point")}!`;
			break;
			
		case "grilledCheeseSandwich":
			changeScore(playerId, 15 * quantity);
			response += `You used ${count(quantity, easyName)} and gained ${count(scoreDiff(playerId, oldScore), "point")}!`;
			break;
			
		case "grape":
			response += "This item is not yet supported. :[";
			break;
			

		// rarity: uncommon
		case "peach":
			changeScore(playerId, 15 * quantity);
			response += `You used ${count(quantity, easyName)} and gained ${count(scoreDiff(playerId, oldScore), "point")}!`;
			break;
			
		case "pizzaSlice":
			response += "This item is not yet supported. :[";
			break;
			
		case "spork":
			response += "This item is not yet supported. :[";
			break;
			

		// rarity: rare
		case "lemonDrizzleCake":
			response += "This item is not yet supported. :[";
			break;
			
		case "trashGrabber":
			response += "This item is not yet supported. :[";
			break;
			
		case "pizzaBox":
			response += "This item is not yet supported. :[";
			break;
			

		// rarity: epic
		case "wine":
			response += "This item is not yet supported. :[";
			break;
			
		case "bullyingPower":
			response += "This item is not yet supported. :[";
			break;
			
		default:
			response += "Unknown item selected...";
	}
	
	saveState(grubwars);
	
	return response;
}

async function throwItem ({ playerId, item, quantity, targetId }) {
	grubwars = getGrubwars();
	let target = grubwars.players[targetId];
	let oldScore = grubwars.players[playerId].score;
	let oldTargetScore = grubwars.players[targetId].score;
	let easyName = items[item].name;
	let response = "";
	
	changeQuantity(playerId, item, -quantity);
	
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
			response += "This item is not yet supported. :[";
			break;
			
		case "spork":
			response += "This item is not yet supported. :[";
			break;
			

		// rarity: rare
		case "lemonDrizzleCake":
			response += "This item is not yet supported. :[";
			break;
			
		case "trashGrabber":
			response += "This item is not yet supported. :[";
			break;
			
		case "pizzaBox":
			response += "This item is not yet supported. :[";
			break;
			

		// rarity: epic
		case "wine":
			response += "This item is not yet supported. :[";
			break;
			
		case "bullyingPower":
			response += "This item is not yet supported. :[";
			break;
			
		default:
			response += "Unknown item selected...";
	}
	
	saveState(grubwars);
	
	return response;
}

export {
	useItem,
	throwItem,
}