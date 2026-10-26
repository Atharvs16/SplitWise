const { z } = require("zod");

const uuidSchema = z.string().uuid();

const createExpenseSchema = z.object({
    description: z.string().trim().min(1).max(255),
    amount: z.number().int().positive().safe(),
    split: z.discriminatedUnion("type", [
        z.object({
            type: z.literal("half")
        }),
        z.object({
            type: z.literal("amount"),
            friendAmount: z.number().int().min(0).safe()
        }),
        z.object({
            type: z.literal("percentage"),
            friendPercentage: z.number().min(0).max(100).finite()
        })
    ])
});

const settlementSchema = z.object({
    amount: z.number().int().positive().safe()
});

function validateParams(req, res, next) {
    const friendId = uuidSchema.safeParse(req.params.friendId);
    const expenseId = req.params.expenseId
        ? uuidSchema.safeParse(req.params.expenseId)
        : null;

    if (!friendId.success || (expenseId && !expenseId.success)) {
        return res.status(400).json({ error: "Invalid friend or expense ID." });
    }

    next();
}

function validateCreateExpense(req, res, next) {
    const result = createExpenseSchema.safeParse(req.body);
    if (!result.success) {
        return res.status(400).json({
            error: "Validation failed",
            details: result.error.issues.map(issue => ({
                field: issue.path.join("."),
                message: issue.message
            }))
        });
    }

    req.body = result.data;
    next();
}

function validateSettlement(req, res, next) {
    const result = settlementSchema.safeParse(req.body);
    if (!result.success) {
        return res.status(400).json({
            error: "Validation failed",
            details: result.error.issues.map(issue => ({
                field: issue.path.join("."),
                message: issue.message
            }))
        });
    }

    req.body = result.data;
    next();
}

function validateRequestId(req, res, next) {
    if (!uuidSchema.safeParse(req.params.requestId).success) {
        return res.status(400).json({ error: "Invalid settlement request ID." });
    }

    next();
}

module.exports = {
    validateParams,
    validateCreateExpense,
    validateSettlement,
    validateRequestId
};
