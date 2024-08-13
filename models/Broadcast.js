// models/Broadcast.js
const mongoose = require('mongoose');

const buttonSchema = new mongoose.Schema({
  type: { type: String, required: true },
  url: { type: String },
  title: { type: String }
}, { _id: false })

const broadcastSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  scheduledAt: { type: Date },
  sentAt: { type: Date },
  appAccessToken: { type: String, required: true },
  message: { type: String, required: true },
  buttons: [buttonSchema],
  pageIds: [{ type: String, required: true }],
  status: { type: String, enum: ['scheduled', 'sent', 'failed'], default: 'scheduled' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Broadcast = mongoose.model('Broadcast', broadcastSchema);

module.exports = Broadcast;
