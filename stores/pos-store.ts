import { create } from 'zustand';
import { db, CartItem, Order } from '@/lib/db';
import { v7 as uuidv7 } from 'uuid';

// ----------------------------------------------------------------------
// TYPES
// ----------------------------------------------------------------------

interface PosState {
    // Session State
    sessionId: number | null;
    isSessionOpen: boolean;

    // Cart State
    cart: CartItem[];

    // Active Transaction Meta
    customerName: string;
    customerPan: string;

    // Actions
    addToCart: (item: any) => void;
    removeFromCart: (itemId: string) => void;
    updateQuantity: (itemId: string, delta: number) => void;
    clearCart: () => void;
    setCustomer: (name: string, pan: string) => void;

    // Logic
    getTotals: () => { subTotal: number; tax: number; total: number; itemCount: number };
    checkout: (paymentMode: 'CASH' | 'CARD' | 'QR') => Promise<string>; // Returns Order UUID
}

// ----------------------------------------------------------------------
// STORE
// ----------------------------------------------------------------------

export const usePosStore = create<PosState>((set, get) => ({
    sessionId: null,
    isSessionOpen: false, // In a real app, check DB on load

    cart: [],
    customerName: '',
    customerPan: '',

    addToCart: (item) => set((state) => {
        const existing = state.cart.find((i) => i.itemId === item.id);
        if (existing) {
            return {
                cart: state.cart.map((i) =>
                    i.itemId === item.id ? { ...i, quantity: i.quantity + 1 } : i
                )
            };
        }
        return {
            cart: [...state.cart, {
                itemId: item.id,
                name: item.name,
                price: item.price,
                quantity: 1
            }]
        };
    }),

    removeFromCart: (itemId) => set((state) => ({
        cart: state.cart.filter((i) => i.itemId !== itemId)
    })),

    updateQuantity: (itemId, delta) => set((state) => {
        return {
            cart: state.cart.map((i) => {
                if (i.itemId === itemId) {
                    const newQty = Math.max(0, i.quantity + delta);
                    return { ...i, quantity: newQty };
                }
                return i;
            }).filter(i => i.quantity > 0) // Remove if 0
        };
    }),

    clearCart: () => set({ cart: [], customerName: '', customerPan: '' }),

    setCustomer: (name, pan) => set({ customerName: name, customerPan: pan }),

    getTotals: () => {
        const { cart } = get();
        const subTotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
        // Nepal VAT 13% hardcoded for now - move to config later
        const tax = subTotal * 0.13;
        const total = subTotal + tax;
        const itemCount = cart.reduce((acc, item) => acc + item.quantity, 0);

        return { subTotal, tax, total, itemCount };
    },

    checkout: async (paymentMode) => {
        const state = get();
        const totals = state.getTotals();
        const orderUuid = uuidv7();

        if (state.cart.length === 0) throw new Error("Cart is empty");

        // Persist to Dexie (Offline First)
        const order: Order = {
            uuid: orderUuid,
            status: 'completed',
            customerName: state.customerName,
            customerPan: state.customerPan,
            subTotal: totals.subTotal,
            taxTotal: totals.tax,
            grandTotal: totals.total,
            discountTotal: 0,
            items: state.cart,
            paymentMode,
            createdAt: new Date(),
        };

        await db.orders.add(order);

        // Clear Session
        state.clearCart();

        return orderUuid;
    }
}));
