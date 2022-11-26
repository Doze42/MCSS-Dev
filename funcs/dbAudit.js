module.exports = {guildAudit, guildDelete, messageDelete}

function guildAudit(){}

async function messageDelete(messages){
	{let conn = await global.pool.getConnection();
	var dbData = (await conn.query(`SELECT * FROM LIVE WHERE serverID = ${messages[0].guildId}`)).slice(0, -1)
	conn.release();}
	if (dbData.length){
		for (const message of messages){
			
			for (const element of dbData){
				let data = JSON.parse(element.data);
				if (data.type === 'panel'){
					if (data.messageID == message.id){
						global.toConsole.log(`Panel message deleted: ${element.guid}`)
						{let conn = await global.pool.getConnection();
						await conn.query(`DELETE FROM LIVE WHERE guid = '${element.guid}'`)
						conn.release();}
					}
				}
			}
		}
	}
}

async function guildDelete(guildID){
	global.toConsole.log(`Guild Deleted or Removed: ${guildID}`)
	{let conn = await global.pool.getConnection();
	await conn.query(`DELETE FROM LIVE WHERE serverID = '${guildID}'`)
	await conn.query(`DELETE FROM SERVERS WHERE SERVER_ID = '${guildID}'`)
	conn.release();}
}