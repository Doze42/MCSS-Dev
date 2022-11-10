//embeds command

module.exports = {run}
const richEmbeds = require('../funcs/embeds'); //embed generation
const Discord = require('discord.js') //discord.js for embed object

async function run(client, interaction, stringJSON){
	global.shardInfo.commandsRun++
	try{
		var subCommand = interaction.options.getSubcommand()
		{let conn = await global.pool.getConnection();
		let dbData = (await conn.query("SELECT * from SERVERS WHERE SERVER_ID = " + interaction.guildId + " LIMIT 1"))[0];
		var embedData = JSON.parse(dbData.EMBEDS);
		var embedLimit = JSON.parse(dbData.CONFIG).limits.savedEmbedTemplates
		conn.release();}
		if (subCommand == 'add'){
			global.toConsole.log('/embeds add run by ' + interaction.user.username + '#' + interaction.user.discriminator + ' (' + interaction.user.id + ')')
			if(!interaction.inGuild()){return interaction.reply({embeds:[richEmbeds.makeReply(stringJSON.permissions.noDM, 'error', stringJSON)], ephemeral: true})}
			if(!client.guilds.cache.has(interaction.guildId)){return interaction.reply({embeds:[richEmbeds.makeReply(stringJSON.permissions.botScope, 'error', stringJSON)], ephemeral: true})} //bot scope
			if (interaction.user.PermissionLevel == 0 && !interaction.member.permissions.has("ADMINISTRATOR")){return interaction.reply({embeds:[richEmbeds.makeReply(stringJSON.permissions.restricted, 'error', stringJSON)], ephemeral: true})}
			if (embedData.templates.length >= embedLimit){return interaction.reply({embeds:[richEmbeds.makeReply(stringJSON.embedsCommand.maxTemplates, 'error', stringJSON)], ephemeral: true})}
			var options = {
				alias: interaction.options.getString('alias'),
				onlineHeader: interaction.options.getString('online-header'),
				onlineFooter: interaction.options.getString('online-footer'),
				onlineBody: interaction.options.getString('online-body'),
				onlineColor: interaction.options.getString('online-color') || '33CC66',
				onlineColorHex: interaction.options.getString('online-color-hex'),
				offlineHeader: interaction.options.getString('offline-header'),
				offlineFooter: interaction.options.getString('offline-footer'),
				offlineBody: interaction.options.getString('offline-body'),
				offlineColor: interaction.options.getString('offline-color') || 'E74C3C',
				offlineColorHex: interaction.options.getString('offline-color-hex'),
				playersSubheading: 'Players:', //add this option to the command later
				onlineTimestamp: interaction.options.getBoolean('online-display-timestamp') || true,
				offlineTimestamp: interaction.options.getBoolean('offline-display-timestamp') || true,
				displayThumbnail: interaction.options.getBoolean('display-thumbnail') || true,
				onlineDisplayList: interaction.options.getBoolean('online-display-list') || true,
				def: false //add this option to the command later
			}
			if (options.alias){if (options.alias.length > 50){return interaction.reply({embeds:[richEmbeds.makeReply(stringJSON.embedsCommand.aliasLength, 'error', stringJSON)], ephemeral: true})};}
			if (!options.alias){options.alias = "Embed " + (embedData.templates.length + 1);}
			if (!((embedData.templates.findIndex((obj) => obj.alias === options.alias)) === -1)){return interaction.reply({embeds:[richEmbeds.makeReply(stringJSON.embedsCommand.aliasTaken, 'error', stringJSON)], ephemeral: true})};
			if (options.def){embedData.default = embedData.templates.length;}
			console.log(stringJSON.embedsCommand)
			if(!options.onlineBody || !options.offlineBody){return interaction.reply({embeds:[richEmbeds.makeReply(stringJSON.embedsCommand.noBlank, 'error', stringJSON)], ephemeral: true})};
			embedData.templates.push({
				alias: options.alias,
				default: options.def,
				thumbnailEnable: options.displayThumbnail,
				online: {
					header: options.onlineHeader,
					footer: options.onlineFooter,
					body: options.onlineBody,
					playersList: {
						header: options.playersSubheading,
						display: options.onlineDisplayList
					},
					timestampEnable: options.onlineTimestamp,
					embedColor: options.onlineColorHex || options.onlineColor
				},
				offline: {
					header: options.offlineHeader,
					footer: options.offlineFooter,
					body: options.offlineBody,
					timestampEnable: options.offlineTimestamp,
					embedColor: options.offlineColorHex || options.offlineColor
				}
			});
			{let conn = await global.pool.getConnection();
			await conn.query(("UPDATE SERVERS SET EMBEDS = N'" + JSON.stringify(embedData).replace(/'/g, "''") + "' WHERE SERVER_ID = " + interaction.guildId).replace(/\\n/g, "\\\\n")) //writes embed data to database
			conn.release();}
			interaction.reply({embeds:[richEmbeds.makeReply(stringJSON.embedsCommand.templateAdded, 'notif', stringJSON)], ephemeral: false});
			}
		else if (subCommand == 'remove') {
			global.toConsole.log('/embeds remove run by ' + interaction.user.username + '#' + interaction.user.discriminator + ' (' + interaction.user.id + ')')
			if (interaction.channel.type == 'dm') {return interaction.reply({embeds:[richEmbeds.makeReply(stringJSON.permissions.noDM, 'error', stringJSON)], ephemeral: true})}
			if (interaction.user.PermissionLevel == 0 && !interaction.member.permissions.has("ADMINISTRATOR")){return interaction.reply({embeds:[richEmbeds.makeReply(stringJSON.permissions.restricted, 'error', stringJSON)], ephemeral: true})}
			var alias = interaction.options.getString('alias')
			var removeIndex = dbData.servers.findIndex((obj) => obj.alias === alias)
			if (removeIndex === -1){return interaction.reply({embeds:[richEmbeds.makeReply(stringJSON.servers.aliasNotFound, 'error', stringJSON)], ephemeral: true})};
			interaction.reply({embeds:[richEmbeds.makeReply(stringJSON.servers.serverRemoved + dbData.servers[removeIndex].alias, 'notif', stringJSON)]});
			if (removeIndex === dbData.default) {dbData.default = 0;}
			dbData.servers.splice(removeIndex, 1);
			{let conn = await global.pool.getConnection();
			conn.query(("UPDATE SERVERS SET SERVERS = '" + JSON.stringify(dbData).replace(/'/g, "''") + "' WHERE SERVER_ID = " + interaction.guildId).replace(/\\n/g, "\\\\n")) //writes automsg data to database	
			conn.release();}
		}
		else if (subCommand == 'list'){
			global.toConsole.log('/embeds list run by ' + interaction.user.username + '#' + interaction.user.discriminator + ' (' + interaction.user.id + ')')
			var embedFields = []
			for (let i = 0; i < embedData.templates.length; i++){
			if (i == embedData.default) {var fieldName = embedData.templates[i].alias + stringJSON.servers.listDefault}
			else {var fieldName = dbData.servers[i].alias}
			if (dbData.servers[i].serverPort){var fieldText = dbData.servers[i].serverIP + ':' + dbData.servers[i].serverPort;}
			else {var fieldText = dbData.servers[i].serverIP;}
			embedFields.push(
			{
				name: fieldName,
				value: fieldText
			})
			}
			var listEmbed = new Discord.MessageEmbed()
			.addFields(embedFields)
			.setTitle(stringJSON.servers.listHeading + interaction.guild.name)
			interaction.reply({embeds:[listEmbed]})
		}	
	}
	catch(err){
	console.log('Error!')
	console.log({command: 'embeds',
	error: err})
	}	
}