//Server ping queue module

module.exports = {process}


const queue2 = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15']

async function process(queue = queue2){

	while(queue.length){
	console.log(queue.splice(0, 10))
	
	}

}