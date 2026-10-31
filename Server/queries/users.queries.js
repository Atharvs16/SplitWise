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

async function isAvailable(username) {
    const result = await db.query(
        "SELECT id FROM users WHERE username = $1",
        [username]
    );

    return result.rows.length === 0;
}

async function getUserById(userId) {
    const result = await db.query(`
        SELECT id, name, username, phone FROM users WHERE id = $1;
    `,[userId]);
    return result.rows[0];
}

async function getUserPasswordHash(userId) {
    const result = await db.query(
        "SELECT password_hash FROM users WHERE id = $1::uuid",
        [userId]
    );
    return result.rows[0]?.password_hash;
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

async function getProfile(viewerId, username) {
    const userResult = await db.query(`
        SELECT
            u.id,
            u.name,
            u.username,
            CASE WHEN u.id = $1::uuid THEN u.phone ELSE NULL END AS phone,
            u.id = $1::uuid AS is_self,
            CASE
                WHEN u.id = $1::uuid THEN 'self'
                WHEN f.status = 'accepted' THEN 'friends'
                WHEN f.status = 'pending' AND f.sender_id = $1::uuid THEN 'request_sent'
                WHEN f.status = 'pending' AND f.receiver_id = $1::uuid THEN 'request_received'
                ELSE 'none'
            END AS friendship_status,
            CASE
                WHEN f.status = 'pending' AND f.receiver_id = $1::uuid THEN f.id
                ELSE NULL
            END AS friend_request_id
        FROM users u
        LEFT JOIN friends f
            ON (f.sender_id = $1::uuid AND f.receiver_id = u.id)
            OR (f.sender_id = u.id AND f.receiver_id = $1::uuid)
        WHERE LOWER(u.username) = LOWER($2)
        LIMIT 1
    `, [viewerId, username]);

    const profile = userResult.rows[0];
    if (!profile || profile.is_self || profile.friendship_status !== "friends") {
        return {
            profile,
            balances: null,
            mutualGroups: []
        };
    }

    const balanceResult = await db.query(`
        SELECT COALESCE(SUM(balance), 0)::text AS net_balance
        FROM (
            SELECT
                CASE
                    WHEN e.paid_by = $1::uuid AND s.user_id = $2::uuid THEN s.amount
                    WHEN e.paid_by = $2::uuid AND s.user_id = $1::uuid THEN -s.amount
                    ELSE 0
                END AS balance
            FROM expenses e
            JOIN expense_splits s ON s.expense_id = e.id
            WHERE e.group_id IS NULL
              AND e.paid_by <> s.user_id
              AND (
                  (e.paid_by = $1::uuid AND s.user_id = $2::uuid)
                  OR (e.paid_by = $2::uuid AND s.user_id = $1::uuid)
              )

            UNION ALL

            SELECT
                CASE
                    WHEN paid_by = $1::uuid THEN amount
                    ELSE -amount
                END AS balance
            FROM settlements
            WHERE group_id IS NULL
              AND status = 'accepted'
              AND (
                  (paid_by = $1::uuid AND paid_to = $2::uuid)
                  OR (paid_by = $2::uuid AND paid_to = $1::uuid)
              )
        ) friend_balance
    `, [viewerId, profile.id]);

    const groupsResult = await db.query(`
        SELECT g.id, g.name
        FROM groups g
        JOIN group_members viewer_member ON viewer_member.group_id = g.id
        JOIN group_members profile_member ON profile_member.group_id = g.id
        WHERE viewer_member.user_id = $1::uuid
          AND profile_member.user_id = $2::uuid
        ORDER BY g.name
    `, [viewerId, profile.id]);

    const netBalance = Number(balanceResult.rows[0].net_balance);
    return {
        profile,
        balances: {
            incoming: Math.max(netBalance, 0),
            outgoing: Math.max(-netBalance, 0)
        },
        mutualGroups: groupsResult.rows
    };
}

async function updateUserProfile(userId, { name, phone, passwordHash }) {
    const result = await db.query(`
        UPDATE users
        SET name = $2,
            phone = $3,
            password_hash = COALESCE($4, password_hash)
        WHERE id = $1::uuid
        RETURNING id, name, username, phone
    `, [userId, name, phone, passwordHash || null]);

    return result.rows[0];
}

async function anonymizeUser(userId, passwordHash) {
    const client = await db.connect();
    try {
        await client.query("BEGIN");
        const result = await client.query(`
            UPDATE users
            SET name = 'Deleted user',
                username = 'deleted_' || SUBSTRING(REPLACE(id::text, '-', '') FROM 1 FOR 12),
                phone = '6' || LPAD(RIGHT(REGEXP_REPLACE(id::text, '[^0-9]', '', 'g'), 9), 9, '0'),
                password_hash = $2
            WHERE id = $1::uuid
            RETURNING id
        `, [userId, passwordHash]);

        if (result.rowCount === 0) {
            throw new Error("User account no longer exists.");
        }

        await client.query(
            "UPDATE sessions SET revoked = TRUE WHERE user_id = $1::uuid",
            [userId]
        );
        await client.query("COMMIT");
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
}

async function userLoggedIn( accessToken) {
    try {
        const decoded = jwt.verify(accessToken, config.JWT_SECRET);
        const isrevoked = await getSessionById(decoded.sessionId, decoded.userId);
        if (isrevoked.revoked) {
            throw new Error("Session is revoked");
        }
        return decoded;
    } catch (error) {
        console.error(error);
        throw error;
    }
}


module.exports = {
    createUser,
    isAvailable,
    getUserById,
    getUserPasswordHash,
    getUserByUsername,
    getUserByPhone,
    getProfile,
    updateUserProfile,
    anonymizeUser
};