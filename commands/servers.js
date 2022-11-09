//servers command

module.exports = {run}
const richEmbeds = require('../funcs/embeds'); //embed generation
const Discord = require('discord.js') //discord.js for embed object

async function run(client, interaction, stringJSON){
	global.shardInfo.commandsRun++
	try{
		var subCommand = interaction.options.getSubcommand()
		{let conn = await global.pool.getConnection();
		var dbData = JSON.parse((await conn.query("SELECT * from SERVERS WHERE SERVER_ID = " + interaction.guildId + " LIMIT 1"))[0].SERVERS);
		conn.release();}
		if (subCommand == 'add'){
			global.toConsole.log('/servers add run by ' + interaction.user.username + '#' + interaction.user.discriminator + ' (' + interaction.user.id + ')')
			if(!interaction.inGuild()){return interaction.reply({embeds:[richEmbeds.makeReply(stringJSON.permissions.noDM, 'error', stringJSON)], ephemeral: true})}
			if(!client.guilds.cache.has(interaction.guildId)){return interaction.reply({embeds:[richEmbeds.makeReply(stringJSON.permissions.botScope, 'error', stringJSON)], ephemeral: true})} //bot scope
			if (interaction.user.PermissionLevel == 0 && !interaction.member.permissions.has("ADMINISTRATOR")){return interaction.reply({embeds:[richEmbeds.makeReply(stringJSON.permissions.restricted, 'error', stringJSON)], ephemeral: true})}
			if (dbData.servers.length >= 5){return interaction.reply({embeds:[richEmbeds.makeReply(stringJSON.servers.maxServers, 'error', stringJSON)], ephemeral: true})}
			var alias = interaction.options.getString('alias');
			var address = interaction.options.getString('address');
			var port = interaction.options.getInteger('port');
			var def = interaction.options.getBoolean('default');
			if (alias){if (alias.length > 50){return interaction.reply({embeds:[richEmbeds.makeReply(stringJSON.servers.aliasLength, 'error', stringJSON)], ephemeral: true})};}
			if (address.length > 253 || address.length < 5){return interaction.reply({embeds:[richEmbeds.makeReply(stringJSON.servers.ipLength, 'error', stringJSON)], ephemeral: true})};
			if (port){if (port < 1 || port > 65535){return interaction.reply({embeds:[richEmbeds.makeReply(stringJSON.servers.badPort, 'error', stringJSON)], ephemeral: true})};}
			if (!dbData.servers.length){def = true;}
			if (!alias){alias = "Server " + (dbData.servers.length + 1);}
			if (!((dbData.servers.findIndex((obj) => obj.alias === alias)) === -1)){return interaction.reply({embeds:[richEmbeds.makeReply(stringJSON.servers.aliasTaken, 'error', stringJSON)], ephemeral: true})};
			if (def){dbData.default = dbData.servers.length;}
			if (port) {address += ':' + port;}
			dbData.servers.push({serverIP: address, alias: alias});
			{let conn = await global.pool.getConnection();
			await conn.query(("UPDATE SERVERS SET SERVERS = N'" + JSON.stringify(dbData).replace(/'/g, "''") + "' WHERE SERVER_ID = " + interaction.guildId).replace(/\\n/g, "\\\\n")) //writes automsg data to database
			conn.release();}
			interaction.reply({embeds:[richEmbeds.makeReply(stringJSON.servers.serverAdded, 'notif', stringJSON)], ephemeral: false});
			}
		else if (subCommand == 'remove') {
			global.toConsole.log('/servers remove run by ' + interaction.user.username + '#' + interaction.user.discriminator + ' (' + interaction.user.id + ')')
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
			console.log(dbData)
			global.toConsole.log('/servers list run by ' + interaction.user.username + '#' + interaction.user.discriminator + ' (' + interaction.user.id + ')')
			if (!dbData.servers.length){return interaction.reply({embeds:[richEmbeds.makeReply(stringJSON.servers.noSaved, 'error', stringJSON)], ephemeral: true})};
			var embedFields = []
			for (let i = 0; i < dbData.servers.length; i++){
			if (i == dbData.default) {var fieldName = dbData.servers[i].alias + stringJSON.servers.listDefault}
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
	console.log({command: 'servers',
	error: err})
	}	
}