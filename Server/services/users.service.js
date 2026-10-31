const bcrypt = require("bcrypt");
const crypto = require("crypto");
const userQueries = require("../queries/users.queries");
const authService = require("./auth.service");

async function getAuthenticatedUser(accessToken) {
    if (!accessToken) {
        const error = new Error("Authentication required.");
        error.statusCode = 401;
        throw error;
    }

    try {
        return await authService.getme(accessToken);
    } catch (error) {
        if (["JsonWebTokenError", "TokenExpiredError", "UnauthorizedError"].includes(error.name)) {
            error.statusCode = 401;
        }
        throw error;
    }
}

async function getProfile(accessToken, username) {
    const viewer = await getAuthenticatedUser(accessToken);
    const result = await userQueries.getProfile(viewer.id, username);
    if (!result.profile) {
        const error = new Error("Profile not found.");
        error.statusCode = 404;
        throw error;
    }
    return result;
}

async function updateProfile(accessToken, details) {
    const user = await getAuthenticatedUser(accessToken);
    let passwordHash = null;

    if (details.newPassword) {
        const existingPasswordHash = await userQueries.getUserPasswordHash(user.id);
        if (!details.currentPassword || !(await bcrypt.compare(details.currentPassword, existingPasswordHash))) {
            const error = new Error("Your current password is incorrect.");
            error.statusCode = 401;
            throw error;
        }
        passwordHash = await bcrypt.hash(details.newPassword, 10);
    }

    try {
        return await userQueries.updateUserProfile(user.id, {
            name: details.name,
            phone: details.phone,
            passwordHash
        });
    } catch (error) {
        if (error.code === "23505") {
            error.statusCode = 409;
            error.message = "That phone number is already in use.";
        }
        throw error;
    }
}

async function deleteAccount(accessToken, currentPassword) {
    const user = await getAuthenticatedUser(accessToken);
    const existingPasswordHash = await userQueries.getUserPasswordHash(user.id);
    if (!currentPassword || !(await bcrypt.compare(currentPassword, existingPasswordHash))) {
        const error = new Error("Your current password is incorrect.");
        error.statusCode = 401;
        throw error;
    }

    const randomPassword = crypto.randomBytes(48).toString("hex");
    const passwordHash = await bcrypt.hash(randomPassword, 10);
    try {
        await userQueries.anonymizeUser(user.id, passwordHash);
    } catch (error) {
        if (error.code === "23505") {
            error.statusCode = 409;
            error.message = "Unable to anonymize account details. Please contact support.";
        }
        throw error;
    }
}

module.exports = {
    getProfile,
    updateProfile,
    deleteAccount
};
