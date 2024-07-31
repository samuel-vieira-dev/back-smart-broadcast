const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(bodyParser.json());
app.use(cors());

const indexRoutes = require('./routes/index');
app.use('/', indexRoutes);

const PORT = process.env.PORT || 3030;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    // setInterval(() => {
    //     const memoryUsage = process.memoryUsage();
    //     console.log(`Memory Usage: RSS = ${memoryUsage.rss}, Heap Total = ${memoryUsage.heapTotal}, Heap Used = ${memoryUsage.heapUsed}`);
    // }, 10000);
});
