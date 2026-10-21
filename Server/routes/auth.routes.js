const express = require("express");
const router = express.Router();
const cookieparser = require("cookie-parser");
const authcontroller = require("../controllers/auth.controller");
const validator = require("../validators/auth.validator");

router.use(express.json());
router.use(cookieparser());

router.post("/signup", validator.validateRegister, authcontroller.register);
router.get("/check-username", authcontroller.checkUsername);
router.get("/getme", authcontroller.getme);
router.post("/login", authcontroller.login)
router.post("/refresh-token", authcontroller.refreshToken);
router.post("/logout", authcontroller.logout);

module.exports = router;


router.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
        return res.status(400).send({
            message: "Invalid JSON format"
        });
    }

    next(err);
});