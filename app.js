const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();
const connectDB = require('./config/db');
const cron = require('node-cron');
const Broadcast = require('./models/Broadcast');
const facebookService = require('./services/facebookService.js');

// Conectar ao MongoDB
connectDB();

const app = express();
app.use(bodyParser.json({limit: '50mb'}));
app.use(cors());

const indexRoutes = require('./routes/index');
app.use('/', indexRoutes);

const PORT = process.env.PORT || 3030;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);

    cron.schedule('* * * * *', async () => {
        const now = new Date();
        const startOfMinute = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), now.getMinutes());
        try {
          const broadcasts = await Broadcast.find({
            scheduledAt: startOfMinute
          });
          broadcasts?.map(async (broad)=>{
            await facebookService.sendBroadcastToPages(broad.pageIds, broad.message, broad.buttons, broad.appAccessToken, null, broad.userId, true);
          })
        } catch (error) {
          console.error('Error fetching broadcasts:', error);
        }
    });
});
