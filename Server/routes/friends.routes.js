const express = require("express");
const router = express.Router();
const cookieparser = require("cookie-parser");
const friendsController = require("../controllers/friends.controller");
const friendExpensesController = require("../controllers/friend-expenses.controller");
const friendExpensesValidator = require("../validators/friend-expenses.validator");

router.use(express.json());
router.use(cookieparser());

router.post("/search-add-friend", friendsController.searchAddFriend);
router.post("/add-friend", friendsController.addFriend);
router.get("/requests", friendsController.getRequests);
router.post(
    "/requests/:requestId/:action",
    friendExpensesValidator.validateRequestId,
    friendsController.changeFriendStatus
);
router.get("/", friendsController.getFriendsWithExpense);
router.get("/settlements", friendExpensesController.listSettlements);
router.get("/settlement-requests", friendExpensesController.listSettlementRequests);
router.post(
    "/settlement-requests/:requestId/accept",
    friendExpensesValidator.validateRequestId,
    friendExpensesController.acceptSettlementRequest
);
router.delete(
    "/settlement-requests/:requestId",
    friendExpensesValidator.validateRequestId,
    friendExpensesController.cancelSettlementRequest
);
router.get(
    "/:friendId/expenses",
    friendExpensesValidator.validateParams,
    friendExpensesController.listExpenses
);
router.post(
    "/:friendId/expenses",
    friendExpensesValidator.validateParams,
    friendExpensesValidator.validateCreateExpense,
    friendExpensesController.createExpense
);
router.get(
    "/:friendId/expenses/:expenseId",
    friendExpensesValidator.validateParams,
    friendExpensesController.getExpense
);
router.post(
    "/:friendId/expenses/:expenseId/settlements",
    friendExpensesValidator.validateParams,
    friendExpensesValidator.validateSettlement,
    friendExpensesController.recordSettlement
);
router.post(
    "/:friendId/expenses/:expenseId/settlement-requests",
    friendExpensesValidator.validateParams,
    friendExpensesValidator.validateSettlement,
    friendExpensesController.requestSettlement
);

module.exports = router;

router.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
        return res.status(400).send({
            message: "Invalid JSON format"
        });
    }

    next(err);
});