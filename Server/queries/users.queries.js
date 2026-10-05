const db = require('../config/db');

async function createUser(name, phone, password_hash) {
    const query = `
        INSERT INTO users (name, phone, password_hash)
        VALUES ($1, $2, $3)
        RETURNING *;
    `;
    const values = [name, phone, password_hash];

    const result = await db.query(query, values);
    return result.rows[0];
};

async function getUserByPhone(phone) {
    const result = await db.query(`
        SELECT name, phone FROM users WHERE phone = $1;
    `,[phone]);
    return result.rows[0];
}

module.exports = {
    createUser,
    getUserByPhone
};