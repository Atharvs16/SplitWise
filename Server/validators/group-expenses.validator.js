const { z } = require("zod");

const uuidSchema = z.string().uuid();

const createExpenseSchema = z.object({
    description: z.string().trim().min(1).max(255),
    amount: z.number().int().positive().safe(),
    split: z.discriminatedUnion("type", [
        z.object({
            type: z.literal("equal"),
            userIds: z.array(uuidSchema).min(1)
        }),
        z.object({
            type: z.literal("amount"),
            shares: z.array(z.object({
                userId: uuidSchema,
                amount: z.number().int().min(0).safe()
            })).min(1)
        }),
        z.object({
            type: z.literal("percentage"),
            shares: z.array(z.object({
                userId: uuidSchema,
                percentage: z.number().min(0).max(100).finite()
            })).min(1)
        })
    ])
});

const createSettlementSchema = z.object({
    paidBy: uuidSchema,
    amount: z.number().int().positive().safe()
});

const requestSettlementSchema = z.object({
    paidTo: uuidSchema,
    amount: z.number().int().positive().safe()
});

const createInvitationSchema = z.object({
    invitedUserId: uuidSchema.optional(),
    invitedPhone: z.string().trim().min(1).max(15).optional()
}).refine(value => Boolean(value.invitedUserId) !== Boolean(value.invitedPhone), {
    message: "Provide exactly one of invitedUserId or invitedPhone."
});

function validateUuidParams(...names) {
    return (req, res, next) => {
        for (const name of names) {
            if (!uuidSchema.safeParse(req.params[name]).success) {
                return res.status(400).json({ error: `Invalid ${name}.` });
            }
        }
        next();
    };
}

function validateBody(schema) {
    return (req, res, next) => {
        const result = schema.safeParse(req.body);
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
    };
}

function validateSettlementList(req, res, next) {
    if (req.query.direction && !["incoming", "outgoing"].includes(req.query.direction)) {
        return res.status(400).json({ error: "Direction must be incoming or outgoing." });
    }
    if (req.query.status && !["requested", "accepted"].includes(req.query.status)) {
        return res.status(400).json({ error: "Status must be requested or accepted." });
    }
    next();
}

module.exports = {
    validateUuidParams,
    validateCreateExpense: validateBody(createExpenseSchema),
    validateCreateSettlement: validateBody(createSettlementSchema),
    validateRequestSettlement: validateBody(requestSettlementSchema),
    validateCreateInvitation: validateBody(createInvitationSchema),
    validateSettlementList
};
