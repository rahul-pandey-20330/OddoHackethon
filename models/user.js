const mongoose = require('mongoose');
mongoose.connect('mongodb://127.0.0.1:27017/SwapSkill');

const userSchema = mongoose.Schema({
    name : String,
    email : String,
    skilloffered : String,
    skillrequired: String,
    address : String,
    availability : String,
    profileImage :String,
    password : String,
    Post : [
        {
                    type : mongoose.Schema.Types.ObjectId , ref :"Post"
        }
    ]
});
module.exports = mongoose.model('user',userSchema);