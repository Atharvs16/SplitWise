const authService = require("../services/auth.service");

async function register(req, res) {
    const result = await authService.register({
        name: req.body.name,
        phone: req.body.phone,
        password: req.body.password,
        ip: req.ip,
        userAgent: req.get("User-Agent")
    });


    res.status(201).json({
        user: {
            id: result.id,
            name: result.name,
            phone: result.phone
        }
    });
}

module.exports = {
    register
};