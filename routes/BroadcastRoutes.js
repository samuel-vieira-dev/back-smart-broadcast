
const express = require('express');
const BroadcastController = require('../controllers/BroadcastController');

const router = express.Router();

router.post('/send', BroadcastController.sendBroadcast);

module.exports = router;
