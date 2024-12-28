const mongoose = require("mongoose");
const TombolaSchema = new mongoose.Schema({
  employe: { type: String, required: true },
  name: { type: String, required: true },
  nombre: { type: Number, required: true },
  phone: { type: String, required: true },
  factureId: { type: mongoose.Schema.Types.ObjectId, ref: "Facture" },
});

const Tombola = mongoose.model("Tombola", TombolaSchema);

module.exports = Tombola;