import { useState, useEffect } from "react";
import { Search, ShoppingCart, Grid, List as ListIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { usePosStore } from "@/stores/pos-store";
import { db, Item } from "@/lib/db";
import { useLiveQuery } from "dexie-react-hooks";

// Mock data generator for testing if DB is empty
const seedMockData = async () => {
    const count = await db.items.count();
    if (count === 0) {
        const items: Item[] = [
            { id: "1", name: "Premium Hoodie", sku: "HOD-001", price: 3500, cost: 1800, stock: 50, minStock: 10, category: "Clothing", barcode: null, image: null, isActive: true, isSynced: true, updatedAt: new Date() },
            { id: "2", name: "Slim Fit Chinos", sku: "CHI-002", price: 2500, cost: 1200, stock: 40, minStock: 8, category: "Clothing", barcode: null, image: null, isActive: true, isSynced: true, updatedAt: new Date() },
            { id: "3", name: "Casual Polo Shirt", sku: "POL-003", price: 1800, cost: 800, stock: 60, minStock: 15, category: "Clothing", barcode: null, image: null, isActive: true, isSynced: true, updatedAt: new Date() },
            { id: "4", name: "Winter Jacket", sku: "JAC-004", price: 5500, cost: 3000, stock: 20, minStock: 5, category: "Clothing", barcode: null, image: null, isActive: true, isSynced: true, updatedAt: new Date() },
            { id: "5", name: "Cotton T-Shirt", sku: "TSH-005", price: 900, cost: 350, stock: 100, minStock: 20, category: "Clothing", barcode: null, image: null, isActive: true, isSynced: true, updatedAt: new Date() },
        ];
        await db.items.bulkAdd(items);
    }
};

export default function ProductGrid() {
    const [searchTerm, setSearchTerm] = useState("");
    const addToCart = usePosStore((state) => state.addToCart);

    // Seed data on mount
    useEffect(() => { seedMockData(); }, []);

    // Live Query from Dexie (Offline First)
    const items = useLiveQuery(async () => {
        if (!searchTerm) return db.items.limit(20).toArray();
        return db.items
            .filter((item) => item.name.toLowerCase().includes(searchTerm.toLowerCase()))
            .limit(20)
            .toArray();
    }, [searchTerm]);

    return (
        <div className="flex flex-col h-full bg-muted/30 p-4 gap-4">
            {/* Search Header */}
            <div className="flex gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                        placeholder="Search products..."
                        className="pl-9 bg-background shadow-sm border-input"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <Button variant="outline" size="icon" className="shrink-0 bg-background border-input">
                    <Grid className="h-4 w-4" />
                </Button>
            </div>

            {/* Grid Content */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 overflow-y-auto pb-4 content-start">
                {items?.map((item) => (
                    <Card
                        key={item.id}
                        className="cursor-pointer hover:shadow-md transition-all active:scale-95 border shadow-sm bg-card group"
                        onClick={() => addToCart(item)}
                    >
                        <CardContent className="p-3">
                            <div className="aspect-square rounded-xl bg-muted mb-3 flex items-center justify-center group-hover:bg-muted/80 transition-colors">
                                {/* Placeholder for Product Image */}
                                <span className="text-2xl font-bold text-muted-foreground/30 select-none">
                                    {item.name.substring(0, 2).toUpperCase()}
                                </span>
                            </div>
                            <div className="space-y-1">
                                <h3 className="font-medium text-sm leading-tight line-clamp-2 min-h-[2.5em]">
                                    {item.name}
                                </h3>
                                <div className="flex justify-between items-center">
                                    <span className="font-bold text-primary font-heading">
                                        Rs. {item.price}
                                    </span>
                                    <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
                                        Qty: {item.stock}
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}

                {items?.length === 0 && (
                    <div className="col-span-full flex flex-col items-center justify-center p-10 text-muted-foreground gap-2">
                        <Search className="h-8 w-8 opacity-20" />
                        <p>No products found</p>
                    </div>
                )}
            </div>
        </div>
    );
}
