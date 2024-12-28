const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
  action: String,
  admin: String,
  timestamp: { type: Date, default: Date.now },
});

const Log = mongoose.models.Log || mongoose.model('Log', logSchema);

module.exports = Log;