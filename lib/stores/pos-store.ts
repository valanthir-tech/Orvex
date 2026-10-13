import { create } from 'zustand';

export interface CartItem {
  item_code: string;
  item_name: string;
  rate: number;
  qty: number;
  discount: number;
  amount: number;
}

export interface HeldCart {
  id: string;
  timestamp: string;
  customer: string;
  items: CartItem[];
  total: number;
}

interface POSState {
  cart: CartItem[];
  heldCarts: HeldCart[];
  customer: string;
  searchQuery: string;
  selectedCategory: string;
  isPaymentModalOpen: boolean;
  paymentMethod: 'cash' | 'fonepay';
  cashTendered: number;
  lastCompletedSale: any | null;

  // Actions
  addItem: (item: { item_code: string; item_name: string; rate: number }) => void;
  removeItem: (item_code: string) => void;
  updateQty: (item_code: string, delta: number) => void;
  clearCart: () => void;
  holdCurrentCart: () => void;
  resumeCart: (id: string) => void;
  setCustomer: (customer: string) => void;
  setSearchQuery: (query: string) => void;
  setSelectedCategory: (category: string) => void;
  setPaymentModalOpen: (open: boolean) => void;
  setPaymentMethod: (method: 'cash' | 'fonepay') => void;
  setCashTendered: (amount: number) => void;
  completeSale: () => any;
}

export const usePOSStore = create<POSState>((set, get) => ({
  cart: [],
  heldCarts: [],
  customer: 'Walk-in Customer',
  searchQuery: '',
  selectedCategory: 'All',
  isPaymentModalOpen: false,
  paymentMethod: 'cash',
  cashTendered: 0,
  lastCompletedSale: null,

  addItem: (item) => {
    const { cart } = get();
    const existing = cart.find((i) => i.item_code === item.item_code);
    if (existing) {
      set({
        cart: cart.map((i) =>
          i.item_code === item.item_code
            ? { ...i, qty: i.qty + 1, amount: (i.qty + 1) * i.rate }
            : i
        ),
      });
    } else {
      set({
        cart: [...cart, { ...item, qty: 1, discount: 0, amount: item.rate }],
      });
    }
  },

  removeItem: (item_code) => {
    set({ cart: get().cart.filter((i) => i.item_code !== item_code) });
  },

  updateQty: (item_code, delta) => {
    const { cart } = get();
    set({
      cart: cart
        .map((i) => {
          if (i.item_code === item_code) {
            const newQty = Math.max(0, i.qty + delta);
            return { ...i, qty: newQty, amount: newQty * i.rate };
          }
          return i;
        })
        .filter((i) => i.qty > 0),
    });
  },

  clearCart: () => set({ cart: [], cashTendered: 0 }),

  holdCurrentCart: () => {
    const { cart, customer, heldCarts } = get();
    if (cart.length === 0) return;

    const subtotal = cart.reduce((a, b) => a + b.amount, 0);
    const newHold: HeldCart = {
      id: `HOLD-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
      customer,
      items: [...cart],
      total: subtotal * 1.13, // with 13% VAT
    };

    set({
      heldCarts: [...heldCarts, newHold],
      cart: [],
      customer: 'Walk-in Customer',
    });
  },

  resumeCart: (id) => {
    const { heldCarts, cart } = get();
    const toResume = heldCarts.find((h) => h.id === id);
    if (!toResume) return;

    set({
      cart: toResume.items,
      customer: toResume.customer,
      heldCarts: heldCarts.filter((h) => h.id !== id),
    });
  },

  setCustomer: (customer) => set({ customer }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setSelectedCategory: (selectedCategory) => set({ selectedCategory }),
  setPaymentModalOpen: (isPaymentModalOpen) => set({ isPaymentModalOpen }),
  setPaymentMethod: (paymentMethod) => set({ paymentMethod }),
  setCashTendered: (cashTendered) => set({ cashTendered }),

  completeSale: () => {
    const { cart, customer, paymentMethod, cashTendered } = get();
    const netTotal = cart.reduce((a, b) => a + b.amount, 0);
    const vat = Math.round(netTotal * 0.13);
    const grandTotal = netTotal + vat;

    const completed = {
      id: `POS-${Date.now().toString().slice(-6)}`,
      date: new Date().toISOString(),
      customer,
      items: [...cart],
      netTotal,
      vat,
      grandTotal,
      paymentMethod,
      cashTendered: paymentMethod === 'cash' ? cashTendered : grandTotal,
      change: paymentMethod === 'cash' ? Math.max(0, cashTendered - grandTotal) : 0,
    };

    set({
      lastCompletedSale: completed,
      cart: [],
      cashTendered: 0,
      isPaymentModalOpen: false,
    });

    return completed;
  },
}));
