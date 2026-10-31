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

async function removeGroupMember(groupId, adminId, memberId) {
    const client = await db.connect();
    try {
        await client.query("BEGIN");

        const groupResult = await client.query(
            `SELECT created_by
             FROM groups
             WHERE id = $1::uuid
             FOR UPDATE`,
            [groupId]
        );
        if (groupResult.rowCount === 0) {
            const error = new Error("Group not found.");
            error.statusCode = 404;
            throw error;
        }
        if (String(groupResult.rows[0].created_by).toLowerCase() !== String(adminId).toLowerCase()) {
            const error = new Error("Only the group admin can remove members.");
            error.statusCode = 403;
            throw error;
        }
        if (String(groupResult.rows[0].created_by).toLowerCase() === String(memberId).toLowerCase()) {
            const error = new Error("The group admin cannot be removed.");
            error.statusCode = 400;
            throw error;
        }

        const result = await client.query(
            `DELETE FROM group_members
             WHERE group_id = $1::uuid AND user_id = $2::uuid
             RETURNING user_id`,
            [groupId, memberId]
        );
        if (result.rowCount === 0) {
            const error = new Error("Group member not found.");
            error.statusCode = 404;
            throw error;
        }

        await client.query("COMMIT");
        return { userId: result.rows[0].user_id };
    } catch (error) {
        try {
            await client.query("ROLLBACK");
        } catch (rollbackError) {
            console.error("Failed to roll back group member removal:", rollbackError);
        }
        throw error;
    } finally {
        client.release();
    }
}

async function addGroupMember(groupId, userId, friendId) {
    const client = await db.connect();
    try {
        await client.query("BEGIN");

        const groupResult = await client.query(
            `SELECT id
             FROM groups
             WHERE id = $1::uuid
             FOR UPDATE`,
            [groupId]
        );
        if (groupResult.rowCount === 0) {
            const error = new Error("Group not found.");
            error.statusCode = 404;
            throw error;
        }

        const memberResult = await client.query(
            `SELECT 1 FROM group_members
             WHERE group_id = $1::uuid AND user_id = $2::uuid`,
            [groupId, userId]
        );
        if (memberResult.rowCount === 0) {
            const error = new Error("Only group members can add friends.");
            error.statusCode = 403;
            throw error;
        }
        if (String(userId).toLowerCase() === String(friendId).toLowerCase()) {
            const error = new Error("You cannot add yourself to the group.");
            error.statusCode = 400;
            throw error;
        }

        const friendshipResult = await client.query(
            `SELECT 1
             FROM friends
             WHERE status = 'accepted'
               AND (
                   (sender_id = $1::uuid AND receiver_id = $2::uuid)
                   OR (sender_id = $2::uuid AND receiver_id = $1::uuid)
               )
             LIMIT 1`,
            [userId, friendId]
        );
        if (friendshipResult.rowCount === 0) {
            const error = new Error("You can only add accepted friends to a group.");
            error.statusCode = 403;
            throw error;
        }

        const result = await client.query(
            `INSERT INTO group_members (group_id, user_id)
             VALUES ($1::uuid, $2::uuid)
             ON CONFLICT (group_id, user_id) DO NOTHING
             RETURNING user_id`,
            [groupId, friendId]
        );
        if (result.rowCount === 0) {
            const error = new Error("This friend is already a group member.");
            error.statusCode = 409;
            throw error;
        }

        await client.query("COMMIT");
        return { userId: result.rows[0].user_id };
    } catch (error) {
        try {
            await client.query("ROLLBACK");
        } catch (rollbackError) {
            console.error("Failed to roll back adding a group member:", rollbackError);
        }
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
    removeGroupMember,
    addGroupMember,
    getGroupsByUserId,
    getSessionById
};