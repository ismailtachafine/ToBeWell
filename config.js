const mongoose = require("mongoose");
// const connect = mongoose.connect("mongodb://localhost:27017/tobewell");
const connect = mongoose.connect("mongodb+srv://ismailtachafine:Vinlandsaga@cluster0.nefojgh.mongodb.net/tobewell?retryWrites=true&w=majority");

// Check database connected or not
connect.then(() => {
    console.log("Database connected successfully");
})
.catch(() => {
    console.log("Database cannot be connected");
});

// Create Schema
const Loginschema = new mongoose.Schema({
    firstname: {
        type:String,
        required: true
    },
    lastname: {
        type:String,
        required: true
    },
    email: {
        type:String,
        required: true
    },
    password: {
        type: String,
        required: true
    }
});

// Collection part
const collection = new mongoose.model("users", Loginschema);

module.exports = collection;