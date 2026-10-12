/**
 * Manual per-unit cost assumption for the "Marge estimée" UI (order rows + Métriques
 * aggregate). This is NOT recorded COGS — there is no per-product cost field anywhere in
 * this codebase — just a single flat number the operator can set to see rough margin
 * figures. Leave at 0 and every margin-related UI element stays fully hidden; set a real
 * per-scarf cost estimate (in DH) here to turn it on.
 */
export const ESTIMATED_UNIT_COST = 0
