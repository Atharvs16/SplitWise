const jwt = require("jsonwebtoken");
const config = require("../config/config");
const friendsQueries = require("../queries/friends.queries");
const authServices = require("../services/auth.service");

async function searchByUsername(accesstoken, username) {
    try {
        const user = await authServices.getme(accesstoken);
        const result = await friendsQueries.searchByUsername(user.id, username);
        return result;
    }
    catch (err) {
        console.log(err);
        throw err;
    }
}

async function searchByPhone(phone) {
    try {
        const result = await friendsQueries.searchByPhone(phone);
        return result;
    }
    catch (err) {
        console.log(err);
        throw err;
    }
}

async function addFriend(accesstoken, receiverId) {
    try {
        const user = await authServices.getme(accesstoken);
        const result = await friendsQueries.addFriend(user.id, receiverId);
        return result;
    }
    catch (error) {
        console.log(error);
        throw error;
    }
}

async function getRequests(accessToken) {
    try {
        const user = await authServices.getme(accessToken);
        if (!user) {
            return { error: "Invalid user" };
        }
        const result = await friendsQueries.getRequests(user.id);
        return result;
    }
    catch (error) {
        console.error(error);
        throw error;
    }
}

async function changeFriendStatus(accessToken, requestId, action) {
    const user = await authServices.getme(accessToken);
    if (!user) {
        return { error: "Invalid user" };
    }
    try{
        const result = await friendsQueries.changeFriendStatus(requestId, user.id, action);
        return result;
    }
    catch(error){
        console.error(error);
        throw error;
    }
}

async function getFriendsWithExpense(accessToken) {
    const user = await authServices.getme(accessToken);
    if (!user) {
        return { error: "Invalid user" };
    }

    try{
        const result = await friendsQueries.getFriendsWithExpenses(user.id);
        return result;
    }
    catch(error){
        console.log(error);
        throw error;
    }
}

module.exports = {
    searchByUsername,
    searchByPhone,
    addFriend,
    getRequests,
    changeFriendStatus,
    getFriendsWithExpense
}