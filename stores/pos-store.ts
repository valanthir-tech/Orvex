import { create } from 'zustand';
import { db, CartItem, Order } from '@/lib/db';
import { v7 as uuidv7 } from 'uuid';
import { POS_DEFAULT_CUSTOMER } from '@/lib/constants';

// ----------------------------------------------------------------------
// TYPES
// ----------------------------------------------------------------------

interface PosState {
    // Cart
    cart: CartItem[];
    customerName: string;
    customerPan: string;

    // Last completed order (for receipt)
    lastOrder: Order | null;

    // Actions
    addToCart: (item: { id: string; name: string; sku: string; price: number; stock: number }) => void;
    removeFromCart: (productId: string) => void;
    updateQuantity: (productId: string, newQty: number) => void;
    applyDiscount: (productId: string, pct: number) => void;
    overridePrice: (productId: string, newPrice: number) => void;
    clearCart: () => void;
    setCustomer: (name: string, pan: string) => void;

    // Computed
    getTotals: () => { subTotal: number; taxRate: number; tax: number; total: number; itemCount: number; discount: number };

    // Checkout
    checkout: (paymentMode: 'CASH' | 'CARD' | 'QR' | 'CREDIT', paidAmount: number) => Promise<Order>;
}

// Nepal VAT rate
const TAX_RATE = 0.13;

// ----------------------------------------------------------------------
// STORE
// ----------------------------------------------------------------------

export const usePosStore = create<PosState>((set, get) => ({
    cart: [],
    customerName: '',
    customerPan: '',
    lastOrder: null,

    addToCart: (item) => set((state) => {
        const existing = state.cart.find((i) => i.productId === item.id);
        if (existing) {
            return {
                cart: state.cart.map((i) =>
                    i.productId === item.id ? { ...i, quantity: i.quantity + 1 } : i
                ),
            };
        }
        return {
            cart: [...state.cart, {
                productId: item.id,
                name: item.name,
                sku: item.sku,
                price: item.price,
                quantity: 1,
                discount: 0,
            }],
        };
    }),

    removeFromCart: (productId) => set((state) => ({
        cart: state.cart.filter((i) => i.productId !== productId),
    })),

    updateQuantity: (productId, newQty) => set((state) => {
        if (newQty <= 0) {
            return { cart: state.cart.filter((i) => i.productId !== productId) };
        }
        return {
            cart: state.cart.map((i) =>
                i.productId === productId ? { ...i, quantity: newQty } : i
            ),
        };
    }),

    applyDiscount: (productId, pct) => set((state) => ({
        cart: state.cart.map((i) =>
            i.productId === productId ? { ...i, discount: Math.min(100, Math.max(0, pct)) } : i
        ),
    })),

    overridePrice: (productId, newPrice) => set((state) => ({
        cart: state.cart.map((i) =>
            i.productId === productId ? { ...i, price: Math.max(0, newPrice) } : i
        ),
    })),

    clearCart: () => set({ cart: [], customerName: '', customerPan: '' }),

    setCustomer: (name, pan) => set({ customerName: name, customerPan: pan }),

    getTotals: () => {
        const { cart } = get();
        const subTotal = cart.reduce((acc, item) => {
            const itemTotal = item.price * item.quantity;
            const discountAmount = itemTotal * (item.discount / 100);
            return acc + (itemTotal - discountAmount);
        }, 0);
        const discount = cart.reduce((acc, item) => {
            return acc + (item.price * item.quantity * (item.discount / 100));
        }, 0);
        const tax = subTotal * TAX_RATE;
        const total = subTotal + tax;
        const itemCount = cart.reduce((acc, item) => acc + item.quantity, 0);
        return { subTotal, taxRate: TAX_RATE, tax, total, itemCount, discount };
    },

    checkout: async (paymentMode, paidAmount) => {
        const state = get();
        const totals = state.getTotals();
        const orderUuid = uuidv7();

        if (state.cart.length === 0) throw new Error('Cart is empty');

        const order: Order = {
            uuid: orderUuid,
            status: 'completed',
            customerName: state.customerName || POS_DEFAULT_CUSTOMER,
            customerPan: state.customerPan,
            subTotal: totals.subTotal,
            taxRate: totals.taxRate,
            taxTotal: totals.tax,
            grandTotal: totals.total,
            discountTotal: totals.discount,
            products: [...state.cart],
            paymentMode,
            paidAmount,
            changeAmount: Math.max(0, paidAmount - totals.total),
            createdAt: new Date(),
            syncRetries: 0,
        };

        await db.orders.add(order);

        // Deduct stock locally
        for (const cartItem of state.cart) {
            const dbItem = await db.products.get(cartItem.productId);
            if (dbItem) {
                await db.products.update(cartItem.productId, {
                    stock: Math.max(0, dbItem.stock - cartItem.quantity),
                });
            }
        }

        // Set lastOrder for receipt display, then clear cart
        set({ lastOrder: order, cart: [], customerName: '', customerPan: '' });

        return order;
    },
}));
