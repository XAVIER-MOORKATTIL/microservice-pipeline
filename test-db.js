require('dotenv').config();
const mongoose = require('mongoose');
const dns = require('dns');

// Force IPv4 resolution to prevent DNS SRV lookup timeouts
dns.setDefaultResultOrder('ipv4first');

console.log('Testing connection with IPv4 forced...');

mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000 })
  .then(() => {
    console.log('✅ SUCCESS: Connected to MongoDB Atlas Cloud Cluster!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ STILL FAILED:', err.message);
    process.exit(1);
  });