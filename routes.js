const express = require('express');
const router = express.Router();
const User = require('./models/user');
const Resp = require('./models/res');
const util = require('util');
const bodyParser = require('body-parser');
const crypto = require('crypto')
const pbkdf2 = util.promisify(crypto.pbkdf2);
const cookieParser = require('cookie-parser');
const fs = require("fs");
const path = require("path");
const multer = require("multer");
/* mqtt settings. */
const mqtt = require('mqtt');
const addr = 'mqtt://localhost:1883'; // replace the xs with your broker's IP address
const client = mqtt.connect(addr); // connect to client using the address

router.use(express.static(path.join(__dirname, 'views')));
router.use(express.static(path.join(__dirname, 'data')));
router.use(express.static(path.join(__dirname, 'public')));

router.use(bodyParser.json())
router.use(bodyParser.urlencoded({ extended: true }))
var session_user; // user auth for validate the user
const file_loacation = "data.json" // file name where data storeed
let mqtt_Data = []; // temp data store for send back reaquest 
let old_length_dash = 0; // for validate repeat sending data 
let old_length_chart = 0; // for validate repeat sending data
let new_len = 0; // getting how many data already received
// readthe file from json file 
const read_file = async() => {
        // read the data
        fs.readFile(file_loacation, 'utf8', (err, data) => {
            if (err) {
                console.log(`Error reading file from disk: ${err}`);
            } else {
                // parse JSON string to JSON object
                const mqtt_data = JSON.parse(data);

                //console.log(mqtt_data.length)
                new_len = mqtt_data.length;
                mqtt_Data = mqtt_data;
            }
        });
    }
    /* sleep funtion for wait utill the data collected .*/
const sleep = async(ms) => {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    /* default site access.
       if already login then go to index, 
       if not go to login page */
router.get("/", (req, res, next) => {
    if (!req.session.user) {
        res.status(401).render(path.resolve(__dirname + '/views/login'));
    } else {
        res.status(200).render(path.resolve(__dirname + '/views/index'));
    }
});
/* LOGIN Page access.
   if already login then go to index, 
   if not go to login page */
router.get("/login", (req, res, next) => {
    if (!req.session.user) {
        res.status(401).render(path.resolve(__dirname + '/views/login'));
    } else {
        res.status(200).render(path.resolve(__dirname + '/views/index'));
    }
});


/* REGISTER USER Page access. */
router.get("/register", (req, res, next) => {
    res.status(200).render(path.resolve(__dirname + '/views/register'));
});
/* LOGIN USER. 
 * encrypt the passwoard before find the data in database database
 * find the data if exist then create a session for user auth*/
router.post('/login', (req, res) => {
    var username = req.body.username;
    var password = crypto.pbkdf2Sync(req.body.password, 'salt', 2000, 64, 'sha512');
    User.findOne({ username: username, password: password }, (err, user) => {
        if (err) {
            console.log(err);
            Resp.errorResponse(err.message, res);
        }
        if (!user) {
            Resp.notFoundResponse('Invalid username Id or Password!', res);
        } else {
            req.session.user = user;
            Resp.successResponse('Welcome ' + username, res, user);
        }
    });
});


/* REGISTER USER. */
router.post('/register', (req, res) => {
    console.log(req.body)
    let crypto_pass = crypto.pbkdf2Sync(req.body.password, 'salt', 2000, 64, 'sha512');
    let token = crypto.randomBytes(30).toString('base64').slice(0, 30);
    let data = new User({
        username: req.body.username,
        fullname: req.body.fullname,
        password: crypto_pass,
        token: token,
        status: 0,
    });
    data.save(function(err) {
        if (err) {
            console.log(err);
            Resp.errorResponse(err.message, res);
        } else {
            Resp.successResponse('User registered successfully!', res, {});
        }
    })
});

/* GET LOGOUT 
 * when success destroy the session that hold user info 
 */
router.get('/logout', function(req, res) {
    req.session.destroy(function(err) {
        if (err) {
            console.log(err);
            Resp.errorResponse(err.message, res);
        } else {
            Resp.successResponse('Loging out', res, {});
        }
    });
});
/* GET index
 * Check for the user authentication 
 *  acess the dashboard page
 */
router.get("/index", (req, res, next) => {
    if (!req.session.user) {
        res.status(401).render(path.resolve(__dirname + '/views/login'));
    } else {
        res.status(200).render(path.resolve(__dirname + '/views/index'));
    }
});

/* GET chart
 * Check for the user authentication 
 * Acess the chart page
 */
router.get("/chart", async(req, res, next) => {
    if (!req.session.user) {
        res.status(401).render(path.resolve(__dirname + '/views/login'));
    } else {
        res.status(200).render(path.resolve(__dirname + '/views/chart'));
    }
});

/* GET loaddash
 * Check for the user authentication 
 * Check for the newly added data
 * check 3 times 100 ms interval before send it back, if there  is no data found 
 * convert to json format to string format 
 * send the result back the last received data 
 */
router.get("/loaddash", async(req, res, next) => {
    if (!req.session.user) {
        res.status(401).render(path.resolve(__dirname + '/views/login'));
    } else {
        var times = 0;
        read_file();
        if (new_len > 0) {
            while (times < 3) {
                if (old_length_chart != new_len) { // if new data added then send the data
                    old_length_chart = new_len;
                    Resp.successResponse('New data added.', res, JSON.stringify(mqtt_Data[new_len - 1]));
                    times = 4;
                } else {
                    await sleep(100);
                    times++;
                }
                if (times == 3) {
                    Resp.infoResponse('Connection is lost', res);
                }
                read_file();
            }

        } else {
            Resp.infoResponse('Connection is not established ', res)
        }
    }
});

/* GET loadchart
 * Check for the user authentication 
 * Check for the newly added data
 * check 3 times 100 ms interval before send it back, if there is no data found 
 * convert to json format to string format 
 * send the result back the whole data 
 */
router.get("/loadchart/:totalPoints", async(req, res, next) => {
    /* read_file();
    Resp.successResponse('New data added.', res, JSON.stringify(mqtt_Data.slice(((new_len - 1) - req.params.totalPoints), new_len)));
*/
    if (!req.session.user) {
        res.status(401).render(path.resolve(__dirname + '/views/login'));
    } else {

        var times = 0;
        read_file();
        if (new_len > 0) {
            while (times < 3) {
                if (old_length_chart != new_len) { // if new data added then send the data
                    old_length_chart = new_len;
                    Resp.successResponse('New data added.', res, JSON.stringify(mqtt_Data.slice(((new_len - 1) - req.params.totalPoints), (new_len - 1))));
                    times = 4;
                } else {
                    await sleep(100);
                    times++;
                }
                if (times == 3) {
                    Resp.infoResponse('Connection is lost', res);
                }
                read_file();
            }

        } else {
            Resp.infoResponse('Connection not established ', res)
        }
    }

});

/* GET set/pressure
 * Check for the user authentication 
 * send the pressure data using mqtt client.publish
 * check for the data that setpoit is pressure data when receive
 * check 3 times 100 ms interval before send it back, if there  is no data found 
 * convert to json format to string format 
 * send the message back
 */
router.get("/set/pressure/:value", async(req, res, next) => {
    if (!req.session.user) {
        res.status(401).render(path.resolve(__dirname + '/views/login'));
    } else {
        const obj = {
            "auto": true,
            "pressure": req.params.value
        }
        client.publish('controller/settings', JSON.stringify(obj));
        var times = 0;
        read_file();
        if (new_len > 0) {
            while (times < 3) {
                if (mqtt_Data[new_len - 1].auto == true && mqtt_Data[new_len - 1].setpoint == req.params.value && mqtt_Data[new_len - 1].error == false) { // if new data added then send the data
                    Resp.successResponse('Automatic pressure maintenance system activated and for that the fan speed engaged.', res, {});
                    times = 4;

                } else {
                    await sleep(100);
                    times++;
                }
                if (times == 3) {
                    Resp.infoResponse('The data is not set, check and try again', res);
                }
                read_file();
            }

        } else {
            Resp.infoResponse('Connection not established ', res)
        }
    }

});

/* GET set/speed
 * Check for the user authentication 
 * send the speed data using mqtt client.publish
 * check for the data that setpoit is speed data when receive
 * check 3 times 100 ms interval before send it back, if there  is no data found 
 * convert to json format to string format 
 * send the message back
 */
router.get("/set/speed/:value", async(req, res, next) => {
    if (!req.session.user) {
        res.status(401).render(path.resolve(__dirname + '/views/login'));
    } else {
        const obj = {
            "auto": false,
            "speed": req.params.value
        }
        client.publish('controller/settings', JSON.stringify(obj));
        var times = 0;
        if (new_len > 0) {
            while (times < 3) {
                read_file();
                if (mqtt_Data[new_len - 1].auto == false && mqtt_Data[new_len - 1].setpoint == req.params.value && mqtt_Data[new_len - 1].error == false) { // if new data added then send the data
                    Resp.successResponse('Manual setting was implemented to set the speed of the fan.', res, {});
                    times = 4;

                } else {
                    await sleep(100);
                    times++;
                }
                if (times == 3) {
                    Resp.infoResponse('The data is not set, check and try again', res);
                }
            }
        } else {
            Resp.infoResponse('Connection not established ', res)
        }
    }
});

/* GET *
 * if the request url not found
 */
router.get('/*', async(req, res) => {
    let data = [{ "msg": "Error, Page not found" }];
    res.status(404)
        .contentType("application/json")
        .send(data);
});

module.exports = router;