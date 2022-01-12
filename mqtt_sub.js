const mqtt = require('mqtt');
//const pub = require("./simulator.js") // publisher 
const fs = require('fs');
const addr = 'mqtt://localhost:1883'; // replace the xs with your broker's IP address
const client = mqtt.connect(addr);
let file_loacation = "./data.json"

client.on('connect', function() {
    client.subscribe('#');
    console.log("Testing connection")
    if (!fs.existsSync(file_loacation)) { // if the file is not exist create one
        fs.writeFileSync(file_loacation, JSON.stringify([]))
    }
})

client.on('message', function(t, data) {
    fs.readFile(file_loacation, 'utf8', (err, json_data) => {
        if (err) {
            console.log(`Error reading file from disk: ${err}`);
        } else {

            // parse JSON string to JSON object
            const databases = JSON.parse(json_data);
            const json_ = JSON.parse(data);
            // add a new record

            if (!data[0].hasOwnProperty('speed') && !data[0].hasOwnProperty('pressure')) { // check the speed and pressure
                databases.push(json_);
                // console.log(json_)
                // write new data back to the file
                fs.writeFile(file_loacation, JSON.stringify(databases, null, 2), (err) => {
                    if (err) {
                        console.log(`Error writing file: ${err}`);
                    }
                });
            }
        }

    });
})

module.exports = fs;