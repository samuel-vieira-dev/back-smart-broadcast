// models/UserSettings.js
const mongoose = require('mongoose');

const pageSchema = new mongoose.Schema({
  id: { type: String, required: true },
  access_token: { type: String, required: true },
  name: { type: String, required: true },
  category: { type: String },
  category_list: { type: Array },
  tasks: { type: [String] }
});

const userSettingsSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  facebookUserId: { type: String},
  status: {type: Number},
  accessToken: { type: String},
  appAccessToken: { type: String },
  pages: [pageSchema],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const UserSettings = mongoose.model('UserSettings', userSettingsSchema);

module.exports = UserSettings;
