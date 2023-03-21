//embeds command

module.exports = {run}
const richEmbeds = require('../funcs/embeds'); //embed generation
const Discord = require('discord.js') //discord.js for embed object
const sql = require('mssql') //sql

async function run(client, interaction, stringJSON){
	global.shardInfo.commandsRun++
	try{
		if(!interaction.inGuild()){return interaction.reply({embeds:[richEmbeds.makeReply(stringJSON.permissions.noDM, 'error', stringJSON)], ephemeral: true})}
		var subCommand = interaction.options.getSubcommand()
		//{let conn = await global.pool.getConnection();
		//let dbData = (await conn.query("SELECT * from SERVERS WHERE SERVER_ID = " + interaction.guildId + " LIMIT 1"))[0];
		var dbData = (await new sql.Request(global.pool).query('SELECT TOP 1 * from SERVERS WHERE SERVER_ID = ' + interaction.guildId)).recordset[0] //mssql
		var compatData = JSON.parse(dbData.COMPAT);
		var embedLimit = JSON.parse(dbData.CONFIG).limits.savedEmbedTemplates
		//conn.release();}
		if (subCommand == 'add'){
			global.toConsole.log('/embeds add run by ' + interaction.user.username + '#' + interaction.user.discriminator + ' (' + interaction.user.id + ')')
			if(!client.guilds.cache.has(interaction.guildId)){return interaction.reply({embeds:[richEmbeds.makeReply(stringJSON.permissions.botScope, 'error', stringJSON)], ephemeral: true})} //bot scope
			if (interaction.user.PermissionLevel == 0 && !interaction.member.permissions.has("ADMINISTRATOR")){return interaction.reply({embeds:[richEmbeds.makeReply(stringJSON.permissions.restricted, 'error', stringJSON)], ephemeral: true})}
			if (embedData.templates.length >= embedLimit){return interaction.reply({embeds:[richEmbeds.makeReply(stringJSON.embedsCommand.maxTemplates, 'error', stringJSON)], ephemeral: true})}
			var domain = interaction.options.getString('domain')
			var trigger = interaction.options.getString('trigger')
			if (options.alias){if (options.alias.length > 50){return interaction.reply({embeds:[richEmbeds.makeReply(stringJSON.embedsCommand.aliasLength, 'error', stringJSON)], ephemeral: true})};}
			if (!options.alias){options.alias = "Embed " + (embedData.templates.length + 1);}
			if (!((embedData.templates.findIndex((obj) => obj.alias === options.alias)) === -1)){return interaction.reply({embeds:[richEmbeds.makeReply(stringJSON.embedsCommand.aliasTaken, 'error', stringJSON)], ephemeral: true})};
			if (options.def){embedData.default = embedData.templates.length;}
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
			//{let conn = await global.pool.getConnection();
			//await conn.query(("UPDATE SERVERS SET EMBEDS = N'" + JSON.stringify(embedData).replace(/'/g, "''") + "' WHERE SERVER_ID = " + interaction.guildId).replace(/\\n/g, "\\\\n")) //writes embed data to database
			//conn.release();}
			await new sql.Request(global.pool).query(`UPDATE SERVERS SET COMPAT = '${JSON.stringify(compatData).replace(/'/g, "''")} WHERE SERVER_ID = ${interaction.guildId}`)
			interaction.reply({embeds:[richEmbeds.makeReply(stringJSON.embedsCommand.templateAdded, 'notif', stringJSON)], ephemeral: false});
			}
		else if (subCommand == 'remove') {
			global.toConsole.log('/embeds remove run by ' + interaction.user.username + '#' + interaction.user.discriminator + ' (' + interaction.user.id + ')')
			if (interaction.user.PermissionLevel == 0 && !interaction.member.permissions.has("ADMINISTRATOR")){return interaction.reply({embeds:[richEmbeds.makeReply(stringJSON.permissions.restricted, 'error', stringJSON)], ephemeral: true})}
			var removeIndex = interaction.options.getInteger('index')
			if (!compatData.length) //no entries
			interaction.reply({embeds:[richEmbeds.makeReply(stringJSON.embedsCommand.templateRemoved + embedData.templates[removeIndex].alias, 'notif', stringJSON)]});
			compatData.splice(removeIndex, 1);
			//{let conn = await global.pool.getConnection();
			//conn.query((`UPDATE SERVERS SET COMPAT = '${JSON.stringify(compatData).replace(/'/g, "''")}' WHERE SERVER_ID = ${interaction.guildId}`).replace(/\\n/g, "\\\\n")) //writes automsg data to database	
			//conn.release();}	
			await new sql.Request(global.pool).query(`UPDATE SERVERS SET COMPAT = '${JSON.stringify(compatData).replace(/'/g, "''")}' WHERE SERVER_ID = ${interaction.guildId}`)
		}	
		else if (subCommand == 'list'){
			global.toConsole.log(`/compat list run by ${interaction.user.username}#${interaction.user.discriminator} (${interaction.user.id})`)
			if (!compatData.length){return interaction.reply({embeds:[richEmbeds.makeReply(stringJSON.embedsCommand.noSaved, 'error', stringJSON)], ephemeral: true})};
			var compatText = []
			for (let i = 0; i < compatData.length; i++){
				let sectionHeader = `Entry ${i}` //add to string file later
				if (compatData[i].standard){sectionHeader = `:robot: ${sectionHeader}`}
				compatText.push(`**${sectionHeader}** \n Domain: ${compatData[i].domain} \n Trigger: ${compatData[i].trigger}`)
			}
			var listEmbed = new Discord.MessageEmbed()
			.setDescription(compatText.join('\n'))
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