// models/Broadcast.js
const mongoose = require('mongoose');

const buttonSchema = new mongoose.Schema({
  type: { type: String},
  url: { type: String },
  title: { type: String }
}, { _id: false })

const broadcastSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  scheduledAt: { type: Date },
  nameBroad: { type: String },
  sentAt: { type: Date },
  appAccessToken: { type: String, required: true },
  message: { type: String, required: true },
  buttons: [buttonSchema],
  pageIds: [{ type: String, required: true }],
  status: { type: String, enum: ['scheduled', 'sent', 'failed'], default: 'scheduled' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  send: { type: Number},
  delivered: { type: Number},
  notDelivered: { type: Number},
});

const Broadcast = mongoose.model('Broadcast', broadcastSchema);

module.exports = Broadcast;
