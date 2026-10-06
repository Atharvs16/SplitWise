const groupservice = require("../services/groups.service");

async function createGroup(req, res) {
    const { name, description } = req.body;
    
    try {
        const group = await groupservice.createGroup({ token: req.headers.authorization.split(' ')[1], groupData: { name, description } });
        res.status(201).json({ group });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message || "Database error" });
    }
}

async function getGroups(req, res) {
    const accessToken = req.headers.authorization.split(' ')[1];
    if (!accessToken) {
        return res.status(401).json({ error: "No token provided" });
    }

    try {
        const groups = await groupservice.getGroups(accessToken);
        res.status(200).json({ groups });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message || "Database error" });
    }
}



module.exports = {
    createGroup,
    getGroups
};