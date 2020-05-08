module.exports = function Gathering(mod) {

	let toGather = [];
	let mobid = [],
		gatherMarker = [];
	let first = true;
	
	function gatheringStatus() {
		sendStatus(
			"Gathering: "+ (mod.settings.enabled      ? "On"   : "Off"),
			"AutoGathering: " + (mod.settings.auto  ? "Enable" : "Disable"),
			"DEBUG: " + (mod.settings.DEBUG  ? "Enable" : "Disable"),
			"SendAlert: " + (mod.settings.sendToAlert  ? "Enable" : "Disable"),
			"plants: " + (mod.settings.plants ? "Show" : "Hide"),
			"ore: " + (mod.settings.ore ? "Show" : "Hide"),
			"energy: " + (mod.settings.energy ? "Show" : "Hide"),
			"grass: "     + (mod.settings.grass        ? "Show" : "Hide"),
			"stone: "     + (mod.settings.stone        ? "Show" : "Hide"),
			"achromic: "     + (mod.settings.achromic        ? "Show" : "Hide"),
		)
	}
	
	function sendStatus(msg) {
		sendMessage([...arguments].join('\n\t - '))
	}
	
	mod.command.add("ggat", (arg) => {
		if (!arg) {
			mod.settings.enabled = !mod.settings.enabled;
			if (!mod.settings.enabled) {
				for (let itemId of mobid) {
					despawnItem(itemId);
				}
			}
			sendMessage("Gathering: "+ (mod.settings.enabled      ? "On"   : "Off"))
		} else {
			switch (arg) {
				case "alert":
					mod.settings.sendToAlert = !mod.settings.sendToAlert
					sendMessage("SendAlert" + (mod.settings.sendToAlert ? "Enable" : "Disable"))
					break;
				case "status":
					gatheringStatus()
					break;
				case "all":			
					mod.settings.plants = true
					mod.settings.ore = true
					mod.settings.energy = true
					mod.settings.grass = true
					mod.settings.stone = true
					mod.settings.achromic = true	
					gatheringStatus()
					break;
				case "none":			
					mod.settings.plants = false
					mod.settings.ore = false
					mod.settings.energy = false
					mod.settings.grass = false
					mod.settings.stone = false
					mod.settings.achromic = false
					gatheringStatus()
					break;
				case "plants":
					mod.settings.plants = !mod.settings.plants;
					sendMessage("plant " + (mod.settings.plants ? "Show" : "Hide"));
					break;
				case "ore":
					mod.settings.ore = !mod.settings.ore;
					sendMessage("ore " + (mod.settings.ore ? "Show" : "Hide"));
					break;
				case "energy":
					mod.settings.energy = !mod.settings.energy;
					sendMessage("energy " + (mod.settings.energy ? "Show" : "Hide"));
					break;
				case "grass":
					mod.settings.grass = !mod.settings.grass;
					sendMessage("grass " + (mod.settings.grass ? "Show" : "Hide"));
					break;
				case "stone":
					mod.settings.stone = !mod.settings.stone;
					sendMessage("Plain stone " + (mod.settings.stone ? "Show" : "Hide"));
					break;
				case "achromic":
					mod.settings.achromic = !mod.settings.achromic;
					sendMessage("Achromic Essence " + (mod.settings.achromic ? "Show" : "Hide"));
					break;
				case 'auto':
					mod.settings.auto = !mod.settings.auto;
					sendMessage("Auto Gat " + (mod.settings.auto ? "Enabled" : "Disabled"));
					break;
				case 'debug':
					mod.settings.DEBUG = !mod.settings.DEBUG
					sendMessage(mod.settings.DEBUG ? "Debug Enabled": "Debug Disabled");
					break;
				default:
					sendMessage("Available Commands: auto,all,non,alert and status show available plant settings");
					break;
			}
		}
	})
	
	mod.game.me.on('change_zone', (zone, quick) => {
		mobid = [];
		first = false;
	})
	
	mod.hook('S_SPAWN_COLLECTION', 4, (event) => {
		if (mod.settings.enabled) {
			if (mod.settings.plants && (gatherMarker = mod.settings.Plants.find(obj => obj.id === event.id))) {
				sendAlert( ("Found [" + gatherMarker.name + "] " + gatherMarker.msg), 44)
				sendMessage("Found [" + gatherMarker.name + "] " + gatherMarker.msg)
			} else if (mod.settings.ore && (gatherMarker = mod.settings.Ore.find(obj => obj.id === event.id))) {
				sendAlert( ("Found [" + gatherMarker.name + "] " + gatherMarker.msg), 44)
				sendMessage("Found [" + gatherMarker.name + "] " + gatherMarker.msg)
			} else if (mod.settings.energy && (gatherMarker = mod.settings.Energy.find(obj => obj.id === event.id))) {
				sendAlert( ("Found [" + gatherMarker.name + "] " + gatherMarker.msg), 44)
				sendMessage("Found [" + gatherMarker.name + "] " + gatherMarker.msg)
			} else if (mod.settings.grass && event.id == 1) {
				sendAlert( ("Found [Harmony Grass] "), 44)
				sendMessage("Found [Harmony Grass] ")
			} else if (mod.settings.stone && event.id == 101) {
				sendAlert( ("Found [Plain Stone] "), 44)
				sendMessage("Found [Plain Stone] ")
			} else if (mod.settings.achromic && event.id == 201) {
				sendAlert( ("Found [Achromic Essence] "), 44)
				sendMessage("Found [Achromic Essence] ")
			} else {
				return true
			}
			spawnItem(event.gameId, event.loc)
			mobid.push(event.gameId)
		}
	})
	
	mod.hook('S_DESPAWN_COLLECTION', 2, (event) => {
		if (mobid.includes(event.gameId)) {
			gatherMarker = []
			despawnItem(event.gameId)
			mobid.splice(mobid.indexOf(event.gameId), 1)
		}
	})

	mod.hook('S_COLLECTION_PICKEND', 2, gatherIt);
	//[21:7:39:132] <-          	 S_COLLECTION_PICKSTART    (id 41397)
	// {
	// 	"user": "72198331528786010",
	// 		"collection": "1266637395794163",
	// 			"duration": "14850"
	
	function spawnItem(gameId, loc) {
		mod.send('S_SPAWN_DROPITEM', 8, {
			gameId: gameId*10n,
			loc: loc,
			item: mod.settings.markerId,
			amount: 1,
			expiry: 999999,
			owners: [{}]
		});
		if (mod.settings.DEBUG) sendMessage("Pushing " + gameId);
		toGather.push({ gameId: gameId, loc: loc });
		if (first){ first = false; gatherIt(); }
	}

	function gatherIt(event){
		if (mod.settings.DEBUG) sendMessage("Previous pick: " + event.collection);
		if (mod.settings.auto) {
			if(toGather.length > 0){
				let item = toGather.pop();
				if (mod.settings.DEBUG) sendMessage("Moving to " + item.gameId);
				mod.command.exec('tp ' + (parseInt(item.loc.x) - 1) + ' ' + (parseInt(item.loc.y) - 1) + ' ' + (parseInt(item.loc.z) + 20));
				mod.setTimeout(() => {
					mod.toServer('C_COLLECTION_PICKSTART', 2, {
						gameId: item.gameId
					});
				}, rng(500,1500));
			} else {
				sendMessage("Nothing to gather");
			}
		}
	}
	
	function despawnItem(gameId) {
		toGather.forEach(function (item, index, object) {
			if (mod.settings.DEBUG) sendMessage("Check " + gameId + " = " + item.gameId);
			if (item.gameId == gameId) {
				object.splice(index, 1);
				if (mod.settings.DEBUG) sendMessage("Removed " + gameId);
			}
		});
		mod.send('S_DESPAWN_DROPITEM', 4, {
			gameId: gameId*10n
		});
	}
	
	function sendMessage(msg) { mod.command.message(msg) }
	
	function sendAlert(msg, type) {
		mod.send('S_DUNGEON_EVENT_MESSAGE', 2, {
			type: type,
			chat: false,
			channel: 0,
			message: msg,
		})
	}

	function rng(f, s) {
		if (s !== undefined)
			return f + Math.floor(Math.random() * (s - f + 1));
		else
			return f.min + Math.floor(Math.random() * (f.max - f.min + 1));
	}
}
