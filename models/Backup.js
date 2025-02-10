const { Schema, models, model } = require('mongoose');

const backupSchema = new Schema({
  date: { type: String, required: true },
  employeesMetrics: [{ type: Schema.Types.Mixed }],
});

const Backup = models.Backup || model('Backup', backupSchema);

module.exports = Backup;