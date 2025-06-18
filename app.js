const express = require('express');
const path = require('path');
const dotenv = require('dotenv');

// Load env vars
dotenv.config();

const app = express();
const db = require('./config/db');
const passport = require('passport');

// Body parser
app.use(express.json());
app.use(passport.initialize());

// Mount routers
app.use('/api', require('./routes'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const PORT = process.env.PORT || 5000;

db.createTables().then(() => {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});
