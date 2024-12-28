const { Schema, models, model } = require('mongoose');

const UserSchema = new Schema({
  id: {
    type: String,
    required: true,
    unique: true,
  },
  role: {
    type: String,
    enum: ['admin', 'editor', 'editor2', 'user'],
    default: 'user',
  },
  employe: { type: Schema.Types.ObjectId, ref: "Employe" }
});

const User = models.User || model('User', UserSchema);

module.exports = User;