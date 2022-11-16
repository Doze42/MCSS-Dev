//Invite Command
const fs = require('fs');
const Discord = require('discord.js') //discord.js for embed object
const jimp = require ('jimp')
//const sharp = require('sharp')
module.exports = {run}

async function run(client, interaction, stringJSON){
try{
global.toConsole.log('/invite run by ' + interaction.user.username + '#' + interaction.user.discriminator + ' (' + interaction.user.id + ')')
global.shardInfo.commandsRun++
await interaction.deferReply()
var attachment = interaction.options.getAttachment('att')
console.log(attachment)
if (!(attachment.contentType == 'image/png' || attachment.contentType == 'image/jpeg' || 'image/gif' || 'image/bmp')){await interaction.reply('not supported')}
if (attachment.size > global.botConfig.maxAttachmentSize){await interaction.reply('ahh noo too big owo')}
	var bufferSource
await jimp.read(attachment.url).then(image => {
	image.resize(128, 128)
	image.getBase64Async(jimp.MIME_PNG).then(b64 => {bufferSource = b64})
	})
	//console.log((bufferSource))
await interaction.editReply({files: [new Discord.MessageAttachment(Buffer.from(bufferSource.slice(bufferSource.indexOf(',')), 'base64'), 'logo.png')]})

}
catch(err){
console.log('Error!')
console.log({command: 'invite',
error: err})
}	
}