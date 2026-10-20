const db = require('../config/db');

async function createUser(name, phone, username, password_hash) {
    const query = `
        INSERT INTO users (name, phone, username, password_hash)
        VALUES ($1, $2, $3, $4)
        RETURNING *;
    `;
    const values = [name, phone, username, password_hash];

    const result = await db.query(query, values);
    return result.rows[0];
};

async function getUserById(userId) {
    const result = await db.query(`
        SELECT name, username, phone FROM users WHERE id = $1;
    `,[userId]);
    return result.rows[0];
}

async function getUserByUsername(username) {
    const result = await db.query(`
        SELECT id, name, username, phone, password_hash FROM users WHERE username = $1;
    `,[username]);

    return result.rows[0];
}
async function getUserByPhone(phone) {
    const result = await db.query(`
        SELECT id, name, username, phone, password_hash FROM users WHERE phone = $1;
    `,[phone]);

    return result.rows[0];
}


module.exports = {
    createUser,
    getUserById,
    getUserByUsername,
    getUserByPhone
};