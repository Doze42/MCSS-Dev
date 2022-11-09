const fs = require('fs');
const defaults = JSON.parse(fs.readFileSync("./assets/defaults.json")); //loads default values from disk

var test = JSON.stringify(defaults.embeds)
//var test = 'piss \n cock \n shitfuck \n \n FIUCCJ'
			console.log(test)
			console.log('fucking text to seperate the lines')
			//console.log(test.match(/\n/))
			//console.log(test.matchAll('\n'))
			console.log(test.replaceAll('\\n', '\\\\n'))