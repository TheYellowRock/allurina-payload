"use client"

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from "react"

import { readCartFromStorage, writeCartToStorage } from "@/lib/cart/persist"
import type { CartAddPayload, CartLineItem } from "@/lib/cart/types"
import { computeCartPricing, type CartPricingBreakdown } from "@/lib/cart/pricing"
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

const initialState: CartState = {
  items: [],
  open: false,
  hydrated: false,
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
  openCart: () => void
  closeCart: () => void
  toggleCart: () => void
  addItem: (payload: CartAddPayload) => void
  setQuantity: (productId: string, quantity: number) => void
  removeItem: (productId: string) => void
  clearCart: () => void
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
      openCart: () => dispatch({ type: "OPEN" }),
      closeCart: () => dispatch({ type: "CLOSE" }),
      toggleCart: () => dispatch({ type: "TOGGLE" }),
      addItem: (payload) => dispatch({ type: "ADD", payload }),
      setQuantity: (productId, quantity) =>
        dispatch({ type: "SET_QTY", productId, quantity }),
      removeItem: (productId) => dispatch({ type: "REMOVE", productId }),
      clearCart: () => dispatch({ type: "CLEAR" }),
    }
  }, [state.items, state.open, state.hydrated])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext)
  if (!ctx) {
    throw new Error("useCart must be used within CartProvider")
  }
  return ctx
}
