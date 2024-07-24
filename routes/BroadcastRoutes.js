
const express = require('express');
const BroadcastController = require('../controllers/broadcastController.js');

const router = express.Router();

router.post('/send', BroadcastController.sendBroadcast);

module.exports = router;
