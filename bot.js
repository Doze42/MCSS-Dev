//Minecraft Server Status Discord Bot 
//© 2019-2022 Alex Reiter @ 123computer.net

const fs = require('fs')

global.botConfig = JSON.parse(fs.readFileSync("./assets/config.json")); //Settings and configuration FileUpload

const sql = require('mariadb')

global.pool = new sql.createPool(global.botConfig.configs[global.botConfig.release].dbConfig);

global.statusCache = new Map();
var statusQueue = [];

const chalk = require ('chalk')
const { Client, Intents } = require('discord.js');
const client = new Client({ intents: [Intents.FLAGS.GUILDS] });
const DBL = require('dblapi.js');
const isEqual = require('lodash.isequal');
const {BaseCluster} = require('kurasuta');
const dbl = new DBL('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY1MjcyNjEwNzUzNTMxMDg1OSIsImJvdCI6dHJ1ZSwiaWF0IjoxNTk0MTQwMjc1fQ.2raWpbfemxhiLKdDC805KttOMm6FQ5oR_KM5VJ7voOg', client);

//modules
const strings = require('./funcs/strings'); //public string manipulation functions
const compat = require('./funcs/compat'); //hard coded exception checks
const richEmbeds = require('./funcs/embeds'); //embed generation
const liveNotifier = require('./funcs/liveNotifier.js');
const channelEdit = require('./funcs/channelEdit.js')
const panelEdit = require('./funcs/panelEdit.js')
const loadDefaults = require('./funcs/loadDefaults.js')
const getLang = require('./funcs/getLang.js').getLang
const queryServer = require('./funcs/queryServer.js'); //ping library
const processPingQueue = require('./funcs/processPingQueue.js');

global.staticImages = JSON.parse(fs.readFileSync("./assets/static_images.json")); //Base64 encoded images


var stringJSON = getLang('en') //remove this later !!



//Commands
const commands = {
invite: require('./commands/invite'),
status: require('./commands/status'),
botstats: require('./commands/botstats'),
servers: require('./commands/servers'),
automsg: require('./commands/automsg'),
autocnl: require('./commands/autocnl'),
admin: require('./commands/admin'),
help: require('./commands/help'),
embeds: require('./commands/embeds'),
test: require('./commands/test')
}

global.shardInfo = {
	spawnTime: new Date(), //logs time at which shard spawned
	commandsRun: 0,
	liveStatusTime: 0
}

module.exports = class extends BaseCluster {
launch() {
this.client.login(global.botConfig.configs[global.botConfig.release].token);
var client = this.client

global.toConsole = { //Categorized Console Logging
	log: function(msg){console.log(chalk.magenta('[Shard ' + client.shard.id + '] ') + chalk.bgBlue('[log]') + ' ' + msg)},
	info: function(msg){console.log(chalk.magenta('[Shard ' + client.shard.id + '] ') + chalk.bgGreen('[info]') + ' ' + msg)},
	error: function(msg){console.log(chalk.magenta('[Shard ' + client.shard.id + '] ') + chalk.bgRed('[error]') + ' ' + msg)},
	debug: function(msg){
		if(global.botConfig.debugMode){console.log(chalk.magenta('[Shard ' + client.shard.id + '] ') + chalk.bgRed('[debug]') + ' ' + msg)}
	}
}

global.toConsole.log('Spawning Shard...')

/* sql.on('error', err => {
    global.toConsole.error('SQL Error: ' + err, 'error');
})

global.pool.on('error', err => {
    global.toConsole.error('Pool Error: ' + err, 'error');
}) */


process.on('unhandledRejection', err => { //Logs error and restarts shard on unhandledRejection
	global.toConsole.error('Reloading Shard: ' + err);
	try{fs.writeFileSync('./logs/shardCrash/' + new Date().getTime() + '.log', err.toString())}
	catch(err){global.toConsole.error('Failed to write error log')}
	client.shard.restart(client.shard.id);
});

client.on('rateLimit', (info) => {
  global.toConsole.error(`Rate limit hit ${info.timeDifference ? info.timeDifference : info.timeout ? info.timeout: 'Unknown timeout '}`)
})

client.on("ready", async function(){
	global.toConsole.info('Successfully logged in using Token ' + botConfig.release + ' at ' + new Date())
	if(global.botConfig.enableMessageEdit || global.botConfig.enableChannelEdit || global.botConfig.enableNotifer){liveStatus()} //starts live update loop
	client.user.setActivity(global.botConfig.configs[global.botConfig.release].activity.text, {type: global.botConfig.configs[global.botConfig.release].activity.type});
})

client.on('interactionCreate', async function (interaction){
try {
	if(!interaction.isCommand()) return; //exits if not command
	if(interaction.inGuild()){
		{let conn = await global.pool.getConnection();
		var guildData = await conn.query('SELECT * FROM SERVERS WHERE SERVER_ID = ' + interaction.guildId + ' LIMIT 1')
		if (!guildData.length){ //Adds new servers to database	
			var lang = getLang(interaction.guild.preferredLocale.slice(0, 2))
			try{await loadDefaults.addServer(interaction.guildId, lang.defaults)}
			catch(err){return interaction.reply({embeds:[richEmbeds.makeReply(lang.strings.cmdHandler.databaseAddFailed, 'error', lang.strings)], ephemeral: true})}
		}
		else{var lang = getLang((JSON.parse(guildData[0].CONFIG)).lang)}
		conn.release()}
	}
	else{var lang = getLang('en')} //defaults to english for direct messages
	{let conn = await global.pool.getConnection();
	var userData = (await conn.query('SELECT * FROM USERS WHERE ID = ' + interaction.user.id + ' LIMIT 1')).slice(0, -1)[0]
	conn.release();}
	if (userData){
		if (userData.BLACKLIST){return interaction.reply({embeds:[richEmbeds.makeReply(lang.strings.permissions.blacklisted + userData.BLACKLIST_REASON, 'error', lang.strings)], ephemeral: true})}
		interaction.user.PermissionLevel = userData.PLEVEL}
	else {interaction.user.PermissionLevel = 0;}
	if (interaction.commandName == 'invite'){commands.invite.run(client, interaction, lang.strings);}
	else if (interaction.commandName == 'status'){commands.status.run(client, interaction, lang.strings);}
	else if (interaction.commandName == 'botstats'){commands.botstats.run(client, interaction, lang.strings);}
	else if (interaction.commandName == 'servers'){commands.servers.run(client, interaction, lang.strings);}
	else if (interaction.commandName == 'automsg'){commands.automsg.run(client, interaction, lang.strings);}
	else if (interaction.commandName == 'help'){commands.help.run(client, interaction, lang.strings);}
	else if (interaction.commandName == 'embeds'){commands.embeds.run(client, interaction, lang.strings);}
	//else if (interaction.commandName == 'autocnl'){commands.autocnl.run(client, interaction, lang.strings);}
	else if (interaction.commandName == 'test'){
	processPingQueue.process()
	//commands.test.run(client, interaction, lang.strings);
	}
}
catch (err){global.toConsole.error("Interaction Failed: " + err)}
})

async function liveStatus(){
	global.toConsole.debug('Starting Live Status update..')
	var refreshStart = new Date().getTime();
	{let conn = await global.pool.getConnection();
	var dbData = await conn.query("SELECT * FROM LIVE")
	conn.release();}
	var i = 0;
	var elements = new Map();
	for (var i = 0; i < dbData.length; i++){if(client.guilds.cache.has(dbData[i].serverID)){elements.set(dbData[i].guid, dbData[i])}}
	var servers = new Set();
	for await (const [key, value] of elements){servers.add(JSON.parse(value.data).ip)}
	//processPingQueue.process(Array.from(servers))
	//console.log(servers.entries())
	//await servers.forEach((ip) => {})
	for await (const [key, value] of elements){
		try{
			var data = JSON.parse(value.data);
			if (data.type == 'panel'){				
				var res = await panelEdit.check(data, stringJSON.strings)
			}
		}
		catch(err){continue;} //handle this error right
				if (res.update){
					toConsole.debug('Adding panel ' + key + ' to queue...')
					statusQueue.push({
						type: 'panel',
						guid: value.guid,
						disable: res.disable,
						embed: res.data,
						serverID: data.guildID,
						messageID: data.messageID,
						channelID: data.channelID,
						timestamp: new Date().getTime()
					})
				}
			}
			//Following section will be used after the addition of other status types
			//else if (element.type == 'channel') {channelEdit.check(element)}
			//else if (element.type == 'notifier') {liveNotifier.check(element)}
			
	statusCache.clear(); //clears cached server status data
	global.toConsole.debug(statusQueue.length + ' elements in queue')
	if(statusQueue.length){await processQueue();}
	global.shardInfo.liveStatusTime = new Date().getTime() - refreshStart;
	if (global.shardInfo.liveStatusTime > 45000) {liveStatus()}
	if (global.shardInfo.liveStatusTime <= 45000) {setTimeout(() => {liveStatus()}, 45000)}
}

async function processQueue(){ //todo: add try/catch
	var promises = [] //array of promises
	await new Promise(async(resolve, reject) => {
	var queueLoop = setInterval(async function(){
		toConsole.debug('Processing Queue: ' + statusQueue.length + ' items remaining')
		if(!statusQueue.length){
			clearInterval(queueLoop);
			return resolve();}
		promises.push(Promise.race([new Promise(async(resolve, reject) => {
			try{
				var element = statusQueue.shift();	
				if (element.type == 'panel'){
					{let conn = await global.pool.getConnection();
					var panelData = JSON.parse((await conn.query("SELECT * FROM LIVE WHERE guid = '" + element.guid + "'"))[0].data)
					conn.release();}
					try{
						await panelEdit.update(element, client, stringJSON.strings)					
						panelData.lastPing = element.timestamp;
						panelData.lastState = element.embed;
						panelData.failureCount = 0;
					}
					catch(err){ //Panel failed, log
						if (panelData.failureCount >= global.botConfig.configs[global.botConfig.release].liveElementMaxFails || err == 'remove'){
						{let conn = await global.pool.getConnection();
						await conn.query("DELETE FROM LIVE WHERE guid = '" + element.guid + "'")
						conn.release();}
						toConsole.log('Panel with ID ' + element.messageID + ' has been removed due to failure count or channel issues.')}
						else{panelData.failureCount++
						toConsole.log('Panel with ID ' + element.messageID + ' failed to update: ' + err)}
					} 				
					resolve('Finished Updating')
					{let conn = await global.pool.getConnection();
					await conn.query(("UPDATE LIVE SET data = N'" + JSON.stringify(panelData).replace(/'/g, "''") + "' WHERE guid = '" + element.guid + "' LIMIT 1").replace(/\\n/g, "\\\\n"))
					conn.release();}
				}
				//other status types will be added here
			
		} catch(err){reject(err)}
		}), new Promise((resolve, reject) => {setTimeout(() => {resolve('Panel Timed Out')}, global.botConfig.configs[global.botConfig.release].liveElementTimeout)})]))
	}, global.botConfig.configs[global.botConfig.release].liveQueuePause)})	
	toConsole.debug(await Promise.any(promises))
}
}			
}