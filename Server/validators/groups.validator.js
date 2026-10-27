const { z } = require("zod");

const createGroupSchema = z.object({
    name: z
        .string()
        .trim()
        .min(2, "Group name must be at least 2 characters")
        .max(50, "Group name must be at most 50 characters"),
    description: z
        .string()
        .trim()
        .max(200, "Group description must be at most 200 characters"),
    memberIds: z
        .array(z.string().uuid())
        .max(50, "A group can include at most 50 friends")
        .optional()
        .refine(memberIds => !memberIds || new Set(memberIds).size === memberIds.length, {
            message: "Each friend can only be added once"
        })
});

function validateCreateGroup(req, res, next) {
    const result = createGroupSchema.safeParse(req.body);

    if (!result.success) {
        return res.status(400).json({
            error: "Validation failed",
            details: result.error.issues.map(issue => ({
                field: issue.path[0],
                message: issue.message
            }))
        });
    }

    req.body = result.data;

    next();
};

module.exports = {
    validateCreateGroup
};