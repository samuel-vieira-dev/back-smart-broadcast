// models/UserSettings.js
const mongoose = require('mongoose');

// const buttonSchema = new mongoose.Schema({
//   type: { type: String},
//   url: { type: String },
//   title: { type: String }
// }, { _id: false });

const pageSchema = new mongoose.Schema({
  id: { type: String, required: true },
  access_token: { type: String},
  name: { type: String, required: true },
  category: { type: String },
  category_list: { type: Array },
  tasks: { type: [String] }
});

const userSettingsSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  facebookUserId: { type: String},
  custumerId: {type: String},
  status: {type: String},
  accessToken: { type: String},
  appAccessToken: { type: String },
  firstBroad: {type: Boolean},
  // firstMessage: { type: String },
  // buttons: [buttonSchema],
  pages: [pageSchema],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const UserSettings = mongoose.model('UserSettings', userSettingsSchema);

module.exports = UserSettings;
