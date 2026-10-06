const jwt = require("jsonwebtoken");
const config = require("../config/config");
const groupQueries = require("../queries/group.queries");

async function userLoggedIn( accessToken) {
    try {
        const decoded = jwt.verify(accessToken, config.JWT_SECRET);
        const isrevoked = await groupQueries.getSessionById(decoded.sessionId, decoded.userId);
        if (isrevoked.revoked) {
            throw new Error("Session is revoked");
        }
        return decoded;
    } catch (error) {
        console.error(error);
        throw error;
    }
}

async function getGroups( accessToken) {
    try {
        const decoded = await userLoggedIn(accessToken);
        const groups = await groupQueries.getGroupsByUserId(decoded.userId);
        return groups;
    } catch (error) {
        console.error(error);
        throw error;
    }
}

async function createGroup(data) {
    const { token, groupData } = data;
    try {
        const decoded = await userLoggedIn(token);

        const group = await groupQueries.createGroup(groupData.name, groupData.description, decoded.userId);

        return group;
        
    } catch (error) {
        console.error(error);
        if (error.name === 'TokenExpiredError') {
            throw new Error("Token expired");
        }
        throw error;
    }
}

module.exports = {
    createGroup,
    getGroups
}