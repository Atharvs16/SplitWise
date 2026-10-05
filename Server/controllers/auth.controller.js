const e = require("express");
const authService = require("../services/auth.service");

async function register(req, res) {

    try{
        const result = await authService.register({
            name: req.body.name,
            phone: req.body.phone,
            password: req.body.password,
            ip: req.ip,
            userAgent: req.get("User-Agent")
        });

        res.cookie('refreshtoken', result.refreshToken, {
                httpOnly: true,
                secure: true,
                sameSite: 'strict',
                maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });
    
    
        res.status(201).json({
            user: {
                id: result.id,
                name: result.name,
                phone: result.phone
            },
            accessToken: result.accessToken
        });
    }

    catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message || "Database error" });
    }
}

async function getme(req, res) {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ error: "No token provided" });
    }

    try{
        const user = await authService.getme(token);
        res.status(200).json({ user });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message || "Database error" });
    }
}

async function refreshToken(req, res) {
    const refreshToken = req.cookies.refreshtoken;
    if (!refreshToken) {
        return res.status(401).json({ error: "No refresh token provided" });
    }

    try{
        const result = await authService.refreshToken(refreshToken);

        res.cookie('refreshtoken', result.refreshToken, {
            httpOnly: true,
            secure: true,
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        res.status(200).json({
            userId: result.userId,
            accessToken: result.accessToken
        });
    }
    catch (error) {
        console.error(error);
        if (error.name === "TokenExpiredError") {
            return res.status(401).json({
                error: "Refresh token expired"
            });
        }

        if (error.name === "JsonWebTokenError") {
            return res.status(401).json({
                error: "Invalid refresh token"
            });
        }

        return res.status(500).json({
            error: error.message || "Database error"
        });
    }
}

module.exports = {
    register,
    getme,
    refreshToken
};