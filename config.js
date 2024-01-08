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
const UserSchema = new mongoose.Schema({
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
    },
    date: {
        type: Date,
        default: Date.now
    },
    role: {
        type: String,
        default: "patient"
    },
});

// Collection part
const collection = new mongoose.model("users", UserSchema);

module.exports = collection;