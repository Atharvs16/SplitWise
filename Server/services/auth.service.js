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
        
        const refreshToken = jwt.sign({
            phone: user.phone,
        }, config.JWT_SECRET, { expiresIn: '7d' }
        );
    
        const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
        const session = await sessionQueries.createSession(
            user.id,
            refreshTokenHash,
            ip,
            userAgent
        );
    
        const accessToken = jwt.sign(
            {
                phone: user.phone,
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

async function getme(token) {
    try{
        const decoded = jwt.verify(token, config.JWT_SECRET);
        const user = await userQueries.getUserByPhone(decoded.phone);
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

module.exports = {
    register,
    getme
};