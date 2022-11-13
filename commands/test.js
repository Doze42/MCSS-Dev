//Invite Command
const fs = require('fs');
const Discord = require('discord.js') //discord.js for embed object
const staticImages = JSON.parse(fs.readFileSync("./assets/static_images.json")); //Base64 encoded images
const axios = require('axios')
const sharp = require('sharp')
module.exports = {run}

async function run(client, interaction, stringJSON){
try{
global.toConsole.log('/invite run by ' + interaction.user.username + '#' + interaction.user.discriminator + ' (' + interaction.user.id + ')')
global.shardInfo.commandsRun++

var attachment = interaction.options.getAttachment('att')
console.log(attachment)
if (!(attachment.contentType == 'image/png' || attachment.contentType == 'image/jpeg')){await interaction.reply('not supported')}
if (attachment.size > global.botConfig.maxAttachmentSize){await interaction.reply('ahh noo too big owo')}
try{
buf = await axios.get(attachment.url, {responseType: 'arraybuffer'}).then(res => Buffer.from(res.data, 'binary').toString('base64'), 'base64')
var bufferSource = await sharp(Buffer.from(buf).resize({width: 256, height: 256, fit: 'fill'}).toBuffer('base64')).toString('base64')
}catch(err){console.log(err)}
await interaction.reply({files: [new Discord.MessageAttachment(Buffer.from(bufferSource, 'base64'), 'logo.png')]})
}
catch(err){
console.log('Error!')
console.log({command: 'invite',
error: err})
}	
}