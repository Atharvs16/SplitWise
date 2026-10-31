const express = require("express");
const router = express.Router();
const usersController = require("../controllers/users.controller");

router.get("/:username", usersController.getProfile);
router.patch("/me", usersController.updateProfile);
router.delete("/me", usersController.deleteAccount);

module.exports = router;
