const activityService = require("../services/activity.service");

async function listRecentActivity(req, res) {
    const accessToken = req.headers.authorization?.startsWith("Bearer ")
        ? req.headers.authorization.slice(7)
        : null;

    try {
        const activities = await activityService.listRecentActivity(accessToken);
        return res.status(200).json({ activities });
    } catch (error) {
        if (error.statusCode) {
            return res.status(error.statusCode).json({ error: error.message });
        }

        console.error(error);
        return res.status(500).json({ error: "Unable to load activity." });
    }
}

module.exports = { listRecentActivity };
