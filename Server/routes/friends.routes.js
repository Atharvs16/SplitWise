const express = require("express");
const router = express.Router();
const cookieparser = require("cookie-parser");
const friendsController = require("../controllers/friends.controller");

router.use(express.json());
router.use(cookieparser());

router.post("/search-add-friend", friendsController.searchAddFriend);

module.exports = router;

router.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
        return res.status(400).send({
            message: "Invalid JSON format"
        });
    }

    next(err);
});