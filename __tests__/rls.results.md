# RLS Policy Audit — Live Supabase Results

Run date: 2026-07-19

## Policies on `assessment_templates`

| Policy name | Command | USING clause |
|---|---|---|
| `assessment_templates_read` | SELECT | `true` (open to all) |
| `assessment_templates_superadmin_write` | ALL | `EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true)` |
| `assessment_templates_member_write` | ALL | `academy_id IN (SELECT academy_id FROM academy_members WHERE user_id = auth.uid() AND role = ANY (ARRAY['manager','coach']))` |

## Test results

| # | Test | Result |
|---|---|---|
| 1 | Read policy is open (true) — all templates visible | PASS |
| 2 | Superadmin write policy references `users.is_admin` | PASS |
| 3 | Member write policy covers both `coach` AND `manager` roles | PASS |
| 4 | Old broad `assessment_templates_write` policy is gone | PASS |
| 5 | Superadmin can UPDATE a system default template | PASS |
| 6 | Member write policy academy scope is correct | PASS (informational) |
| 7 | Exactly 3 RLS policies exist on `assessment_templates` | PASS |
| 8 | delete guard correctly identifies 0-row result as a policy block | PASS |

All 8 DB assertions passed with no RAISE EXCEPTION raised.
