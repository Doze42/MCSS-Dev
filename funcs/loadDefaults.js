module.exports = {addServer};

async function addServer(id, defaults){
	return new Promise(async(resolve, reject) => {
		try{ 
			{let conn = await global.pool.getConnection();
			await conn.query(("INSERT INTO SERVERS VALUES ('" + id + "', '" + JSON.stringify(defaults.servers) + "', '" + JSON.stringify(defaults.embeds) + "' ,'" + JSON.stringify(defaults.config) + "', '" + JSON.stringify(defaults.compat) + "')").replace(/\\n/g, "\\\\n"))
			conn.release();}
			resolve ('Server ' + id + ' added to database.')
		}
		catch(err){
			global.toConsole.error('Failed to add new server to database: ' + err);
			reject(err)
		}
	})
}
