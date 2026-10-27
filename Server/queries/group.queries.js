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

async function createGroup(name, description, created_by) {
    const client = await db.connect();
    try {
        await client.query('BEGIN');
        const query = `
            INSERT INTO groups (name, description, created_by)
            VALUES ($1, $2, $3)
            RETURNING *;
        `;
        const values = [name, description, created_by];
        const result = await client.query(query, values);
        const group =  result.rows[0];

        await client.query(
            `INSERT INTO group_members (group_id, user_id)
             VALUES ($1::uuid, $2::uuid)`,
            [group.id, created_by]
        );

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