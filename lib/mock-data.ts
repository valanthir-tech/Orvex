/**
 * Mock Data Service Layer
 * 
 * All mock data and simulated async API calls live here.
 * Replace these with real API calls when backend is ready.
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export interface MockProduct {
  id: string
  name: string
  sku: string
  price: number
  cost: number
  stock: number
  minStock: number
  category: string
  image: string | null
  barcode: string | null
  isActive: boolean
  createdAt: string
}

export interface MockOrder {
  id: string
  invoice: string
  customer: string
  items: MockOrderItem[]
  subtotal: number
  tax: number
  total: number
  paymentMethod: "CASH" | "CARD" | "QR"
  status: "completed" | "pending" | "refunded"
  createdAt: string
}

export interface MockOrderItem {
  productId: string
  name: string
  qty: number
  price: number
  total: number
}

export interface MockStockAdjustment {
  id: string
  productId: string
  productName: string
  type: "add" | "remove"
  quantity: number
  reason: string
  date: string
  adjustedBy: string
}

export interface MockDashboardStats {
  todaySales: number
  monthlySales: number
  totalOrders: number
  lowStockCount: number
  todaySalesChange: number
  monthlySalesChange: number
  ordersChange: number
}

// ─── Mock Products ───────────────────────────────────────────────────────────

export const mockProducts: MockProduct[] = [
  {
    id: "prod-001",
    name: "Premium Hoodie",
    sku: "HOD-001",
    price: 3500,
    cost: 1800,
    stock: 50,
    minStock: 10,
    category: "Clothing",
    image: null,
    barcode: "8901234567890",
    isActive: true,
    createdAt: "2026-01-15",
  },
  {
    id: "prod-002",
    name: "Slim Fit Chinos",
    sku: "CHI-002",
    price: 2500,
    cost: 1200,
    stock: 40,
    minStock: 8,
    category: "Clothing",
    image: null,
    barcode: "8901234567891",
    isActive: true,
    createdAt: "2026-01-15",
  },
  {
    id: "prod-003",
    name: "Casual Polo Shirt",
    sku: "POL-003",
    price: 1800,
    cost: 800,
    stock: 60,
    minStock: 15,
    category: "Clothing",
    image: null,
    barcode: "8901234567892",
    isActive: true,
    createdAt: "2026-01-20",
  },
  {
    id: "prod-004",
    name: "Winter Jacket",
    sku: "JAC-004",
    price: 5500,
    cost: 3000,
    stock: 5,
    minStock: 10,
    category: "Clothing",
    image: null,
    barcode: "8901234567893",
    isActive: true,
    createdAt: "2026-01-22",
  },
  {
    id: "prod-005",
    name: "Cotton T-Shirt",
    sku: "TSH-005",
    price: 900,
    cost: 350,
    stock: 100,
    minStock: 20,
    category: "Clothing",
    image: null,
    barcode: "8901234567894",
    isActive: true,
    createdAt: "2026-01-25",
  },
  {
    id: "prod-006",
    name: "Denim Jeans",
    sku: "JEN-006",
    price: 2200,
    cost: 1100,
    stock: 3,
    minStock: 15,
    category: "Clothing",
    image: null,
    barcode: "8901234567895",
    isActive: true,
    createdAt: "2026-02-01",
  },
  {
    id: "prod-007",
    name: "Running Shoes",
    sku: "SHO-007",
    price: 4500,
    cost: 2500,
    stock: 15,
    minStock: 5,
    category: "Footwear",
    image: null,
    barcode: "8901234567896",
    isActive: true,
    createdAt: "2026-02-01",
  },
  {
    id: "prod-008",
    name: "Baseball Cap",
    sku: "CAP-008",
    price: 500,
    cost: 200,
    stock: 80,
    minStock: 20,
    category: "Accessories",
    image: null,
    barcode: "8901234567897",
    isActive: true,
    createdAt: "2026-02-05",
  },
  {
    id: "prod-009",
    name: "Leather Belt",
    sku: "BLT-009",
    price: 1200,
    cost: 500,
    stock: 2,
    minStock: 10,
    category: "Accessories",
    image: null,
    barcode: "8901234567898",
    isActive: true,
    createdAt: "2026-02-05",
  },
  {
    id: "prod-010",
    name: "Ankle Socks (3pk)",
    sku: "SOC-010",
    price: 450,
    cost: 150,
    stock: 150,
    minStock: 30,
    category: "Accessories",
    image: null,
    barcode: "8901234567899",
    isActive: true,
    createdAt: "2026-02-10",
  },
  {
    id: "prod-011",
    name: "Floral Summer Dress",
    sku: "DRS-011",
    price: 2800,
    cost: 1400,
    stock: 8,
    minStock: 12,
    category: "Clothing",
    image: null,
    barcode: "8901234567900",
    isActive: true,
    createdAt: "2026-02-10",
  },
  {
    id: "prod-012",
    name: "Wool Scarf",
    sku: "SCF-012",
    price: 800,
    cost: 350,
    stock: 0,
    minStock: 10,
    category: "Accessories",
    image: null,
    barcode: "8901234567901",
    isActive: true,
    createdAt: "2026-02-12",
  },
]

// ─── Mock Orders ─────────────────────────────────────────────────────────────

export const mockOrders: MockOrder[] = [
  {
    id: "ord-001",
    invoice: "#INV-1234",
    customer: "Priya Maharjan",
    items: [
      { productId: "prod-001", name: "Premium Hoodie", qty: 2, price: 3500, total: 7000 },
      { productId: "prod-008", name: "Baseball Cap", qty: 1, price: 500, total: 500 },
    ],
    subtotal: 7500,
    tax: 975,
    total: 8475,
    paymentMethod: "CASH",
    status: "completed",
    createdAt: "2026-02-19T10:30:00",
  },
  {
    id: "ord-002",
    invoice: "#INV-1233",
    customer: "Walk-in Customer",
    items: [
      { productId: "prod-005", name: "Cotton T-Shirt", qty: 3, price: 900, total: 2700 },
    ],
    subtotal: 2700,
    tax: 351,
    total: 3051,
    paymentMethod: "QR",
    status: "completed",
    createdAt: "2026-02-19T10:15:00",
  },
  {
    id: "ord-003",
    invoice: "#INV-1232",
    customer: "Rajesh Shrestha",
    items: [
      { productId: "prod-004", name: "Winter Jacket", qty: 1, price: 5500, total: 5500 },
      { productId: "prod-002", name: "Slim Fit Chinos", qty: 2, price: 2500, total: 5000 },
      { productId: "prod-009", name: "Leather Belt", qty: 1, price: 1200, total: 1200 },
    ],
    subtotal: 11700,
    tax: 1521,
    total: 13221,
    paymentMethod: "CARD",
    status: "completed",
    createdAt: "2026-02-19T09:00:00",
  },
  {
    id: "ord-004",
    invoice: "#INV-1231",
    customer: "Anita Gurung",
    items: [
      { productId: "prod-003", name: "Casual Polo Shirt", qty: 2, price: 1800, total: 3600 },
      { productId: "prod-010", name: "Ankle Socks (3pk)", qty: 2, price: 450, total: 900 },
    ],
    subtotal: 4500,
    tax: 585,
    total: 5085,
    paymentMethod: "CASH",
    status: "completed",
    createdAt: "2026-02-19T08:30:00",
  },
  {
    id: "ord-005",
    invoice: "#INV-1230",
    customer: "Sita Tamang",
    items: [
      { productId: "prod-011", name: "Floral Summer Dress", qty: 1, price: 2800, total: 2800 },
    ],
    subtotal: 2800,
    tax: 364,
    total: 3164,
    paymentMethod: "QR",
    status: "completed",
    createdAt: "2026-02-18T16:00:00",
  },
  {
    id: "ord-006",
    invoice: "#INV-1229",
    customer: "Bikash Rai",
    items: [
      { productId: "prod-007", name: "Running Shoes", qty: 1, price: 4500, total: 4500 },
      { productId: "prod-010", name: "Ankle Socks (3pk)", qty: 3, price: 450, total: 1350 },
    ],
    subtotal: 5850,
    tax: 760,
    total: 6610,
    paymentMethod: "CASH",
    status: "completed",
    createdAt: "2026-02-18T14:00:00",
  },
]

// ─── Mock Stock Adjustments ──────────────────────────────────────────────────

export const mockStockAdjustments: MockStockAdjustment[] = [
  {
    id: "adj-001",
    productId: "prod-006",
    productName: "Denim Jeans",
    type: "add",
    quantity: 20,
    reason: "New shipment received",
    date: "2026-02-18",
    adjustedBy: "Admin",
  },
  {
    id: "adj-002",
    productId: "prod-012",
    productName: "Wool Scarf",
    type: "remove",
    quantity: 5,
    reason: "Damaged - water damage",
    date: "2026-02-17",
    adjustedBy: "Admin",
  },
  {
    id: "adj-003",
    productId: "prod-004",
    productName: "Winter Jacket",
    type: "add",
    quantity: 10,
    reason: "Restock from supplier",
    date: "2026-02-16",
    adjustedBy: "Staff",
  },
]

// ─── Categories ──────────────────────────────────────────────────────────────

export const mockCategories = [
  "Clothing",
  "Footwear",
  "Accessories",
  "Electronics",
  "Groceries",
  "Others",
] as const

// ─── Dashboard Stats ─────────────────────────────────────────────────────────

export const mockDashboardStats: MockDashboardStats = {
  todaySales: 48250,
  monthlySales: 892400,
  totalOrders: 42,
  lowStockCount: 5,
  todaySalesChange: 18.2,
  monthlySalesChange: 12.5,
  ordersChange: 8,
}

// ─── Simulated Async Service Functions ───────────────────────────────────────

function delay(ms: number = 300): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function fetchProducts(): Promise<MockProduct[]> {
  await delay(200)
  return [...mockProducts]
}

export async function fetchProductById(id: string): Promise<MockProduct | null> {
  await delay(150)
  return mockProducts.find((p) => p.id === id) ?? null
}

export async function createProduct(
  product: Omit<MockProduct, "id" | "createdAt" | "isActive">
): Promise<MockProduct> {
  await delay(300)
  const newProduct: MockProduct = {
    ...product,
    id: `prod-${String(mockProducts.length + 1).padStart(3, "0")}`,
    isActive: true,
    createdAt: new Date().toISOString().split("T")[0],
  }
  mockProducts.push(newProduct)
  return newProduct
}

export async function updateProduct(
  id: string,
  updates: Partial<MockProduct>
): Promise<MockProduct | null> {
  await delay(300)
  const index = mockProducts.findIndex((p) => p.id === id)
  if (index === -1) return null
  mockProducts[index] = { ...mockProducts[index], ...updates }
  return mockProducts[index]
}

export async function deleteProduct(id: string): Promise<boolean> {
  await delay(200)
  const index = mockProducts.findIndex((p) => p.id === id)
  if (index === -1) return false
  mockProducts.splice(index, 1)
  return true
}

export async function fetchOrders(): Promise<MockOrder[]> {
  await delay(200)
  return [...mockOrders]
}

export async function fetchDashboardStats(): Promise<MockDashboardStats> {
  await delay(150)
  return { ...mockDashboardStats }
}

export async function fetchLowStockProducts(): Promise<MockProduct[]> {
  await delay(200)
  return mockProducts.filter(
    (p) => p.stock <= p.minStock && p.isActive
  )
}

export async function fetchStockAdjustments(): Promise<MockStockAdjustment[]> {
  await delay(200)
  return [...mockStockAdjustments]
}

export async function createStockAdjustment(
  adjustment: Omit<MockStockAdjustment, "id" | "date" | "adjustedBy">
): Promise<MockStockAdjustment> {
  await delay(300)
  const newAdj: MockStockAdjustment = {
    ...adjustment,
    id: `adj-${String(mockStockAdjustments.length + 1).padStart(3, "0")}`,
    date: new Date().toISOString().split("T")[0],
    adjustedBy: "Admin",
  }
  mockStockAdjustments.push(newAdj)

  // Update product stock
  const product = mockProducts.find((p) => p.id === adjustment.productId)
  if (product) {
    if (adjustment.type === "add") {
      product.stock += adjustment.quantity
    } else {
      product.stock = Math.max(0, product.stock - adjustment.quantity)
    }
  }

  return newAdj
}
