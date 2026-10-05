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

async function getSessionById(sessionId, userId) {
    try{
        const query = `
            SELECT * FROM sessions
            WHERE id = $1 AND user_id = $2
        `;
        const values = [sessionId, userId];

        const result = await db.query(query, values);
        return result.rows[0];
    }
    catch (error) {
        console.error("Error fetching session:", error);
        throw error;
    }
}

async function updateSessionRefreshToken(sessionId, newRefreshTokenHash) {
    try{
        const query = `
            UPDATE sessions
            SET refresh_token_hash = $1
            WHERE id = $2
            RETURNING *;
        `;
        const values = [newRefreshTokenHash, sessionId];

        const result = await db.query(query, values);
        return result.rows[0];
    }
    catch (error) {
        console.error("Error updating session refresh token:", error);
        throw error;
    }
}

module.exports = {
    createSession,
    getSessionById,
    updateSessionRefreshToken
};