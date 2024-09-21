const mongoose = require('mongoose');

const stripeSessionSchema = new mongoose.Schema({
  id: { type: String },
  object: { type: String },
  api_version: { type: String },
  created: { type: Number },
  data: {
    object: {
      id: { type: String },
      object: { type: String },
      amount_subtotal: { type: Number },
      amount_total: { type: Number },
      currency: { type: String },
      customer: { type: String },
      customer_creation: { type: String },
      customer_email: { type: String },
      status: { type: String },
      subscription: { type: String },
      payment_status: { type: String },
      invoice: { type: String },
      success_url: { type: String },
      metadata: {
        userId: { type: String },
      },
      created: { type: Number },
      mode: { type: String },
    },
  },
  livemode: { type: Boolean },
  pending_webhooks: { type: Number },
  request: {
    id: { type: String },
    idempotency_key: { type: String },
  },
  type: { type: String },
});

const StripeSession = mongoose.model('StripeSession', stripeSessionSchema);

module.exports = StripeSession;
