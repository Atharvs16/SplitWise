const db = require("../config/db");

function createHttpError(message, statusCode) {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
}

async function withTransaction(callback) {
    const client = await db.connect();
    try {
        await client.query("BEGIN");
        const result = await callback(client);
        await client.query("COMMIT");
        return result;
    } catch (error) {
        try {
            await client.query("ROLLBACK");
        } catch (rollbackError) {
            console.error("Failed to roll back friend expense transaction:", rollbackError);
        }
        throw error;
    } finally {
        client.release();
    }
}

async function assertAcceptedFriend(queryable, userId, friendId) {
    if (userId === friendId) {
        throw createHttpError("You cannot create a friend expense with yourself.", 400);
    }

    const result = await queryable.query(
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

    if (result.rowCount === 0) {
        throw createHttpError("An accepted friendship is required.", 403);
    }
}

async function createExpense(userId, friendId, expense) {
    return withTransaction(async client => {
        await assertAcceptedFriend(client, userId, friendId);

        let friendAmount;
        if (expense.split.type === "half") {
            friendAmount = Math.floor(expense.amount / 2);
        } else if (expense.split.type === "amount") {
            friendAmount = expense.split.friendAmount;
            if (friendAmount > expense.amount) {
                throw createHttpError("Friend's share cannot exceed the expense amount.", 400);
            }
        } else {
            friendAmount = Math.round(expense.amount * expense.split.friendPercentage / 100);
        }

        const ownAmount = expense.amount - friendAmount;
        const insertedExpense = await client.query(
            `INSERT INTO expenses (group_id, paid_by, amount, description)
             VALUES (NULL, $1::uuid, $2, $3)
             RETURNING id, group_id, paid_by, amount, description, created_at, updated_at`,
            [userId, expense.amount, expense.description]
        );
        const row = insertedExpense.rows[0];

        await client.query(
            `INSERT INTO expense_splits (expense_id, user_id, amount)
             VALUES ($1::uuid, $2::uuid, $3), ($1::uuid, $4::uuid, $5)`,
            [row.id, userId, ownAmount, friendId, friendAmount]
        );

        return {
            ...row,
            splits: [
                { user_id: userId, amount: String(ownAmount) },
                { user_id: friendId, amount: String(friendAmount) }
            ]
        };
    });
}

async function listExpenses(userId, friendId) {
    await assertAcceptedFriend(db, userId, friendId);
    const result = await db.query(
        `SELECT
             e.id,
             e.group_id,
             e.paid_by,
             e.amount,
             e.description,
             e.created_at,
             e.updated_at,
             COALESCE((
                 SELECT json_agg(json_build_object('user_id', s.user_id, 'amount', s.amount::text)
                                 ORDER BY s.user_id)
                 FROM expense_splits s
                 WHERE s.expense_id = e.id
             ), '[]'::json) AS splits,
             COALESCE((
                 SELECT json_agg(json_build_object(
                     'id', st.id,
                     'paid_by', st.paid_by,
                     'paid_to', st.paid_to,
                     'amount', st.amount::text,
                     'status', st.status,
                     'created_at', st.created_at
                 ) ORDER BY st.created_at)
                 FROM settlements st
                 WHERE st.expense_id = e.id
                   AND st.group_id IS NULL
             ), '[]'::json) AS settlements
         FROM expenses e
         WHERE e.group_id IS NULL
           AND (
               (e.paid_by = $1::uuid AND EXISTS (
                   SELECT 1 FROM expense_splits s
                   WHERE s.expense_id = e.id AND s.user_id = $2::uuid
               ))
               OR (e.paid_by = $2::uuid AND EXISTS (
                   SELECT 1 FROM expense_splits s
                   WHERE s.expense_id = e.id AND s.user_id = $1::uuid
               ))
           )
           AND NOT EXISTS (
               SELECT 1 FROM expense_splits s
               WHERE s.expense_id = e.id
                 AND s.user_id NOT IN ($1::uuid, $2::uuid)
           )
         ORDER BY e.created_at DESC`,
        [userId, friendId]
    );
    return result.rows;
}

async function getExpense(userId, friendId, expenseId) {
    await assertAcceptedFriend(db, userId, friendId);
    const result = await db.query(
        `SELECT
             e.id,
             e.group_id,
             e.paid_by,
             e.amount,
             e.description,
             e.created_at,
             e.updated_at,
             COALESCE((
                 SELECT json_agg(json_build_object('user_id', s.user_id, 'amount', s.amount::text)
                                 ORDER BY s.user_id)
                 FROM expense_splits s
                 WHERE s.expense_id = e.id
             ), '[]'::json) AS splits,
             COALESCE((
                 SELECT json_agg(json_build_object(
                     'id', st.id,
                     'paid_by', st.paid_by,
                     'paid_to', st.paid_to,
                     'amount', st.amount::text,
                     'status', st.status,
                     'created_at', st.created_at
                 ) ORDER BY st.created_at)
                 FROM settlements st
                 WHERE st.expense_id = e.id
                   AND st.group_id IS NULL
             ), '[]'::json) AS settlements
         FROM expenses e
         WHERE e.id = $3::uuid
           AND e.group_id IS NULL
           AND (
               (e.paid_by = $1::uuid AND EXISTS (
                   SELECT 1 FROM expense_splits s
                   WHERE s.expense_id = e.id AND s.user_id = $2::uuid
               ))
               OR (e.paid_by = $2::uuid AND EXISTS (
                   SELECT 1 FROM expense_splits s
                   WHERE s.expense_id = e.id AND s.user_id = $1::uuid
               ))
           )
           AND NOT EXISTS (
               SELECT 1 FROM expense_splits s
               WHERE s.expense_id = e.id
                 AND s.user_id NOT IN ($1::uuid, $2::uuid)
           )`,
        [userId, friendId, expenseId]
    );

    if (result.rowCount === 0) {
        throw createHttpError("Friend expense not found.", 404);
    }
    return result.rows[0];
}

async function getOwedAmount(client, expenseId, debtorId) {
    const result = await client.query(
        `SELECT amount::text
         FROM expense_splits
         WHERE expense_id = $1::uuid AND user_id = $2::uuid`,
        [expenseId, debtorId]
    );
    if (result.rowCount === 0) {
        throw createHttpError("Expense does not include this friend.", 403);
    }
    return BigInt(result.rows[0].amount);
}

async function getSettlementTotal(client, expenseId, payerId, recipientId, status) {
    const result = await client.query(
        `SELECT COALESCE(SUM(amount), 0)::text AS total
         FROM settlements
         WHERE expense_id = $1::uuid
           AND paid_by = $2::uuid
           AND paid_to = $3::uuid
           AND group_id IS NULL
           AND status = $4`,
        [expenseId, payerId, recipientId, status]
    );
    return BigInt(result.rows[0].total);
}

async function lockFriendExpense(client, expenseId) {
    const result = await client.query(
        `SELECT id, paid_by, group_id
         FROM expenses
         WHERE id = $1::uuid AND group_id IS NULL
         FOR UPDATE`,
        [expenseId]
    );
    if (result.rowCount === 0) {
        throw createHttpError("Friend expense not found.", 404);
    }
    return result.rows[0];
}

async function recordSettlement(userId, friendId, expenseId, amount) {
    return withTransaction(async client => {
        await assertAcceptedFriend(client, userId, friendId);
        const expense = await lockFriendExpense(client, expenseId);
        if (expense.paid_by !== userId) {
            throw createHttpError("Only the expense creator can record payment received.", 403);
        }

        const owed = await getOwedAmount(client, expenseId, friendId);
        const settled = await getSettlementTotal(client, expenseId, friendId, userId, "accepted");
        const requested = await getSettlementTotal(client, expenseId, friendId, userId, "requested");
        if (BigInt(amount) > owed - settled - requested) {
            throw createHttpError("Settlement exceeds the remaining amount available to settle.", 400);
        }

        const result = await client.query(
            `INSERT INTO settlements (group_id, expense_id, paid_by, paid_to, amount, status)
             VALUES (NULL, $1::uuid, $2::uuid, $3::uuid, $4, 'accepted')
             RETURNING id, group_id, expense_id, paid_by, paid_to, amount, status, created_at`,
            [expenseId, friendId, userId, amount]
        );
        return result.rows[0];
    });
}

async function requestSettlement(userId, friendId, expenseId, amount) {
    return withTransaction(async client => {
        await assertAcceptedFriend(client, userId, friendId);
        const expense = await lockFriendExpense(client, expenseId);
        if (expense.paid_by !== friendId) {
            throw createHttpError("Settlement requests must be made by the friend who owes this expense.", 403);
        }

        const owed = await getOwedAmount(client, expenseId, userId);
        const settled = await getSettlementTotal(client, expenseId, userId, friendId, "accepted");
        const requested = await getSettlementTotal(client, expenseId, userId, friendId, "requested");
        if (BigInt(amount) > owed - settled - requested) {
            throw createHttpError("Settlement request exceeds the remaining amount owed.", 400);
        }

        const result = await client.query(
            `INSERT INTO settlements (group_id, expense_id, paid_by, paid_to, amount, status)
             VALUES (NULL, $1::uuid, $2::uuid, $3::uuid, $4, 'requested')
             RETURNING id, group_id, expense_id, paid_by, paid_to, amount, status, created_at`,
            [expenseId, userId, friendId, amount]
        );
        return result.rows[0];
    });
}

async function listSettlementRequests(userId, direction, status) {
    const idColumn = direction === "incoming" ? "st.paid_to" : "st.paid_by";
    const result = await db.query(
        `SELECT
             st.id,
             st.expense_id,
             st.paid_by,
             payer.name AS payer_name,
             payer.username AS payer_username,
             st.paid_to,
             recipient.name AS recipient_name,
             recipient.username AS recipient_username,
             st.amount,
             st.status,
             st.created_at,
             e.description AS expense_description
         FROM settlements st
         JOIN expenses e ON e.id = st.expense_id
         JOIN users payer ON payer.id = st.paid_by
         JOIN users recipient ON recipient.id = st.paid_to
         WHERE ${idColumn} = $1::uuid
           AND st.group_id IS NULL
           AND st.status = $2
           AND e.group_id IS NULL
         ORDER BY st.created_at DESC`,
        [userId, status]
    );
    return result.rows;
}

async function listSettlements(userId) {
    const result = await db.query(
        `SELECT
             st.id,
             st.expense_id,
             st.paid_by,
             payer.name AS payer_name,
             st.paid_to,
             recipient.name AS recipient_name,
             CASE
                 WHEN st.paid_by = $1::uuid THEN recipient.name
                 ELSE payer.name
             END AS friend_name,
             CASE
                 WHEN st.paid_by = $1::uuid THEN 'paid'
                 ELSE 'received'
             END AS direction,
             e.description AS expense_description,
             st.amount::text AS amount,
             st.status,
             st.created_at
         FROM settlements st
         JOIN expenses e ON e.id = st.expense_id
         JOIN users payer ON payer.id = st.paid_by
         JOIN users recipient ON recipient.id = st.paid_to
         WHERE st.group_id IS NULL
           AND e.group_id IS NULL
           AND (st.paid_by = $1::uuid OR st.paid_to = $1::uuid)
         ORDER BY st.created_at DESC
         LIMIT 25`,
        [userId]
    );
    return result.rows;
}

async function acceptSettlementRequest(userId, requestId) {
    return withTransaction(async client => {
        const requestResult = await client.query(
            `SELECT id, expense_id, paid_by, paid_to, amount
             FROM settlements
             WHERE id = $1::uuid
               AND paid_to = $2::uuid
               AND group_id IS NULL
               AND status = 'requested'
             FOR UPDATE`,
            [requestId, userId]
        );
        if (requestResult.rowCount === 0) {
            throw createHttpError("Pending settlement request not found.", 404);
        }
        const request = requestResult.rows[0];
        await assertAcceptedFriend(client, userId, request.paid_by);

        const expense = await lockFriendExpense(client, request.expense_id);
        if (expense.paid_by !== userId) {
            throw createHttpError("Settlement request does not match the expense creator.", 409);
        }

        const owed = await getOwedAmount(client, request.expense_id, request.paid_by);
        const settled = await getSettlementTotal(
            client, request.expense_id, request.paid_by, userId, "accepted"
        );
        const otherRequests = await client.query(
            `SELECT COALESCE(SUM(amount), 0)::text AS total
             FROM settlements
             WHERE expense_id = $1::uuid
               AND paid_by = $2::uuid
               AND paid_to = $3::uuid
               AND id <> $4::uuid
               AND group_id IS NULL
               AND status = 'requested'`,
            [request.expense_id, request.paid_by, userId, requestId]
        );
        if (BigInt(request.amount) > owed - settled - BigInt(otherRequests.rows[0].total)) {
            throw createHttpError("Settlement request exceeds the remaining amount owed.", 409);
        }

        const result = await client.query(
            `UPDATE settlements
             SET status = 'accepted'
             WHERE id = $1::uuid AND paid_to = $2::uuid AND status = 'requested'
             RETURNING id, group_id, expense_id, paid_by, paid_to, amount, status, created_at`,
            [requestId, userId]
        );
        return result.rows[0];
    });
}

async function cancelSettlementRequest(userId, requestId) {
    const result = await db.query(
        `DELETE FROM settlements
         WHERE id = $1::uuid
           AND paid_by = $2::uuid
           AND group_id IS NULL
           AND status = 'requested'
         RETURNING id`,
        [requestId, userId]
    );
    if (result.rowCount === 0) {
        throw createHttpError("Pending settlement request not found.", 404);
    }
    return { id: result.rows[0].id, status: "cancelled" };
}

module.exports = {
    createExpense,
    listExpenses,
    getExpense,
    recordSettlement,
    requestSettlement,
    listSettlementRequests,
    listSettlements,
    acceptSettlementRequest,
    cancelSettlementRequest
};
