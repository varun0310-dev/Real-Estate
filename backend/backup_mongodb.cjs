/**
 * MongoDB Backup Script
 * Exports all collections from the 'realestate' database as JSON files.
 * Each collection is saved as a separate .json file in the backup directory.
 */
const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

const MONGO_URI = 'mongodb://127.0.0.1:27017';
const DB_NAME = 'realestate';
const BACKUP_DIR = path.join(__dirname, '..', 'mongodb_backup');

async function backup() {
    console.log('Connecting to MongoDB...');
    const client = new MongoClient(MONGO_URI);

    try {
        await client.connect();
        const db = client.db(DB_NAME);

        // Create backup directory
        if (!fs.existsSync(BACKUP_DIR)) {
            fs.mkdirSync(BACKUP_DIR, { recursive: true });
        }

        // Get all collection names
        const collections = await db.listCollections().toArray();
        console.log(`Found ${collections.length} collections in '${DB_NAME}':\n`);

        let totalDocs = 0;

        for (const collInfo of collections) {
            const name = collInfo.name;
            const collection = db.collection(name);
            const docs = await collection.find({}).toArray();
            const filePath = path.join(BACKUP_DIR, `${name}.json`);

            fs.writeFileSync(filePath, JSON.stringify(docs, null, 2), 'utf-8');
            console.log(`   OK  ${name} -- ${docs.length} documents -> ${name}.json`);
            totalDocs += docs.length;
        }

        console.log(`\nBackup complete! ${totalDocs} total documents across ${collections.length} collections.`);
        console.log(`Saved to: ${BACKUP_DIR}`);
    } catch (err) {
        console.error('Backup failed:', err.message);
    } finally {
        await client.close();
    }
}

backup();
