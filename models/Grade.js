const mongoose = require("mongoose");

const GradeSchema = new mongoose.Schema({
    name: String,
    order: Number
});

const Grade = mongoose.model("Grade", GradeSchema);

module.exports = Grade;