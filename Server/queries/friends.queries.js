const db = require('../config/db');

async function searchByUsername(id,username) {
    try {
        console.log(id);
        console.log(username);
        const query = `
SELECT
    u.id,
    u.username,
    u.name,
    CASE
        WHEN fr.status = 'accepted'
            THEN 'friends'
        WHEN fr.status = 'pending'
             AND fr.sender_id = $1::UUID
            THEN 'request_sent'
        WHEN fr.status = 'pending'
             AND fr.receiver_id = $1::UUID
            THEN 'request_received'
        ELSE 'none'
    END AS friendship_status
FROM users u
LEFT JOIN friends fr
    ON (
        (fr.sender_id = $1::UUID AND fr.receiver_id = u.id)
        OR
        (fr.sender_id = u.id AND fr.receiver_id = $1::UUID)
    )
WHERE u.id <> $1::UUID
  AND (
      u.username ILIKE '%' || $2 || '%'
      OR u.name ILIKE '%' || $2 || '%'
  )
ORDER BY u.username
LIMIT 20;
`;

        const result = await db.query(query, [id,username]);
        console.log(result.rows)

        return result.rows;
    }
    catch (error) {
        console.error(error);
        throw error;
    }
}
async function searchByPhone(phone) {
    try {
        const query = `SELECT name,username FROM users WHERE phone=$1;`;
        const result = await db.query(query, [phone]);

        return result.rows;

        //return {message: "No user found!"}
    }
    catch (error) {
        console.error(error);
        throw error;
    }
}

module.exports = {
    searchByPhone,
    searchByUsername
}