const mongoose = require("mongoose");
const EmployeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  grade: { type: String, required: true },
  date: String,
  rib: String,
  phone: String,
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
});

const Employe = mongoose.model("Employe", EmployeSchema);

module.exports = Employe;
