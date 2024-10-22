import sqlite3 from 'sqlite3';
import fs from 'fs';

// Create data directory if not exists
if (!fs.existsSync('./data')) {
    fs.mkdirSync('./data');
}

const db = new sqlite3.Database('./data/database.db', (err) => {
    if (err) {
        console.error(err.message);
        throw err;
    }
    console.log('Connected to the database.');
});

// Create codes table if not exists
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS codes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        evaluation TEXT NOT NULL,
        code TEXT NOT NULL UNIQUE
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS evaluations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT NOT NULL,
        data JSON NOT NULL,
        version INTEGER NOT NULL
    )`);
});

export default db;