const authServices = require("./auth.service");
const expenseQueries = require("../queries/friend-expenses.queries");

async function getUserId(accessToken) {
    if (!accessToken) {
        const error = new Error("Authentication required.");
        error.statusCode = 401;
        throw error;
    }

    try {
        const user = await authServices.getme(accessToken);
        return user.id;
    } catch (error) {
        if (["JsonWebTokenError", "TokenExpiredError", "UnauthorizedError"].includes(error.name)) {
            error.statusCode = 401;
        }
        throw error;
    }
}

async function createExpense(accessToken, friendId, expense) {
    const userId = await getUserId(accessToken);
    return expenseQueries.createExpense(userId, friendId, expense);
}

async function listExpenses(accessToken, friendId) {
    const userId = await getUserId(accessToken);
    return expenseQueries.listExpenses(userId, friendId);
}

async function getExpense(accessToken, friendId, expenseId) {
    const userId = await getUserId(accessToken);
    return expenseQueries.getExpense(userId, friendId, expenseId);
}

async function recordSettlement(accessToken, friendId, expenseId, amount) {
    const userId = await getUserId(accessToken);
    return expenseQueries.recordSettlement(userId, friendId, expenseId, amount);
}

async function requestSettlement(accessToken, friendId, expenseId, amount) {
    const userId = await getUserId(accessToken);
    return expenseQueries.requestSettlement(userId, friendId, expenseId, amount);
}

async function listSettlementRequests(accessToken, direction, status) {
    const userId = await getUserId(accessToken);
    return expenseQueries.listSettlementRequests(userId, direction, status);
}

async function listSettlements(accessToken) {
    const userId = await getUserId(accessToken);
    return expenseQueries.listSettlements(userId);
}

async function acceptSettlementRequest(accessToken, requestId) {
    const userId = await getUserId(accessToken);
    return expenseQueries.acceptSettlementRequest(userId, requestId);
}

async function cancelSettlementRequest(accessToken, requestId) {
    const userId = await getUserId(accessToken);
    return expenseQueries.cancelSettlementRequest(userId, requestId);
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
