// connection.js
const mysql = require('mysql2/promise');

const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: 'XXXXXXXXXXXXXXX',
  database: 'praveen_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};
module.exports = async () => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    console.log('✅ MySQL connection established');
    return connection;
  } catch (err) {
    console.error('❌ DB connection failed:', err.message);
    process.exit(1);
  }
};

