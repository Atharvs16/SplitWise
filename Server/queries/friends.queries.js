const db = require('../config/db');

async function searchByUsername(id, username) {
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

        const result = await db.query(query, [id, username]);

        return result.rows;
    }
    catch (error) {
        console.error(error);
        throw error;
    }
}

async function searchByPhone(id, phone) {
    try {
        const query = `
            SELECT
                u.id,
                u.username,
                u.name,
                CASE
                    WHEN fr.status = 'accepted' THEN 'friends'
                    WHEN fr.status = 'pending' AND fr.sender_id = $1::uuid THEN 'request_sent'
                    WHEN fr.status = 'pending' AND fr.receiver_id = $1::uuid THEN 'request_received'
                    ELSE 'none'
                END AS friendship_status
            FROM users u
            LEFT JOIN friends fr
                ON (fr.sender_id = $1::uuid AND fr.receiver_id = u.id)
                OR (fr.sender_id = u.id AND fr.receiver_id = $1::uuid)
            WHERE u.id <> $1::uuid AND u.phone = $2
            LIMIT 1
        `;
        const result = await db.query(query, [id, phone]);

        return result.rows;
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
            ON CONFLICT (
                LEAST(sender_id, receiver_id),
                GREATEST(sender_id, receiver_id)
            )
            DO UPDATE SET
                sender_id = EXCLUDED.sender_id,
                receiver_id = EXCLUDED.receiver_id,
                status = 'pending'
            WHERE friends.status = 'rejected'
            RETURNING *;
        `;

        const result = await db.query(query, [senderId, receiverId]);

        if (result.rows.length === 0) {
            return {
                success: false,
                message: "Friend request already exists or cannot be sent."
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

async function getRequests(userId) {
    try {
        const query = `SELECT
    f.id AS request_id,
    f.sender_id,
    u.username,
    u.name,
    f.created_at
FROM friends f
JOIN users u
    ON f.sender_id = u.id
WHERE f.receiver_id = $1
  AND f.status = 'pending'
ORDER BY f.created_at DESC;`;
        const result = await db.query(query, [userId]);

        return result;
    }
    catch (error) {
        console.log(error);
        throw error;
    }
}

async function changeFriendStatus(requestId, receiverId, action) {

    if (!["accept", "reject"].includes(action)) {
        const error = new Error("Invalid friend request action.");
        error.statusCode = 400;
        throw error;
    }

    const result = await db.query(
        `UPDATE friends
SET
    status = CASE
        WHEN $1 = 'accept' THEN 'accepted'
        WHEN $1 = 'reject' THEN 'rejected'
    END,
    updated_at = NOW()
WHERE
    id = $2
    AND receiver_id = $3
    AND status = 'pending'
RETURNING *;`,
        [action, requestId, receiverId]
    );

    if (result.rowCount === 0) {
        return {
            message: "Friend request not found or already processed"
        };
    }

    return {
        message: `Friend request ${action}ed successfully`,
        friendRequest: result.rows[0]
    };
}

async function getFriendsWithExpenses(userId) {
    try{
        const query = `WITH my_friends AS (
    SELECT
        CASE
            WHEN sender_id = $1::uuid THEN receiver_id
            ELSE sender_id
        END AS friend_id
    FROM friends
    WHERE (sender_id = $1::uuid OR receiver_id = $1::uuid)
      AND status = 'accepted'
),

expense_balances AS (
    SELECT
        e.paid_by AS creditor_id,
        s.user_id AS debtor_id,
        s.amount
    FROM expenses e
    JOIN expense_splits s ON s.expense_id = e.id
    WHERE e.paid_by <> s.user_id
      AND e.group_id IS NULL
),

net_balances AS (
    SELECT
        mf.friend_id,
        COALESCE(SUM(
            CASE
                WHEN eb.creditor_id = $1::uuid
                    AND eb.debtor_id = mf.friend_id
                    THEN eb.amount

                WHEN eb.creditor_id = mf.friend_id
                    AND eb.debtor_id = $1::uuid
                    THEN -eb.amount

                ELSE 0
            END
        ), 0) AS net_balance
    FROM my_friends mf
    LEFT JOIN expense_balances eb
        ON (
            eb.creditor_id = $1::uuid
            AND eb.debtor_id = mf.friend_id
        )
        OR (
            eb.creditor_id = mf.friend_id
            AND eb.debtor_id = $1::uuid
        )
    GROUP BY mf.friend_id
),

settlement_balances AS (
    SELECT
        mf.friend_id,
        COALESCE(SUM(
            CASE
                WHEN st.paid_by = $1::uuid
                    AND st.paid_to = mf.friend_id
                    THEN st.amount

                WHEN st.paid_by = mf.friend_id
                    AND st.paid_to = $1::uuid
                    THEN -st.amount

                ELSE 0
            END
        ), 0) AS settlement_adjustment
    FROM my_friends mf
    LEFT JOIN settlements st
        ON (
            (
                st.paid_by = $1::uuid
                AND st.paid_to = mf.friend_id
            )
            OR (
                st.paid_by = mf.friend_id
                AND st.paid_to = $1::uuid
            )
        )
        AND st.group_id IS NULL
        AND st.status = 'accepted'
    GROUP BY mf.friend_id
)

SELECT
    u.id AS friend_id,
    u.name AS friend_name,
    u.username,
    CASE
        WHEN nb.net_balance + sb.settlement_adjustment > 0
            THEN 'Owes you'
        WHEN nb.net_balance + sb.settlement_adjustment < 0
            THEN 'You owe'
        ELSE 'Settled'
    END AS status,
    ABS(nb.net_balance + sb.settlement_adjustment) AS amount
FROM net_balances nb
JOIN users u ON u.id = nb.friend_id
JOIN settlement_balances sb ON sb.friend_id = nb.friend_id
ORDER BY amount DESC;`

        const result = await db.query(query, [userId]);

        return result.rows;
    }

    catch(error){
        console.log(error);
        throw error;
    }
}


module.exports = {
    searchByPhone,
    searchByUsername,
    addFriend,
    getRequests,
    changeFriendStatus,
    getFriendsWithExpenses
}