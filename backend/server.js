const express = require('express');
const bodyParser = require('body-parser');
const connectDB = require('./Db.js');
require('dotenv').config();
const clientRequestRoutes = require('./routes/clientRequestRoutes.js');

// init server
const app = express()

// middlewares
app.use(bodyParser.json())
app.use(express.urlencoded({ extended: true }));

//  routes  
app.use('/api', clientRequestRoutes)

// database
connectDB();

// server
const PORT = process.env.PORT || 6969;

app.listen(PORT, () => {
    console.log(`server listening on http://localhost:${PORT}`)
})
