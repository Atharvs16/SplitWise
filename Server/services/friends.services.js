const jwt = require("jsonwebtoken");
const config = require("../config/config");
const friendsQueries = require("../queries/friends.queries");
const sessionQueries = require("../queries/sessions.queries");

async function userLoggedIn( accessToken) {
    try {
        const decoded = jwt.verify(accessToken, config.JWT_SECRET);
        const isrevoked = await sessionQueries.getSessionById(decoded.sessionId, decoded.userId);
        if (isrevoked.revoked) {
            throw new Error("Session is revoked");
        }
        return decoded;
    } catch (error) {
        console.error(error);
        throw error;
    }
}

async function searchByUsername(accesstoken, username) {
    try{
        const decoded = await userLoggedIn(accesstoken);
        console.log(decoded)
        const result = await friendsQueries.searchByUsername(decoded.userId, username);
        return result;
    }
    catch(err){
        console.log(err);
        throw err;
    }
}
async function searchByPhone(phone) {
    try{
        const result = await friendsQueries.searchByPhone(phone);
        return result;
    }
    catch(err){
        console.log(err);
        throw err;
    }
}

module.exports = {
    searchByUsername,
    searchByPhone
}