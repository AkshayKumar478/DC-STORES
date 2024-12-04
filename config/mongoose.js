const mongoose = require('mongoose');
require('dotenv').config();

const dbURI = process.env.MONGO_URI;

mongoose.connect(dbURI)
  .then(() => console.log('Connected to MongoDB Atlas'))
  .catch(err => console.log('Error connecting to MongoDB Atlas:', err));