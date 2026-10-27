const db = require('../config/db');

async function addmemberToGroup(group_id, user_id) {
    try {
        const query = `
            INSERT INTO group_members (group_id, user_id)
            VALUES ($1, $2)
            RETURNING *;
        `;
        const values = [group_id, user_id];
        const result = await db.query(query, values);
        return result.rows[0];
    } catch (error) {
        console.error(error);
        throw error;
    }
}

async function createGroup(name, description, created_by, memberIds = []) {
    const client = await db.connect();
    try {
        await client.query('BEGIN');
        const uniqueMemberIds = [...new Set(memberIds)];
        if (uniqueMemberIds.length > 0) {
            const friendsResult = await client.query(
                `SELECT CASE
                            WHEN sender_id = $1::uuid THEN receiver_id
                            ELSE sender_id
                        END AS friend_id
                 FROM friends
                 WHERE status = 'accepted'
                   AND (
                       (sender_id = $1::uuid AND receiver_id = ANY($2::uuid[]))
                       OR (receiver_id = $1::uuid AND sender_id = ANY($2::uuid[]))
                   )`,
                [created_by, uniqueMemberIds]
            );
            const acceptedFriendIds = new Set(
                friendsResult.rows.map(({ friend_id }) => friend_id)
            );
            if (uniqueMemberIds.some(memberId => !acceptedFriendIds.has(memberId))) {
                const error = new Error("Groups can only include your accepted friends.");
                error.statusCode = 400;
                throw error;
            }
        }

        const query = `
            INSERT INTO groups (name, description, created_by)
            VALUES ($1, $2, $3)
            RETURNING *;
        `;
        const values = [name, description, created_by];
        const result = await client.query(query, values);
        const group =  result.rows[0];

        for (const userId of [created_by, ...uniqueMemberIds]) {
            await client.query(
                `INSERT INTO group_members (group_id, user_id)
                 VALUES ($1::uuid, $2::uuid)`,
                [group.id, userId]
            );
        }

        await client.query('COMMIT');
        return group;

    } catch (error) {
        await client.query('ROLLBACK');
        console.error(error);
        throw error;
    } finally {
        client.release();
    }
}

async function getGroupsByUserId(user_id) {
    try {
        const query = `
            SELECT
                g.id,
                g.name,
                g.description,
                g.created_by,
                (SELECT COUNT(*) FROM group_members group_member_count
                 WHERE group_member_count.group_id = g.id) AS member_count,
                COALESCE((
                    SELECT SUM(
                        CASE
                            WHEN e.paid_by = gm.user_id AND s.user_id <> gm.user_id THEN s.amount
                            WHEN s.user_id = gm.user_id AND e.paid_by <> gm.user_id THEN -s.amount
                            ELSE 0
                        END
                    )
                    FROM expenses e
                    LEFT JOIN expense_splits s ON s.expense_id = e.id
                    WHERE e.group_id = g.id
                ), 0) + COALESCE((
                    SELECT SUM(
                        CASE
                            WHEN st.paid_by = gm.user_id THEN st.amount
                            WHEN st.paid_to = gm.user_id THEN -st.amount
                            ELSE 0
                        END
                    )
                    FROM settlements st
                    WHERE st.group_id = g.id
                      AND st.status = 'accepted'
                ), 0) AS net_balance
            FROM groups g
            JOIN group_members gm ON g.id = gm.group_id
            WHERE gm.user_id = $1
            ORDER BY g.created_at DESC
        `;
        const values = [user_id];
        const result = await db.query(query, values);
        return result.rows;
    } catch (error) {
        console.error(error);
        throw new Error("Database error");
    }
}

async function getSessionById(sessionId, userId) {
    try {
        const query = `
            SELECT * FROM sessions
            WHERE id = $1 AND user_id = $2
        `;
        const values = [sessionId, userId];
        const result = await db.query(query, values);
        return result.rows[0];
    } catch (error) {
        console.error("Error fetching session:", error);
        throw error;
    }
}

module.exports = {
    createGroup,
    getGroupsByUserId,
    getSessionById
};