const db = require("../config/db");

function createHttpError(message, statusCode) {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
}

async function requireGroupMember(groupId, userId) {
    const result = await db.query(
        `SELECT 1 FROM group_members
         WHERE group_id = $1::uuid AND user_id = $2::uuid`,
        [groupId, userId]
    );
    if (result.rowCount === 0) {
        throw createHttpError("Group not found or user is not a member.", 404);
    }
}

async function createInvitation(userId, groupId, { invitedUserId, invitedPhone }) {
    await requireGroupMember(groupId, userId);

    let targetUserId = invitedUserId || null;
    let targetPhone = invitedPhone || null;
    if (invitedPhone) {
        const userResult = await db.query(
            `SELECT id FROM users WHERE phone = $1`,
            [invitedPhone]
        );
        targetUserId = userResult.rows[0]?.id || null;
    } else {
        const userResult = await db.query(
            `SELECT phone FROM users WHERE id = $1::uuid`,
            [targetUserId]
        );
        if (userResult.rowCount === 0) {
            throw createHttpError("Invited user not found.", 404);
        }
        targetPhone = userResult.rows[0].phone;
    }

    if (targetUserId === userId) {
        throw createHttpError("You cannot invite yourself to a group.", 400);
    }

    if (targetUserId) {
        const memberResult = await db.query(
            `SELECT 1 FROM group_members
             WHERE group_id = $1::uuid AND user_id = $2::uuid`,
            [groupId, targetUserId]
        );
        if (memberResult.rowCount > 0) {
            throw createHttpError("This user is already a group member.", 409);
        }
    }

    const duplicateResult = await db.query(
        `SELECT 1
         FROM group_invitations
         WHERE group_id = $1::uuid
           AND status = 'pending'
           AND expires_at > NOW()
           AND (
               ($2::uuid IS NOT NULL AND invited_user_id = $2::uuid)
               OR ($3::varchar IS NOT NULL AND invited_phone = $3)
           )
         LIMIT 1`,
        [groupId, targetUserId, targetPhone]
    );
    if (duplicateResult.rowCount > 0) {
        throw createHttpError("An active invitation already exists for this user.", 409);
    }

    const result = await db.query(
        `INSERT INTO group_invitations
             (group_id, invited_by, invited_user_id, invited_phone, status, expires_at)
         VALUES ($1::uuid, $2::uuid, $3::uuid, $4, 'pending', NOW() + INTERVAL '30 days')
         RETURNING id, group_id, invited_by, invited_user_id, invited_phone,
                   status, created_at, expires_at`,
        [groupId, userId, targetUserId, targetPhone]
    );
    return result.rows[0];
}

async function listIncomingInvitations(userId, phone) {
    const result = await db.query(
        `SELECT
             i.id,
             i.group_id,
             g.name AS group_name,
             i.invited_by,
             inviter.name AS inviter_name,
             i.status,
             i.created_at,
             i.expires_at
         FROM group_invitations i
         JOIN groups g ON g.id = i.group_id
         JOIN users inviter ON inviter.id = i.invited_by
         WHERE i.status = 'pending'
           AND i.expires_at > NOW()
           AND (
               i.invited_user_id = $1::uuid
               OR (i.invited_user_id IS NULL AND i.invited_phone = $2)
           )
         ORDER BY i.created_at DESC`,
        [userId, phone]
    );
    return result.rows;
}

async function listGroupInvitations(userId, groupId) {
    await requireGroupMember(groupId, userId);
    const result = await db.query(
        `SELECT
             i.id,
             i.group_id,
             i.invited_by,
             inviter.name AS inviter_name,
             i.invited_user_id,
             invitee.name AS invitee_name,
             i.invited_phone,
             i.status,
             i.created_at,
             i.expires_at
         FROM group_invitations i
         JOIN users inviter ON inviter.id = i.invited_by
         LEFT JOIN users invitee ON invitee.id = i.invited_user_id
         WHERE i.group_id = $1::uuid
         ORDER BY i.created_at DESC`,
        [groupId]
    );
    return result.rows;
}

async function respondToInvitation(userId, phone, invitationId, action) {
    const client = await db.connect();
    try {
        await client.query("BEGIN");
        const invitationResult = await client.query(
            `SELECT id, group_id, invited_user_id, invited_phone, status, expires_at
             FROM group_invitations
             WHERE id = $1::uuid
               AND status = 'pending'
               AND expires_at > NOW()
               AND (
                   invited_user_id = $2::uuid
                   OR (invited_user_id IS NULL AND invited_phone = $3)
               )
             FOR UPDATE`,
            [invitationId, userId, phone]
        );
        if (invitationResult.rowCount === 0) {
            throw createHttpError("Pending group invitation not found or expired.", 404);
        }
        const invitation = invitationResult.rows[0];

        const updateResult = await client.query(
            `UPDATE group_invitations
             SET status = $1
             WHERE id = $2::uuid AND status = 'pending'
             RETURNING id, group_id, invited_by, invited_user_id, invited_phone,
                       status, created_at, expires_at`,
            [action === "accept" ? "accepted" : "rejected", invitationId]
        );

        if (action === "accept") {
            await client.query(
                `INSERT INTO group_members (group_id, user_id)
                 VALUES ($1::uuid, $2::uuid)
                 ON CONFLICT (group_id, user_id) DO NOTHING`,
                [invitation.group_id, userId]
            );
        }

        await client.query("COMMIT");
        return updateResult.rows[0];
    } catch (error) {
        try {
            await client.query("ROLLBACK");
        } catch (rollbackError) {
            console.error("Failed to roll back group invitation transaction:", rollbackError);
        }
        throw error;
    } finally {
        client.release();
    }
}

module.exports = {
    createInvitation,
    listIncomingInvitations,
    listGroupInvitations,
    respondToInvitation
};
