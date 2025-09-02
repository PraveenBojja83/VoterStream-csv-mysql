const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const getConnection = require('../db/connection');

const csvFilePath = path.join(__dirname, '../data/voters.csv');

(async () => {
  const connection = await getConnection();
  const rows = [];

  fs.createReadStream(csvFilePath)
    .pipe(csv({ separator: ',', strict: true })) // ✅ Comma-separated fix
    .on('data', (data) => rows.push(data))
    .on('end', async () => {
      if (rows.length === 0) {
        console.log('⚠️ No data found in CSV');
        await connection.end();
        return;
      }

      const rawKeys = Object.keys(rows[0]);

      // Sanity check: header must split into multiple fields
      if (rawKeys.length === 1 && rawKeys[0].includes(',')) {
        console.error('❌ CSV header was not split correctly. Check delimiter.');
        await connection.end();
        return;
      }

      const keys = rawKeys.map(k => k.trim().replace(/\s+/g, '_'));
      console.log('🧪 Normalized keys:', keys);

      const insertQuery = `INSERT INTO voters (${keys.join(',')}) VALUES (${keys.map(() => '?').join(',')})`;

      let insertedCount = 0;
      let skippedCount = 0;

      for (const row of rows) {
        const values = keys.map(k => row[k] ?? null);

        if (values.length !== keys.length) {
          console.warn('⚠️ Skipping row due to mismatch:', values);
          skippedCount++;
          continue;
        }

        try {
          await connection.execute(insertQuery, values);
          insertedCount++;
        } catch (err) {
          console.warn('❌ Row insert failed:', err.message);
          skippedCount++;
        }
      }

      console.log(`✅ Inserted ${insertedCount} rows`);
      if (skippedCount > 0) {
        console.log(`⚠️ Skipped ${skippedCount} malformed rows`);
      }

      await connection.end();
      const timestamp = new Date().toLocaleString();
      console.log(`✅ Upload complete: ${insertedCount} rows inserted into 'voters' table at ${timestamp}`);
    })
    .on('error', (err) => {
      console.error('❌ CSV read error:', err.message);
    });
})();