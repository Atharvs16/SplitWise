const friendExpensesService = require("../services/friend-expenses.service");

function respondWithError(res, error) {
    if (error.statusCode) {
        return res.status(error.statusCode).json({ error: error.message });
    }

    console.error(error);
    return res.status(500).json({ error: "Unable to complete friend expense request." });
}

function accessToken(req) {
    return req.headers.authorization?.startsWith("Bearer ")
        ? req.headers.authorization.slice(7)
        : null;
}

async function createExpense(req, res) {
    try {
        const expense = await friendExpensesService.createExpense(
            accessToken(req),
            req.params.friendId,
            req.body
        );
        return res.status(201).json({ expense });
    } catch (error) {
        return respondWithError(res, error);
    }
}

async function listExpenses(req, res) {
    try {
        const expenses = await friendExpensesService.listExpenses(
            accessToken(req),
            req.params.friendId
        );
        return res.status(200).json({ expenses });
    } catch (error) {
        return respondWithError(res, error);
    }
}

async function getExpense(req, res) {
    try {
        const expense = await friendExpensesService.getExpense(
            accessToken(req),
            req.params.friendId,
            req.params.expenseId
        );
        return res.status(200).json({ expense });
    } catch (error) {
        return respondWithError(res, error);
    }
}

async function recordSettlement(req, res) {
    try {
        const settlement = await friendExpensesService.recordSettlement(
            accessToken(req),
            req.params.friendId,
            req.params.expenseId,
            req.body.amount
        );
        return res.status(201).json({ settlement });
    } catch (error) {
        return respondWithError(res, error);
    }
}

async function requestSettlement(req, res) {
    try {
        const settlement = await friendExpensesService.requestSettlement(
            accessToken(req),
            req.params.friendId,
            req.params.expenseId,
            req.body.amount
        );
        return res.status(201).json({ settlement });
    } catch (error) {
        return respondWithError(res, error);
    }
}

async function listSettlementRequests(req, res) {
    const direction = req.query.direction || "incoming";
    const status = req.query.status || "requested";
    if (!["incoming", "outgoing"].includes(direction)) {
        return res.status(400).json({ error: "Direction must be incoming or outgoing." });
    }
    if (!["requested", "accepted"].includes(status)) {
        return res.status(400).json({ error: "Status must be requested or accepted." });
    }

    try {
        const requests = await friendExpensesService.listSettlementRequests(
            accessToken(req),
            direction,
            status
        );
        return res.status(200).json({ requests });
    } catch (error) {
        return respondWithError(res, error);
    }
}

async function acceptSettlementRequest(req, res) {
    try {
        const settlement = await friendExpensesService.acceptSettlementRequest(
            accessToken(req),
            req.params.requestId
        );
        return res.status(200).json({ settlement });
    } catch (error) {
        return respondWithError(res, error);
    }
}

async function cancelSettlementRequest(req, res) {
    try {
        const result = await friendExpensesService.cancelSettlementRequest(
            accessToken(req),
            req.params.requestId
        );
        return res.status(200).json(result);
    } catch (error) {
        return respondWithError(res, error);
    }
}

module.exports = {
    createExpense,
    listExpenses,
    getExpense,
    recordSettlement,
    requestSettlement,
    listSettlementRequests,
    acceptSettlementRequest,
    cancelSettlementRequest
};
