const db = require('../config/db');

async function searchByUsername(id,username) {
    try {
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

async function addFriend(senderId, receiverId) {
    try {
        const query = `
            INSERT INTO friends (sender_id, receiver_id, status)
            VALUES ($1::UUID, $2::UUID, 'pending')
            ON CONFLICT DO NOTHING
            RETURNING *;
        `;

        const result = await db.query(query, [senderId, receiverId]);

        if (result.rows.length === 0) {
            return {
                success: false,
                message: "Friend request already exists."
            };
        }

        return {
            success: true,
            message: "Friend request sent successfully.",
            friendship: result.rows[0]
        };
    } catch (error) {
        console.error("Error sending friend request:", error);
        throw error;
    }
}


module.exports = {
    searchByPhone,
    searchByUsername,
    addFriend
}