const { Schema, model } = require("mongoose");
const TombolaSchema = new Schema({
  employe: { type: String, required: true },
  name: { type: String, required: true },
  nombre: { type: Number, required: true },
  phone: { type: String, required: true },
  factureId: { type: Schema.Types.ObjectId, ref: "Facture" },
  isDeletable: { type: Boolean, default: true, required: false },
  isTarif: { type: Number, required: false },
});

const Tombola = model("Tombola", TombolaSchema);

module.exports = Tombola;