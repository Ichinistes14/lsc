const mongoose = require("mongoose");

const GagnantSchema = new mongoose.Schema({
  name: String,
  nombre: Number,
  date: { type: Date, default: Date.now },
});

const Gagnant = mongoose.model("Gagnant", GagnantSchema);

module.exports = Gagnant;