/** Desktop row + mobile drawer link styles */
export const NAV = {
  link: "block rounded-none px-3 py-2.5 text-sm font-medium text-stone-800 outline-none transition-colors hover:bg-stone-100 hover:text-stone-900",
  linkInactive: "text-stone-700",
  trigger:
    "h-10 rounded-none px-3 text-sm font-medium text-stone-800 outline-none transition-colors hover:bg-stone-100 data-open:bg-stone-100",
  submenu:
    "mt-1.5 overflow-hidden rounded-none bg-white py-1 shadow-xl ring-1 ring-stone-900/[0.06]",
  drawerLink:
    "flex min-h-11 items-center rounded-none px-1 py-2.5 text-sm font-medium text-stone-800 outline-none transition-colors hover:bg-stone-100 active:bg-stone-100/80",
  sectionLabel:
    "mb-2 px-1 text-[10px] font-semibold tracking-[0.22em] text-stone-500 uppercase",
} as const
