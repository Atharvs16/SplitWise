const friendsServices = require("../services/friends.services");

function getAccessToken(req) {
    const authorization = req.headers.authorization;
    return authorization?.startsWith("Bearer ") ? authorization.slice(7) : null;
}

function respondWithError(res, error) {
    if (error.statusCode) {
        return res.status(error.statusCode).json({ error: error.message });
    }
    console.error(error);
    return res.status(500).json({ error: "Unable to complete friend request." });
}

async function searchAddFriend(req, res) {
    const { username, phone } = req.body ?? {};
    const hasUsername = typeof username === "string" && Boolean(username.trim());
    const hasPhone = typeof phone === "string" && Boolean(phone.trim());
    if (hasUsername === hasPhone) {
        return res.status(400).json({ error: "Provide exactly one identifier." });
    }
    if (
        (hasUsername && username.trim().length > 50) ||
        (hasPhone && !/^[6-9]\d{9}$/.test(phone.trim()))
    ) {
        return res.status(400).json({ error: "Enter a valid username or Indian phone number." });
    }
    try {
        const result = hasUsername
            ? await friendsServices.searchByUsername(getAccessToken(req), username.trim())
            : await friendsServices.searchByPhone(getAccessToken(req), phone.trim());
        return res.status(200).json(result);
    }
    catch (error) {
        return respondWithError(res, error);
    }
}

async function addFriend(req, res) {
    const { receiverId } = req.body ?? {};
    if (typeof receiverId !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(receiverId)) {
        return res.status(400).json({ error: "A valid friend ID is required." });
    }
    try {
        const result = await friendsServices.addFriend(getAccessToken(req), receiverId);
        return res.status(201).json(result);
    }
    catch (error) {
        return respondWithError(res, error);
    }
}

async function getRequests(req, res) {
    try {
        const result = await friendsServices.getRequests(getAccessToken(req));
        return res.status(200).json({ requests: result.rows });
    }
    catch (error) {
        return respondWithError(res, error);
    }
}

async function changeFriendStatus(req, res) {
    const { requestId, action } = req.params;
    if (!["accept", "reject"].includes(action)) {
        return res.status(400).json({
            message: "Invalid action",
        });
    }
    try{
        const result = await friendsServices.changeFriendStatus(getAccessToken(req), requestId, action);
        return res.status(200).json(result);
    }
    catch(error){
        return respondWithError(res, error);
    }
}

async function getFriendsWithExpense(req, res) {
    try{
        const result = await friendsServices.getFriendsWithExpense(getAccessToken(req));
        return res.status(200).json(result);
    }
    catch(error){
        return respondWithError(res, error);
    }
}

module.exports = {
    searchAddFriend,
    addFriend,
    getRequests,
    changeFriendStatus,
    getFriendsWithExpense
};