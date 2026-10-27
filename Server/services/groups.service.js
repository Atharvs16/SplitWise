const groupQueries = require("../queries/group.queries");
const groupExpenseQueries = require("../queries/group-expenses.queries");
const groupInvitationQueries = require("../queries/group-invitations.queries");
const authServices = require("./auth.service");

async function getUser(accessToken) {
    if (!accessToken) {
        const error = new Error("Authentication required.");
        error.statusCode = 401;
        throw error;
    }

    try {
        return await authServices.getme(accessToken);
    } catch (error) {
        if (["JsonWebTokenError", "TokenExpiredError", "UnauthorizedError"].includes(error.name)) {
            error.statusCode = 401;
        }
        throw error;
    }
}

async function getGroups(accessToken) {
    const user = await getUser(accessToken);
    return groupQueries.getGroupsByUserId(user.id);
}

async function createGroup(data) {
    const { token, groupData } = data;
    const user = await getUser(token);
    return groupQueries.createGroup(groupData.name, groupData.description, user.id);
}

async function getGroupOverview(accessToken, groupId) {
    const user = await getUser(accessToken);
    return groupExpenseQueries.getGroupOverview(user.id, groupId);
}

async function createGroupExpense(accessToken, groupId, expense) {
    const user = await getUser(accessToken);
    return groupExpenseQueries.createGroupExpense(user.id, groupId, expense);
}

async function listGroupExpenses(accessToken, groupId) {
    const user = await getUser(accessToken);
    return groupExpenseQueries.listGroupExpenses(user.id, groupId);
}

async function createExpenseSettlement(accessToken, groupId, expenseId, paidBy, amount) {
    const user = await getUser(accessToken);
    return groupExpenseQueries.createExpenseSettlement(user.id, groupId, expenseId, paidBy, amount);
}

async function requestExpenseSettlement(accessToken, groupId, expenseId, paidTo, amount) {
    const user = await getUser(accessToken);
    return groupExpenseQueries.requestExpenseSettlement(user.id, groupId, expenseId, paidTo, amount);
}

async function listGroupSettlementRequests(accessToken, direction, status) {
    const user = await getUser(accessToken);
    return groupExpenseQueries.listGroupSettlementRequests(user.id, direction, status);
}

async function acceptGroupSettlementRequest(accessToken, requestId) {
    const user = await getUser(accessToken);
    return groupExpenseQueries.acceptGroupSettlementRequest(user.id, requestId);
}

async function cancelGroupSettlementRequest(accessToken, requestId) {
    const user = await getUser(accessToken);
    return groupExpenseQueries.cancelGroupSettlementRequest(user.id, requestId);
}

async function createInvitation(accessToken, groupId, invitation) {
    const user = await getUser(accessToken);
    return groupInvitationQueries.createInvitation(user.id, groupId, invitation);
}

async function listIncomingInvitations(accessToken) {
    const user = await getUser(accessToken);
    return groupInvitationQueries.listIncomingInvitations(user.id, user.phone);
}

async function listGroupInvitations(accessToken, groupId) {
    const user = await getUser(accessToken);
    return groupInvitationQueries.listGroupInvitations(user.id, groupId);
}

async function respondToInvitation(accessToken, invitationId, action) {
    const user = await getUser(accessToken);
    return groupInvitationQueries.respondToInvitation(user.id, user.phone, invitationId, action);
}

module.exports = {
    createGroup,
    getGroups,
    getGroupOverview,
    createGroupExpense,
    listGroupExpenses,
    createExpenseSettlement,
    requestExpenseSettlement,
    listGroupSettlementRequests,
    acceptGroupSettlementRequest,
    cancelGroupSettlementRequest,
    createInvitation,
    listIncomingInvitations,
    listGroupInvitations,
    respondToInvitation
};