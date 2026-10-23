const notificationsQueries = require("../queries/notifications.queries");
const sessionQueries = require("../queries/sessions.queries");

async function getNotifications(accessToken) {
    try{
        const decoded = await sessionQueries.userLoggedIn(accessToken);
        const result = await notificationsQueries.getNotifications(decoded.userId);

        return result;
    }
    catch(error){
        console.error(error);
        throw error;
    }

}

module.exports = {
    getNotifications
}