const groupservice = require("../services/groups.service");

function accessToken(req) {
    return req.headers.authorization?.startsWith("Bearer ")
        ? req.headers.authorization.slice(7)
        : null;
}

function respondWithError(res, error, genericMessage) {
    if (error.statusCode) {
        return res.status(error.statusCode).json({ error: error.message });
    }

    console.error(error);
    return res.status(500).json({ error: genericMessage });
}

async function createGroup(req, res) {
    const { name, description } = req.body;
    try {
        const group = await groupservice.createGroup({
            token: accessToken(req),
            groupData: { name, description }
        });
        return res.status(201).json({ group });
    } catch (error) {
        return respondWithError(res, error, "Unable to create group.");
    }
}

async function getGroups(req, res) {
    try {
        const groups = await groupservice.getGroups(accessToken(req));
        return res.status(200).json({ groups });
    } catch (error) {
        return respondWithError(res, error, "Unable to load groups.");
    }
}

async function getGroupOverview(req, res) {
    try {
        const group = await groupservice.getGroupOverview(accessToken(req), req.params.groupId);
        return res.status(200).json({ group });
    } catch (error) {
        return respondWithError(res, error, "Unable to load group.");
    }
}

async function createGroupExpense(req, res) {
    try {
        const expense = await groupservice.createGroupExpense(
            accessToken(req),
            req.params.groupId,
            req.body
        );
        return res.status(201).json({ expense });
    } catch (error) {
        return respondWithError(res, error, "Unable to create group expense.");
    }
}

async function listGroupExpenses(req, res) {
    try {
        const expenses = await groupservice.listGroupExpenses(
            accessToken(req),
            req.params.groupId
        );
        return res.status(200).json({ expenses });
    } catch (error) {
        return respondWithError(res, error, "Unable to load group expenses.");
    }
}

async function createExpenseSettlement(req, res) {
    try {
        const settlement = await groupservice.createExpenseSettlement(
            accessToken(req),
            req.params.groupId,
            req.params.expenseId,
            req.body.paidBy,
            req.body.amount
        );
        return res.status(201).json({ settlement });
    } catch (error) {
        return respondWithError(res, error, "Unable to record group settlement.");
    }
}

async function requestExpenseSettlement(req, res) {
    try {
        const settlement = await groupservice.requestExpenseSettlement(
            accessToken(req),
            req.params.groupId,
            req.params.expenseId,
            req.body.paidTo,
            req.body.amount
        );
        return res.status(201).json({ settlement });
    } catch (error) {
        return respondWithError(res, error, "Unable to request group settlement.");
    }
}

async function listGroupSettlementRequests(req, res) {
    try {
        const requests = await groupservice.listGroupSettlementRequests(
            accessToken(req),
            req.query.direction || "incoming",
            req.query.status || "requested"
        );
        return res.status(200).json({ requests });
    } catch (error) {
        return respondWithError(res, error, "Unable to load group settlement requests.");
    }
}

async function acceptGroupSettlementRequest(req, res) {
    try {
        const settlement = await groupservice.acceptGroupSettlementRequest(
            accessToken(req),
            req.params.requestId
        );
        return res.status(200).json({ settlement });
    } catch (error) {
        return respondWithError(res, error, "Unable to accept group settlement request.");
    }
}

async function cancelGroupSettlementRequest(req, res) {
    try {
        const result = await groupservice.cancelGroupSettlementRequest(
            accessToken(req),
            req.params.requestId
        );
        return res.status(200).json(result);
    } catch (error) {
        return respondWithError(res, error, "Unable to cancel group settlement request.");
    }
}

async function createInvitation(req, res) {
    try {
        const invitation = await groupservice.createInvitation(
            accessToken(req),
            req.params.groupId,
            req.body
        );
        return res.status(201).json({ invitation });
    } catch (error) {
        return respondWithError(res, error, "Unable to create group invitation.");
    }
}

async function listIncomingInvitations(req, res) {
    try {
        const invitations = await groupservice.listIncomingInvitations(accessToken(req));
        return res.status(200).json({ invitations });
    } catch (error) {
        return respondWithError(res, error, "Unable to load group invitations.");
    }
}

async function listGroupInvitations(req, res) {
    try {
        const invitations = await groupservice.listGroupInvitations(
            accessToken(req),
            req.params.groupId
        );
        return res.status(200).json({ invitations });
    } catch (error) {
        return respondWithError(res, error, "Unable to load group invitations.");
    }
}

async function respondToInvitation(req, res) {
    const { action } = req.params;
    if (!["accept", "reject"].includes(action)) {
        return res.status(400).json({ error: "Action must be accept or reject." });
    }
    try {
        const invitation = await groupservice.respondToInvitation(
            accessToken(req),
            req.params.invitationId,
            action
        );
        return res.status(200).json({ invitation });
    } catch (error) {
        return respondWithError(res, error, "Unable to respond to group invitation.");
    }
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