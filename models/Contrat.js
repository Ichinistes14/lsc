const mongoose = require("mongoose");
const ContratSchema = new mongoose.Schema({
  name: { type: String, required: true },
  montant: { type: Number, required: true },
});

const Contrat = mongoose.model("Contrat", ContratSchema);

module.exports = Contrat;