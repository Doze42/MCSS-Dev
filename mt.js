const mariadb = require ('mariadb')

const pool = mariadb.createPool({ 
    host: '192.168.0.6', 
    user: 'mcss_alpha',
	password: 'xQ365BB$Eyq0',
	database: 'mcss_alpha',
	

});
main()
async function main() {
	try {
		var conn = await pool.getConnection();
var guildId = 690081112164139040
		var dbData = (await conn.query("SELECT * from SERVERS WHERE SERVER_ID = " + guildId + " LIMIT 1"))[0].EMBEDS.charCodeAt(260);
		console.log(dbData)
		
		conn.release(); //release to pool
	} catch (err) {console.log('Database Connection Error: ' + err);}
}