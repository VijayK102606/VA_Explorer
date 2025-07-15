const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const uploadRoutes = require('./routes/upload');
require('dotenv').config();

const app = express();
const EPORT = process.env.PORT || 4000;
const MONGOURL = process.env.MONGO_URL;
const REACTURL = process.env.REACT_URL;

app.use(cors({origin: REACTURL}));
app.use(express.json());

mongoose.connect(MONGOURL)
    .then(() => {
        console.log("mongodb connected");
        console.log("✅ Using database:", mongoose.connection.name);
    })
    .catch((err) => console.error("mongodb error:", err));

app.use('/api', uploadRoutes);

app.listen(EPORT, ()=> {
    console.log(`Address: http://localhost:${EPORT}`);
});