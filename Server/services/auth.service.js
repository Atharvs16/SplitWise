const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const userQueries = require('../queries/users.queries');
const sessionQueries = require('../queries/services.queries');

const config = require('../config/config');

async function register({ name, phone, password, ip, userAgent }) {
    try{
        const Password_hash = await bcrypt.hash(password, 10);
    
        const user = await userQueries.createUser(
            name,
            phone,
            Password_hash,
        );

        const session = await sessionQueries.createSession(
            user.id,
            null,
            ip,
            userAgent
        );
        
        const refreshToken = jwt.sign(
            {
                userId: user.id,
                sessionId: session.id
            },
            config.JWT_SECRET,
            {
                expiresIn: "7d"
            }
        );
    
        const refreshTokenHash = await bcrypt.hash(refreshToken, 10);

        await sessionQueries.updateSessionRefreshToken(
            session.id,
            refreshTokenHash
        );
    
        const accessToken = jwt.sign(
            {
                userId: user.id,
                sessionId: session.id
            }, config.JWT_SECRET, { expiresIn: '15m' }
        );
    
        return {
            id: user.id,
            name: user.name,
            accessToken,
            refreshToken
        };

    }

    catch (error) {
        if (error.code === '23505') { // Unique violation
            throw new Error("Phone number already exists");
        }
        if (error.constraint === 'chk_users_phone_format') { // Phone format violation
            throw new Error("Invalid phone number format");
        }
        console.error(error);
        throw error;
    }
}

async function getme(accessToken) {
    try{
        const decoded = jwt.verify(accessToken, config.JWT_SECRET);

        if (!decoded) {
            throw new Error("Invalid token");
        }
        
        const session = await sessionQueries.getSessionById(decoded.sessionId, decoded.userId);
        if (!session || session.revoked) {
            throw new Error("Session is revoked or not found");
        }
        const user = await userQueries.getUserById(decoded.userId);
        if (!user) {
            throw new Error("User not found");
        }
        return user;
    }
    catch (error) {
        if (error.name === 'TokenExpiredError') {
            throw new Error("Token expired");
        }
        console.error(error);
        throw error;
    }
}

async function refreshToken(refreshToken) {
    try{
        const decoded = jwt.verify(refreshToken, config.JWT_SECRET);
        if (!decoded) {
            throw new Error("Invalid refresh token");
        }

        console.log("Decoded refresh token:", decoded);
        

        const sessionResult = await sessionQueries.getSessionById(decoded.sessionId, decoded.userId);
        if (sessionResult === undefined || sessionResult === null) {
            throw new Error("Session not found");
        }

        const session = sessionResult;
        if(session.revoked) {
            throw new Error("Session is revoked");
        }

        const isValidRefreshToken = await bcrypt.compare(refreshToken, session.refresh_token_hash);
        if (!isValidRefreshToken) {
            throw new Error("Invalid refresh token");
        }

        const newRefreshToken = jwt.sign({
            userId: decoded.userId,
            sessionId: session.id
        }, config.JWT_SECRET, { expiresIn: '7d' });
        const newRefreshTokenHash = await bcrypt.hash(newRefreshToken, 10);

        await sessionQueries.updateSessionRefreshToken(session.id, newRefreshTokenHash);

        const newAccessToken = jwt.sign({
            userId: decoded.userId,
            sessionId: session.id
        }, config.JWT_SECRET, { expiresIn: '15m' });

        return {
            userId: decoded.userId,
            accessToken: newAccessToken,
            refreshToken: newRefreshToken
        };
    }
    catch (error) {
        console.error(error);
        throw error;
    }
}

async function logout(refreshToken) {
    try{
        const decoded = jwt.verify(refreshToken, config.JWT_SECRET);
        await sessionQueries.revokeSession(decoded.sessionId);
    }
    catch (error) {
        console.error(error);
        throw error;
    }
}

module.exports = {
    register,
    getme,
    refreshToken,
    logout
};