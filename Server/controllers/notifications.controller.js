const { get } = require("../routes/auth.routes");
const notificationsService = require("../services/notifications.service");

async function getNotifications(req, res) {
    const accessToken = req.headers.authorization?.split(" ")[1];
    try{
        const result = await notificationsService.getNotifications(accessToken);
        res.status(200).json(result);
    }
    catch(error){
        console.log(error);
        throw error;
    }
}

module.exports = {
    getNotifications
}