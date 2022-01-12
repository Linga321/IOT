const mongoose = require('mongoose');
var Schema = mongoose.Schema;
var Users_infoSchema = new Schema(
    {
        username: {type: String, required: true, maxlength: 60},
        fullname: {type: String, required: true,  maxlength: 100},
        password: {type: String, required: true,  maxlength: 100},
        token: {type: String, maxlength: 60, required: true},
        status: {type: Number, required: true}
    }
);
//Export model
module.exports = mongoose.model('EMDUser', Users_infoSchema);