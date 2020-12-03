const express = require("express");
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const User = require('./js/models/user.js'); 

// Connect to MongoDB through mongoose
mongoose.connect('mongodb://localhost:27017/goalApp2', {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true,
    useFindAndModify: false
});

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
    console.log("Database connected");
});

const app = express();

app.listen(3000, () => {
    console.log("LISTENING ON PORT 3000");
});