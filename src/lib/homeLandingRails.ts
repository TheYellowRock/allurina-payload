/** Merchandising collection slug for the “Summer !” home rail (Payload `collections`). */
export const HOME_SUMMER_COLLECTION_SLUG = "summer" as const

export const HOME_OUTLET_COLLECTION_SLUG = "outlet" as const

export const HOME_TOP_SALES_TAG_SLUG = "top" as const

/** When no tag with slug `top` exists, resolve by id (legacy / hand-seeded DBs). */
export const HOME_TOP_SALES_TAG_FALLBACK_ID = 8 as const
