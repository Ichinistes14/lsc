const mongoose = require("mongoose");

const HistorySchema = new mongoose.Schema({
  week: { type: String, required: true },
  year: { type: String, required: true },
  montant: { type: Number, required: true },
});

const History = mongoose.model("History", HistorySchema);

module.exports = History;