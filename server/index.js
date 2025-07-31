const express = require('express');
const cors = require('cors');
const uploadRoutes = require('./routes/upload');
require('dotenv').config();

const app = express();
const EPORT = process.env.PORT || 4000;
const REACTURL = process.env.REACT_URL;

app.use(cors({origin: REACTURL}));
app.use(express.json());

app.use('/api', uploadRoutes);

app.listen(EPORT, ()=> {
    console.log(`Address: http://localhost:${EPORT}`);
});