import { getGrubwars, saveState } from "./datahandler.js";
import { items, disasterReasons, wineDisasterReasons } from "./grubwars-data.js";
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

function _changeScore ({ method, affectedId, throwerId, quantity }) { // internal function that handles actual complexity
	let scoreMultiplier = 1;
	let effectsThatDidSomething = [];
	let now = Date.now();
	
	/*
	 * a listing of complexities to handle
	 * 1. the player [used] item and now has a score boost (ex. lemon drizzle cake)
	 * 2. the player had an item [thrown] on them and now has a score nerf (ex. lemon drizzle cake)
	 * 3. the player had an item [thrown] on them, but the thrower has a throw effectiveness limiter (ex. wine)
	 * 
	 * _changeScore does handle (1) & (2), but has yet to handle (3), most likely by taking a new argument 'throwerId'
	 */
	
	grubwars.players[affectedId].effects.forEach(function (effect) {
		if (now > effect.expires) return; // if expired, ignore
		
		// first, check if it is an effect that applies regardless of (quantity >? 0)
		if (effect.name.startsWith("wine") && effect.name.endsWith("-used")) {
			let grapesCount = effect.name.split("-")[1];
			let potency = 1 + (grapesCount / 50);
			scoreMultiplier *= potency;
			effectsThatDidSomething.push(effect);
		}
		
		// now check effects that only affect gaining points (quantity > 0)
		if (quantity <= 0) return;
		if (effect.name.startsWith("lemonDrizzleCake-used")) {
			scoreMultiplier *= 1.20; // self lemon drizzle cake: 20% points boost
			effectsThatDidSomething.push(effect);
		}
		else if (effect.name.startsWith("lemonDrizzleCake-thrown")) {
			scoreMultiplier *= 0.70; // foreign lemon drizzle cake: 30% points nerf
			effectsThatDidSomething.push(effect);
		}
	});
	if (method === "throw") { // score is affected on throws if thrower is under wine
		grubwars.players[throwerId].effects.filter(({ expires, name }) => (
			(now <= expires) &&
			name.startsWith("wine") &&
			name.endsWith("-thrown"))
		).forEach(effect => {
			let grapesCount = effect.name.split("-")[1];
			let potency = clamp(50, 100 - (grapesCount / 2), null) * 0.01;
			scoreMultiplier *= potency;
			effectsThatDidSomething.push(effect);
		});
	}
	quantity *= scoreMultiplier;
	
	quantity = Math.round(quantity);
	grubwars.players[affectedId].score = clamp(null, grubwars.players[affectedId].score + quantity, null);
	return effectsThatDidSomething;
}

function scoreDiff (playerId, oldScore) {
	return grubwars.players[playerId].score - oldScore;
}

async function useItem ({ playerId, item, quantity }) {
	grubwars = getGrubwars();
	let response = "";
	let oldScore = grubwars.players[playerId].score;
	let processingName = item.split("-")[0];
	let easyName = items[processingName].name;
	let isSuccess = true;
	
	let effectsThatDidSomething = [];
	
	function changeScore (options) { // wrapper
		let quantity;
		let affectedId = playerId;
		let throwerId = playerId;
		if (typeof options === "object") {
			if (options.affectedId) affectedId = options.affectedId;
			if (options.quantity) quantity = options.quantity;
			if (options.throwerId) throwerId = options.throwerId;
		} else {
			quantity = options;
		}
		effectsThatDidSomething.push(..._changeScore({ "method": "use", affectedId, throwerId, quantity }));
	}
	
	switch (processingName) {
		// rarity: basic
		case "lowFatMilk":
			changeQuantity(playerId, item, -quantity);
			changeScore(5 * quantity);
			response += `You used ${count(quantity, easyName)} and gained ${count(scoreDiff(playerId, oldScore), "point")}!`;
			break;
			
		case "apple":
			changeQuantity(playerId, item, -quantity);
			changeScore(8 * quantity);
			response += `You used ${count(quantity, easyName)} and gained ${count(scoreDiff(playerId, oldScore), "point")}!`;
			break;
			
		case "chocolateMilk":
			changeQuantity(playerId, item, -quantity);
			changeScore(12 * quantity);
			response += `You used ${count(quantity, easyName)} and gained ${count(scoreDiff(playerId, oldScore), "point")}!`;
			break;
			
		case "grilledCheeseSandwich":
			changeQuantity(playerId, item, -quantity);
			changeScore(15 * quantity);
			response += `You used ${count(quantity, easyName)} and gained ${count(scoreDiff(playerId, oldScore), "point")}!`;
			break;
			
		case "grape": {
			if (quantity < 20) {
				response += "Error: You must use _at least_ 20 grapes at once to make wine.";
				isSuccess = false;
				break;
			}
			changeQuantity(playerId, item, -quantity);
			changeQuantity(playerId, "wine-" + quantity, 1);
			let potency = 1 + (quantity / 50);
			response += `You used ${count(quantity, easyName)} and obtained Wine with a potency of ${potency}x. This multiplier affects both points and damage when used!`;
		} break;
			

		// rarity: uncommon
		case "peach":
			changeQuantity(playerId, item, -quantity);
			changeScore(15 * quantity);
			response += `You used ${count(quantity, easyName)} and gained ${count(scoreDiff(playerId, oldScore), "point")}!`;
			break;
			
		case "pizzaSlice": {
			changeQuantity(playerId, item, -quantity);
			let team = getTeamOf(playerId);
			grubwars.teams[team].forEach(memberId => changeScore({
				"affectedId": memberId,
				"quantity": 4 * quantity,
			}));
			response += `WOAH! Every member on your team gained ${4 * quantity} points!`;
		} break;
		
		case "spork": {
			changeQuantity(playerId, item, -quantity);
			let expiresTime = Date.now() + 1 * 60 * 60e3; // now + 1 hour
			let expiresTimeReadable = new Date(expiresTime).toUTCString();
			let effectsToAdd = new Array(quantity).fill({
				"name": "spork-used",
				"expires": expiresTime,
				"expiresReadable": expiresTimeReadable,
			});
			grubwars.players[playerId].effects.push(...effectsToAdd);
			let sporkEffects = grubwars.players[playerId].effects.filter(effect => effect.name.startsWith("spork"));
			response += `You are now under ${effectsToText(sporkEffects)}.`;
		} break;
			
		// rarity: rare
		case "lemonDrizzleCake": {
			changeQuantity(playerId, item, -quantity);
			let expiresTime = Date.now() + 1 * 60 * 60e3; // now + 1 hour
			let expiresTimeReadable = new Date(expiresTime).toUTCString();
			let effectsToAdd = new Array(quantity).fill({
				"name": "lemonDrizzleCake-used",
				"expires": expiresTime,
				"expiresReadable": expiresTimeReadable,
			});
			grubwars.players[playerId].effects.push(...effectsToAdd);
			let ldcEffects = grubwars.players[playerId].effects.filter(effect => effect.name.startsWith("lemonDrizzleCake"));
			response += `You are now under ${effectsToText(ldcEffects)}.`;
		} break;
		
		case "trashGrabber":
			changeQuantity(playerId, item, -quantity);
			changeScore(quantity * 50);
			response += `Awesome! You just scored ${quantity * 50} points with those ${count(quantity, easyName)}!`;
			break;
			
		case "pizzaBox": {
			let pizzaSlicesRequired = quantity * 4;
			let pizzaSliceCount = (grubwars.players[playerId].inventory.pizzaSlice || 0);
			if (pizzaSliceCount < pizzaSlicesRequired) {
				response += `Error: you don't have enough pizza slices! You need 4 per pizza box. You have ${pizzaSliceCount} and need ${pizzaSlicesRequired}.`;
				isSuccess = false;
				break;
			}
			changeQuantity(playerId, item, -quantity);
			changeQuantity(playerId, "pizzaSlice", -quantity * 4);
			changeScore(quantity * 75);
			response += `Pizza's on you! You just used ${count(quantity, easyName)} and earned ${quantity * 75} points!`;
		} break;
			
			
		// rarity: epic
		case "wine": {
			changeQuantity(playerId, item, -quantity);
			let grapesCount = parseInt(item.split("-")[1])
			let expiresTime = Date.now() + 3 * 60 * 60e3; // now + 3 hours
			let expiresTimeReadable = new Date(expiresTime).toUTCString();
			let effectsToAdd = new Array(quantity).fill({
				"name": `wine-${grapesCount}-used`,
				"expires": expiresTime,
				"expiresReadable": expiresTimeReadable,
			});
			grubwars.players[playerId].effects.push(...effectsToAdd);
			let wineEffects = grubwars.players[playerId].effects.filter(effect => effect.name.startsWith("wine"));
			response += `You are now under ${effectsToText(wineEffects)}.`;
		} break;
			
		case "bullyingPower":
			response += "This item is not yet supported. :[";
			isSuccess = false;
			break;
			
		default:
			response += "Unknown item selected...";
			isSuccess = false;
	}
	
	if (effectsThatDidSomething.length) {
		response = `Just an FYI, your throw was affected by ${effectsToText(effectsThatDidSomething)}.\n` + response;
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
	let processingName = item.split("-")[0];
	let easyName = items[processingName].name;
	let response = "";
	let isSuccess = true;
	
	changeQuantity(playerId, item, -quantity);
	
	let chanceToSucceed = 0.90;
	let effectsThatDidSomething = [];
	let affectedByWine = false;
	
	player.effects.forEach(function (effect) {
		if (Date.now() > effect.expires) return; // if expired, ignore
		
		if (effect.name.startsWith("spork-used")) {
			chanceToSucceed *= 1.05; // self spork: 5% accuracy boost
			effectsThatDidSomething.push(effect);
		}
		else if (effect.name.startsWith("spork-thrown")) {
			chanceToSucceed *= 0.90; // foreign spork: 10% accuracy nerf
			effectsThatDidSomething.push(effect);
		}
		else if (effect.name.startsWith("wine")) {
			let grapesCount = effect.name.split("-")[1];
			chanceToSucceed *= clamp(0.50, 0.90 - (grapesCount / 100), null); // wine: (90 - number of grapes)% accuracy nerf (maximum nerf is 50%)
			effectsThatDidSomething.push(effect);
			affectedByWine = true;
		}
	});
	
	if (Math.random () >= chanceToSucceed) { // WHOOPS YOU JUST MISSED
		let reasons = [];
		if (affectedByWine) reasons.push(...wineDisasterReasons);
		reasons.push(...disasterReasons);
		response += `Whoops! ${reasons[Math.floor(Math.random() * reasons.length)]} You just lost the ${count(quantity, easyName)} you were about to throw! Oh well.... :P`;
		if (effectsThatDidSomething.length) {
			response = `Just an FYI, your throw was affected by ${effectsToText(effectsThatDidSomething)}.\n` + response;
		}
		saveState(grubwars);
		return [isSuccess, response];
	}
	
	function changeScore (options) { // wrapper
		let affectedId, quantity;
		let throwerId = playerId;
		if (typeof options === "object") {
			if (options.affectedId) affectedId = options.affectedId;
			if (options.quantity) quantity = options.quantity;
			if (options.throwerId) throwerId = options.throwerId;
		} else {
			affectedId = targetId;
			quantity = options;
		}
		effectsThatDidSomething.push(..._changeScore({ "method": "throw", affectedId, throwerId, quantity }));
	}
	
	switch (processingName) {
		// rarity: basic
		case "lowFatMilk":
			changeScore(-5 * quantity);
			response += `You threw ${count(quantity, easyName)} and ${target.preferredName} lost ${count(-scoreDiff(targetId, oldTargetScore), "point")}!`;
			break;
			
		case "apple":
			changeScore(-8 * quantity);
			response += `You threw ${count(quantity, easyName)} and ${target.preferredName} lost ${count(-scoreDiff(targetId, oldTargetScore), "point")}!`;
			break;
			
		case "chocolateMilk":
			changeScore(-12 * quantity);
			response += `You threw ${count(quantity, easyName)} and ${target.preferredName} lost ${count(-scoreDiff(targetId, oldTargetScore), "point")}!`;
			break;
			
		case "grilledCheeseSandwich":
			changeScore(-15 * quantity);
			response += `You threw ${count(quantity, easyName)} and ${target.preferredName} lost ${count(-scoreDiff(targetId, oldTargetScore), "point")}!`;
			break;
			
		case "grape":
			changeScore(-2 * quantity);
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
			changeScore(-10 * (quantity + giantPeachCount));
			response += `You threw ${count(quantity, easyName)} and ${target.preferredName} lost ${count(-scoreDiff(targetId, oldTargetScore), "point")}!` + extraResponse;
			break;
			
		case "pizzaSlice": {
			let team = getTeamOf(targetId);
			grubwars.teams[team].forEach(memberId => changeScore({
				"affectedId": memberId, 
				"quantity": -3 * quantity,
			}));
			response += `YIKES! Every member on ${target.preferredName}'s team LOST ${3 * quantity} points!`;
		} break;
			
		case "spork": {
			let expiresTime = Date.now() + 2 * 60 * 60e3; // now + 2 hours
			let expiresTimeReadable = new Date(expiresTime).toUTCString();
			let effectsToAdd = new Array(quantity).fill({
				"name": "spork-thrown",
				"expires": expiresTime,
				"expiresReadable": expiresTimeReadable,
			});
			grubwars.players[targetId].effects.push(...effectsToAdd);
			let sporkCount = grubwars.players[targetId].effects.reduce((effect, cur) => cur + (effect.name.startsWith("spork") ? 1 : 0), 0); // count number of spork effects
			response += `${target.preferredName} is now under ${count(sporkCount, "spork effect")}.`;
		} break;
			
		// rarity: rare
		case "lemonDrizzleCake": {
			let expiresTime = Date.now() + 12 * 60 * 60e3; // now + 12 hours
			let expiresTimeReadable = new Date(expiresTime).toUTCString();
			let effectsToAdd = new Array(quantity).fill({
				"name": "lemonDrizzleCake-thrown",
				"expires": expiresTime,
				"expiresReadable": expiresTimeReadable,
			});
			grubwars.players[targetId].effects.push(...effectsToAdd);
			let ldcEffects = grubwars.players[targetId].effects.filter(effect => effect.name.startsWith("lemonDrizzleCake"));
			response += `${target.preferredName} is now under ${effectsToText(ldcEffects)}.`;
		} break;
			
		case "trashGrabber":
			changeQuantity(playerId, item, quantity - 1); // you can only use one trash grabber at a time
			isSuccess = "trashGrabberTakeOne"; // send to subprocess
			break;
			
		case "pizzaBox": {
			changeScore(-20 * quantity);
			let oldSliceCount = grubwars.players[targetId].inventory.pizzaSlice;
			let slicesLost = Math.floor(Math.random() * 3 * quantity) + (2 * quantity); // from 2-4 (multiplied by quantity)
			grubwars.players[targetId].inventory.pizzaSlice = clamp(0, oldSliceCount - slicesLost, null);
			response += `The power of pizza is pleasing! ${target.preferredName} lost ${-20 * quantity} points and lost up to ${count(slicesLost, "pizza slice")} (they had ${oldSliceCount}).`;
		} break;
			

		// rarity: epic
		case "wine": {
			let grapesCount = parseInt(item.split("-")[1])
			let expiresTime = Date.now() + 3 * 60 * 60e3; // now + 3 hours
			let expiresTimeReadable = new Date(expiresTime).toUTCString();
			let effectsToAdd = new Array(quantity).fill({
				"name": `wine-${grapesCount}-thrown`,
				"expires": expiresTime,
				"expiresReadable": expiresTimeReadable,
			});
			grubwars.players[targetId].effects.push(...effectsToAdd);
			let wineEffects = grubwars.players[targetId].effects.filter(effect => effect.name.startsWith("wine"));
			response += `${target.preferredName} is now under ${effectsToText(wineEffects)}.`;
		} break;
			
		case "bullyingPower":
			response += "This item is not yet supported. :[";
			isSuccess = false;
			break;
			
		default:
			response += "Unknown item selected...";
			isSuccess = false;
	}
	
	if (effectsThatDidSomething.length) {
		response = `Just an FYI, your throw was affected by ${effectsToText(effectsThatDidSomething)}.\n` + response;
	}
	
	saveState(grubwars);
	
	return [isSuccess, response];
}

export {
	useItem,
	throwItem,
};
