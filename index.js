const express = require('express');
const path = require('path');
var session = require('express-session');
const sub = require("./mqtt_sub.js") // mqtt sub 
const routes = require("./routes");
const app = express();

app.set('view engine', 'ejs');
app.use(session({
    secret: 'djhxcvxfgshjfgjhgsjhfgakjeauytsdfy', // a secret key you can write your own 
    resave: false,
    saveUninitialized: true
}));
app.use('/', routes);

const mongoose = require('mongoose');
const mongoURL = 'mongodb+srv://week3_task1_2:metropolia_123@cluster0.rushy.mongodb.net/cars_info_db?retryWrites=true&w=majority';
mongoose.connect(mongoURL, { useNewUrlParser: true });
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

/* util functions ends */
//configure the server port

app.listen(3000, () => {
    console.log('Server runs on port 3000')
})