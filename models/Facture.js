const mongoose = require("mongoose");

const FactureSchema = new mongoose.Schema({
  name: String,
  type: String,
  montant: String,
  contrat: String,
  gagnant: String,
  date: String,
});

const Facture = mongoose.model("Facture", FactureSchema);

module.exports = Facture;