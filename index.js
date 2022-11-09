const { ShardingManager } = require('kurasuta');
const { join } = require('path');
const { Client, Intents } = require('discord.js');
const fs = require ('fs')

const shardCount = (JSON.parse(fs.readFileSync("./assets/config.json"))).shardCount

global.shardCrashCount = 0;

setInterval(function(){global.shardCrashCount = 0}, 86400000) //resets shard reconnect count daily

const sharder = new ShardingManager(join(__dirname, 'bot'), {
	clusterCount: shardCount,
	shardCount: shardCount,
	timeout: 30000,
	clientOptions: {partials: ['MESSAGE'], intents: [Intents.FLAGS.GUILDS]},
	ipcSocket: 9999
});

sharder.spawn();

sharder.on('error', (err) => {
	global.shardCrashCount++;
	if (global.shardCrashCount > 500){process.exit(1)} //Kills process to avoid shard reconnection ratelimit
	console.log('Sharder Error: ' + err)
});
