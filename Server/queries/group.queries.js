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
    try {
        await db.query('BEGIN'); // Start transaction
        const query = `
            INSERT INTO groups (name, description, created_by)
            VALUES ($1, $2, $3)
            RETURNING *;
        `;
        const values = [name, description, created_by];
        const result = await db.query(query, values);
        const group =  result.rows[0];

        await addmemberToGroup(group.id, created_by); // Add creator as a member of the group

        await db.query('COMMIT'); // Commit transaction
        return group;

    } catch (error) {
        await db.query('ROLLBACK'); // Rollback transaction in case of error
        console.error(error);
        throw new Error("Database error");
    }
}

async function getGroupsByUserId(user_id) {
    try {
        const query = `
            SELECT g.id, g.name, g.description, g.created_by
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