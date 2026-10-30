const db = require("../config/db");

async function listRecentActivity(userId) {
    const result = await db.query(
        `WITH activities AS (
             SELECT
                 'expense'::text AS activity_type,
                 e.id::text AS id,
                 e.description AS title,
                 e.amount::text AS amount,
                 e.created_at,
                 COALESCE(g.name, 'Personal expenses') AS context,
                 payer.name AS actor_name,
                 e.paid_by = $1::uuid AS actor_is_current_user,
                 CASE
                     WHEN e.group_id IS NULL THEN (
                         SELECT other_user.name
                         FROM expense_splits other_split
                         JOIN users other_user ON other_user.id = other_split.user_id
                         WHERE other_split.expense_id = e.id
                           AND other_split.user_id <> $1::uuid
                         ORDER BY other_user.name
                         LIMIT 1
                     )
                     ELSE NULL
                 END AS counterparty_name,
                 NULL::text AS status
             FROM expenses e
             JOIN users payer ON payer.id = e.paid_by
             LEFT JOIN groups g ON g.id = e.group_id
             WHERE (
                 (e.group_id IS NULL AND (
                     e.paid_by = $1::uuid
                     OR EXISTS (
                         SELECT 1
                         FROM expense_splits own_split
                         WHERE own_split.expense_id = e.id
                           AND own_split.user_id = $1::uuid
                     )
                 ))
                 OR (e.group_id IS NOT NULL AND EXISTS (
                     SELECT 1
                     FROM group_members gm
                     WHERE gm.group_id = e.group_id
                       AND gm.user_id = $1::uuid
                 ))
             )

             UNION ALL

             SELECT
                 'settlement'::text AS activity_type,
                 st.id::text AS id,
                 e.description AS title,
                 st.amount::text AS amount,
                 st.created_at,
                 COALESCE(g.name, 'Personal settlement') AS context,
                 payer.name AS actor_name,
                 st.paid_by = $1::uuid AS actor_is_current_user,
                 CASE
                     WHEN st.paid_by = $1::uuid THEN recipient.name
                     ELSE payer.name
                 END AS counterparty_name,
                 st.status::text AS status
             FROM settlements st
             JOIN expenses e ON e.id = st.expense_id
             JOIN users payer ON payer.id = st.paid_by
             JOIN users recipient ON recipient.id = st.paid_to
             LEFT JOIN groups g ON g.id = st.group_id
             WHERE (st.paid_by = $1::uuid OR st.paid_to = $1::uuid)
               AND (
                   st.group_id IS NULL
                   OR EXISTS (
                       SELECT 1
                       FROM group_members gm
                       WHERE gm.group_id = st.group_id
                         AND gm.user_id = $1::uuid
                   )
               )
         )
         SELECT
             id,
             activity_type,
             title,
             amount,
             created_at,
             context,
             actor_name,
             actor_is_current_user,
             counterparty_name,
             status
         FROM activities
         ORDER BY created_at DESC
         LIMIT 10`,
        [userId]
    );

    return result.rows;
}

module.exports = { listRecentActivity };
