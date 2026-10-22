const friendsServices = require("../services/friends.services");

async function searchAddFriend(req, res) {
    const {username, phone} = req.body;
    const accessToken = req.headers.authorization?.split(" ")[1];
    if((phone && username) || (!username && !phone)){
        return res.status(401).json({ error: "Provide exactly one identifier." });
    }
    try{
        const result = username ? await friendsServices.searchByUsername(accessToken, username) : await friendsServices.searchByPhone(phone);

        res.status(200).json(result);
    }

    catch(error){
        console.log(error);
        throw error;
    }
}

async function addFriend(req, res) {
    const {receiverId} = req.body;
    const accessToken = req.headers.authorization?.split(" ")[1];
    try{
        const result = await friendsServices.addFriend(accessToken,receiverId);
        res.status(201).json(result);
    }

    catch(error){
        console.log(error);
        throw error;
    }
}

module.exports = {
    searchAddFriend,
    addFriend
};