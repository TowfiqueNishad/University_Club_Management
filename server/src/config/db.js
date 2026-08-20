const mongoose = require('mongoose');

let mongod = null;

const connectDB = async () => {
  const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/university_club_management';

  try {
    const conn = await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 3000,
    });
    console.log(`[MongoDB Connected]: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.warn(`[MongoDB Warning]: Local MongoDB connection failed (${error.message}).`);
    console.log(`[MongoDB]: Attempting fallback to Embedded In-Memory MongoDB Server...`);

    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      mongod = await MongoMemoryServer.create();
      const uri = mongod.getUri();
      const conn = await mongoose.connect(uri);
      console.log(`[Embedded MongoDB Connected]: In-Memory instance running at ${uri}`);

      // Auto seed memory database
      const { seedDataDirect } = require('../utils/seeder');
      if (seedDataDirect) {
        await seedDataDirect();
      }
      return conn;
    } catch (memErr) {
      console.error(`[MongoDB Error]: Could not start embedded MongoDB: ${memErr.message}`);
      console.info(`Tip: Set MONGO_URI in server/.env or start MongoDB locally.`);
    }
  }
};

module.exports = connectDB;
