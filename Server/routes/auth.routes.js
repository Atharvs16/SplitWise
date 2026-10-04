const express = require("express");
const router = express.Router();
const cookieparser = require("cookie-parser");
const authcontroller = require("../controllers/auth.controller");

router.use(express.json());
router.use(cookieparser());

router.post("/signup", authcontroller.register);


module.exports = router;


router.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
        return res.status(400).send({
            message: "Invalid JSON format"
        });
    }

    next(err);
});