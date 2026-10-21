const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const userQueries = require('../queries/users.queries');
const sessionQueries = require('../queries/services.queries');

const config = require('../config/config');

async function register({ name, phone, username, password, ip, userAgent }) {
    try{
        const Password_hash = await bcrypt.hash(password, 10);
    
        const user = await userQueries.createUser(
            name,
            phone,
            username,
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
            username: user.username,
            accessToken,
            refreshToken
        };

    }

    catch (error) {
        console.error(error);
        if (error.detail === `Key (username)=(${username}) already exists.`) { // Unique violation
            throw new Error(`Username ${username} already exists.`);
        }
        if (error.detail === `Key (phone)=(${phone}) already exists.`){
            throw new Error(`Phone ${phone} already exists.`);
            
        }
        if (error.constraint === 'chk_users_phone_format') { // Phone format violation
            throw new Error("Invalid phone number format");
        }
        throw error;
    }
}


async function login({ username, phone, password, ip, userAgent }) {
    try {
        if ((!username && !phone) || (username && phone)) {
            return {
                statusCode: 400,
                success: false,
                message: "Provide either username or phone, not both."
            };
        }
        if (typeof password !== "string" || !password.trim()) {
            return {
                statusCode: 400,
                success: false,
                message: "Password is required."
            };
        }
        if ((username !== undefined && typeof username !== "string") || (phone !== undefined && typeof phone !== "string")) {
            return {
                statusCode: 400,
                success: false,
                message: "Invalid login credentials format."
            };
        }
        
        const identifier = username
            ? username.trim()
            : phone.trim();

        if (!identifier) {
            return {
                statusCode: 400,
                success: false,
                message: "Username or phone is required."
            };
        }

        
        const user = username
            ? await userQueries.getUserByUsername(identifier)
            : await userQueries.getUserByPhone(identifier);

        console.log("Fetched user:", user);
        if (!user || !user.password_hash) {
            return {
                statusCode: 401,
                success: false,
                message: "Invalid username/phone or password."
            };
        }

        console.log(user.password_hash);
        console.log(password);

        
        const isMatch = await bcrypt.compare(
            password,
            user.password_hash
        );

        console.log(isMatch);

        if (!isMatch) {
            return {
                statusCode: 401,
                success: false,
                message: "Invalid username/phone or password."
            };
        }

        // Add account-status checks here if your app supports them.
        // For example, disabled or unverified accounts.

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
            statusCode: 200,
            success: true,
            message: "Login successful.",
            id: user.id,
            name: user.name,
            phone: user.phone,
            username: user.username,
            accessToken,
            refreshToken
        };

    } catch (err) {
        console.error("Login error:", err);

        return {
            statusCode: 500,
            success: false,
            message: "An unexpected error occurred."
        };
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
            const error = new Error("Session is revoked or not found");
            error.name = "UnauthorizedError";
            throw error;
        }
        const user = await userQueries.getUserById(decoded.userId);
        if (!user) {
            throw new Error("User not found");
        }
        return user;
    }
    catch (error) {
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
        
        const newAccessToken = jwt.sign({
            userId: decoded.userId,
            sessionId: session.id
        }, config.JWT_SECRET, { expiresIn: '15m' });
        
        const user = await userQueries.getUserById(decoded.userId);

        return {
            user: {
                name: user.name,
                username: user.username,
                phone: user.phone
            },
            accessToken: newAccessToken,
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
    login,
    getme,
    refreshToken,
    logout
};