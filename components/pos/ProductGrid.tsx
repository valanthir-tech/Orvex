import { useState } from "react";
import { Search, ShoppingCart, Grid, List as ListIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { usePosStore } from "@/stores/pos-store";
import { db } from "@/lib/db";
import { useLiveQuery } from "dexie-react-hooks";

export default function ProductGrid() {
    const [searchTerm, setSearchTerm] = useState("");
    const addToCart = usePosStore((state) => state.addToCart);

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
