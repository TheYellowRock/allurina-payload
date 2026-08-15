"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from "react"

import { readCartFromStorage, writeCartToStorage } from "@/lib/cart/persist"
import type { CartAddPayload, CartLineItem } from "@/lib/cart/types"
import { computeCartPricing, type CartPricingBreakdown } from "@/lib/cart/pricing"
import type { CartIssue } from "@/lib/cart/reconcile"
import {
  addOrMergeLine,
  cartItemCount,
  cartSubtotal,
  removeLine,
  setLineQuantity,
} from "@/lib/cart/merge-lines"

type CartState = {
  items: CartLineItem[]
  open: boolean
  hydrated: boolean
  /** Set by cart/checkout revalidation; persists until the user dismisses it. */
  validationIssues: CartIssue[]
}

type CartAction =
  | { type: "HYDRATE"; items: CartLineItem[] }
  | { type: "OPEN" }
  | { type: "CLOSE" }
  | { type: "TOGGLE" }
  | { type: "ADD"; payload: CartAddPayload }
  | { type: "SET_QTY"; productId: string; quantity: number }
  | { type: "REMOVE"; productId: string }
  | { type: "CLEAR" }
  | { type: "SET_ITEMS"; items: CartLineItem[] }
  | { type: "SET_VALIDATION_ISSUES"; issues: CartIssue[] }

const initialState: CartState = {
  items: [],
  open: false,
  hydrated: false,
  validationIssues: [],
}

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "HYDRATE":
      return { ...state, items: action.items, hydrated: true }
    case "OPEN":
      return { ...state, open: true }
    case "CLOSE":
      return { ...state, open: false }
    case "TOGGLE":
      return { ...state, open: !state.open }
    case "ADD":
      return { ...state, items: addOrMergeLine(state.items, action.payload) }
    case "SET_QTY":
      return {
        ...state,
        items: setLineQuantity(state.items, action.productId, action.quantity),
      }
    case "REMOVE":
      return { ...state, items: removeLine(state.items, action.productId) }
    case "CLEAR":
      return { ...state, items: [] }
    case "SET_ITEMS":
      return { ...state, items: action.items }
    case "SET_VALIDATION_ISSUES":
      return { ...state, validationIssues: action.issues }
    default:
      return state
  }
}

export type CartContextValue = {
  items: CartLineItem[]
  open: boolean
  hydrated: boolean
  itemCount: number
  /** Sum of cart line totals (unit price × quantity from Payload). */
  subtotal: number
  pricing: CartPricingBreakdown
  /** Cart/checkout revalidation findings (removed / price changed / stock reduced). */
  validationIssues: CartIssue[]
  openCart: () => void
  closeCart: () => void
  toggleCart: () => void
  addItem: (payload: CartAddPayload) => void
  setQuantity: (productId: string, quantity: number) => void
  removeItem: (productId: string) => void
  clearCart: () => void
  /** Wholesale replace — used to fold in `validateCart`/409 reconciliation results. */
  setItems: (items: CartLineItem[]) => void
  /** Replaces the current findings; pass `[]` to dismiss. */
  setValidationIssues: (issues: CartIssue[]) => void
}

const CartContext = createContext<CartContextValue | null>(null)

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, initialState)

  useEffect(() => {
    dispatch({ type: "HYDRATE", items: readCartFromStorage() })
  }, [])

  useEffect(() => {
    if (!state.hydrated) return
    writeCartToStorage(state.items)
  }, [state.items, state.hydrated])

  // `dispatch` from useReducer is referentially stable, so every action creator below is
  // too — none of them close over `state`. That stability matters: consumers (e.g. the
  // cart/checkout revalidation effects) put `setItems`/`setValidationIssues` in their own
  // effect dependency arrays, and a callback that changed identity on every cart mutation
  // would re-trigger those effects the instant they called it — which is exactly what
  // used to wipe the validation banner right after it set it.
  const openCart = useCallback(() => dispatch({ type: "OPEN" }), [])
  const closeCart = useCallback(() => dispatch({ type: "CLOSE" }), [])
  const toggleCart = useCallback(() => dispatch({ type: "TOGGLE" }), [])
  const addItem = useCallback((payload: CartAddPayload) => dispatch({ type: "ADD", payload }), [])
  const setQuantity = useCallback(
    (productId: string, quantity: number) => dispatch({ type: "SET_QTY", productId, quantity }),
    [],
  )
  const removeItem = useCallback(
    (productId: string) => dispatch({ type: "REMOVE", productId }),
    [],
  )
  const clearCart = useCallback(() => dispatch({ type: "CLEAR" }), [])
  const setItems = useCallback((items: CartLineItem[]) => dispatch({ type: "SET_ITEMS", items }), [])
  const setValidationIssues = useCallback(
    (issues: CartIssue[]) => dispatch({ type: "SET_VALIDATION_ISSUES", issues }),
    [],
  )

  const value = useMemo<CartContextValue>(() => {
    const itemCount = cartItemCount(state.items)
    const subtotal = cartSubtotal(state.items)
    const pricing = computeCartPricing(state.items)
    return {
      items: state.items,
      open: state.open,
      hydrated: state.hydrated,
      itemCount,
      subtotal,
      pricing,
      validationIssues: state.validationIssues,
      openCart,
      closeCart,
      toggleCart,
      addItem,
      setQuantity,
      removeItem,
      clearCart,
      setItems,
      setValidationIssues,
    }
  }, [
    state.items,
    state.open,
    state.hydrated,
    state.validationIssues,
    openCart,
    closeCart,
    toggleCart,
    addItem,
    setQuantity,
    removeItem,
    clearCart,
    setItems,
    setValidationIssues,
  ])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext)
  if (!ctx) {
    throw new Error("useCart must be used within CartProvider")
  }
  return ctx
}
