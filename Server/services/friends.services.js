const friendsQueries = require("../queries/friends.queries");
const authServices = require("../services/auth.service");

async function getAuthenticatedUser(accessToken) {
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

async function searchByUsername(accesstoken, username) {
    const user = await getAuthenticatedUser(accesstoken);
    return friendsQueries.searchByUsername(user.id, username);
}

async function searchByPhone(accessToken, phone) {
    const user = await getAuthenticatedUser(accessToken);
    return friendsQueries.searchByPhone(user.id, phone);
}

async function addFriend(accesstoken, receiverId) {
    const user = await getAuthenticatedUser(accesstoken);
    return friendsQueries.addFriend(user.id, receiverId);
}

async function getRequests(accessToken) {
    const user = await getAuthenticatedUser(accessToken);
    return friendsQueries.getRequests(user.id);
}

async function changeFriendStatus(accessToken, requestId, action) {
    const user = await getAuthenticatedUser(accessToken);
    return friendsQueries.changeFriendStatus(requestId, user.id, action);
}

async function getFriendsWithExpense(accessToken) {
    const user = await getAuthenticatedUser(accessToken);
    return friendsQueries.getFriendsWithExpenses(user.id);
}

module.exports = {
    searchByUsername,
    searchByPhone,
    addFriend,
    getRequests,
    changeFriendStatus,
    getFriendsWithExpense
}