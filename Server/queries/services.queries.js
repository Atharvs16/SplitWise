const db = require('../config/db');

async function createSession(user_id, refresh_token_hash, ip, user_agent) {
    try{
        const query = `
            INSERT INTO sessions (user_id, refresh_token_hash, ip, user_agent)
            VALUES ($1, $2, $3, $4)
            RETURNING *;
        `;
        const values = [user_id, refresh_token_hash, ip, user_agent];

    
        const result = await db.query(query, values);
        return result.rows[0];
    }
    catch (error) {
        console.error("Error creating session:", error);
        throw error;
    }
}

module.exports = {
    createSession
};