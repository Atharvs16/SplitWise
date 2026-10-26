const friendsServices = require("../services/friends.services");

async function searchAddFriend(req, res) {
    const { username, phone } = req.body;
    const accessToken = req.headers.authorization?.split(" ")[1];
    if ((phone && username) || (!username && !phone)) {
        return res.status(401).json({ error: "Provide exactly one identifier." });
    }
    try {
        const result = username ? await friendsServices.searchByUsername(accessToken, username) : await friendsServices.searchByPhone(phone);

        res.status(200).json(result);
    }

    catch (error) {
        console.log(error);
        throw error;
    }
}

async function addFriend(req, res) {
    const { receiverId } = req.body;
    const accessToken = req.headers.authorization?.split(" ")[1];
    try {
        const result = await friendsServices.addFriend(accessToken, receiverId);
        res.status(201).json(result);
    }

    catch (error) {
        console.log(error);
        throw error;
    }
}

async function getRequests(req, res) {
    const accessToken = req.headers.authorization?.split(" ")[1];
    try {
        const result = await friendsServices.getRequests(accessToken);
        res.status(200).json({
            requests: result.rows
        });
    }
    catch (error) {
        console.error(error);
        throw error;
    }
}

async function changeFriendStatus(req, res) {
    const { requestId, action } = req.params;
    const accessToken = req.headers.authorization?.split(" ")[1];

    if (!["accept", "reject"].includes(action)) {
        return res.status(400).json({
            message: "Invalid action",
        });
    }
    try{
        const result = await friendsServices.changeFriendStatus(accessToken, requestId, action);
        res.status(201).json(result);
    }
    catch(error){
        console.error(error);
        throw error;
    }
}

async function getFriendsWithExpense(req, res) {
    const accessToken = req.headers.authorization?.split(" ")[1];
    try{
        const result = await friendsServices.getFriendsWithExpense(accessToken);
        res.status(200).json(result);
    }
    catch(error){
        console.log(error);
        throw error;
    }
}

module.exports = {
    searchAddFriend,
    addFriend,
    getRequests,
    changeFriendStatus,
    getFriendsWithExpense
};