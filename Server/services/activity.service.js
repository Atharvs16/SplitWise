const authServices = require("./auth.service");
const activityQueries = require("../queries/activity.queries");

async function listRecentActivity(accessToken) {
    if (!accessToken) {
        const error = new Error("Authentication required.");
        error.statusCode = 401;
        throw error;
    }

    try {
        const user = await authServices.getme(accessToken);
        return activityQueries.listRecentActivity(user.id);
    } catch (error) {
        if (["JsonWebTokenError", "TokenExpiredError", "UnauthorizedError"].includes(error.name)) {
            error.statusCode = 401;
        }
        throw error;
    }
}

module.exports = { listRecentActivity };
