const express = require("express");
const router = express.Router();
const cookieparser = require("cookie-parser");
const validator = require("../validators/groups.validator");
const groupExpenseValidator = require("../validators/group-expenses.validator");
const groupsController = require("../controllers/groups.controller");

router.use(express.json());
router.use(cookieparser());

router.post("/create", validator.validateCreateGroup, groupsController.createGroup);
router.get(
    "/settlement-requests",
    groupExpenseValidator.validateSettlementList,
    groupsController.listGroupSettlementRequests
);
router.post(
    "/settlement-requests/:requestId/accept",
    groupExpenseValidator.validateUuidParams("requestId"),
    groupsController.acceptGroupSettlementRequest
);
router.delete(
    "/settlement-requests/:requestId",
    groupExpenseValidator.validateUuidParams("requestId"),
    groupsController.cancelGroupSettlementRequest
);
router.get("/invitations", groupsController.listIncomingInvitations);
router.post(
    "/invitations/:invitationId/:action",
    groupExpenseValidator.validateUuidParams("invitationId"),
    groupsController.respondToInvitation
);
router.get("/", groupsController.getGroups);
router.get(
    "/:groupId/invitations",
    groupExpenseValidator.validateUuidParams("groupId"),
    groupsController.listGroupInvitations
);
router.post(
    "/:groupId/invitations",
    groupExpenseValidator.validateUuidParams("groupId"),
    groupExpenseValidator.validateCreateInvitation,
    groupsController.createInvitation
);
router.get(
    "/:groupId",
    groupExpenseValidator.validateUuidParams("groupId"),
    groupsController.getGroupOverview
);
router.get(
    "/:groupId/expenses",
    groupExpenseValidator.validateUuidParams("groupId"),
    groupsController.listGroupExpenses
);
router.post(
    "/:groupId/expenses",
    groupExpenseValidator.validateUuidParams("groupId"),
    groupExpenseValidator.validateCreateExpense,
    groupsController.createGroupExpense
);
router.post(
    "/:groupId/expenses/:expenseId/settlements",
    groupExpenseValidator.validateUuidParams("groupId", "expenseId"),
    groupExpenseValidator.validateCreateSettlement,
    groupsController.createExpenseSettlement
);
router.post(
    "/:groupId/expenses/:expenseId/settlement-requests",
    groupExpenseValidator.validateUuidParams("groupId", "expenseId"),
    groupExpenseValidator.validateRequestSettlement,
    groupsController.requestExpenseSettlement
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