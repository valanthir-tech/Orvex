import { notFound } from "next/navigation"
import { createClient } from "@supabase/supabase-js"
import { createSupabaseServerClient } from "@/lib/tenant"

function slugify(text: string) {
    return text.toString().toLowerCase()
        .replace(/\s+/g, '-')           // Replace spaces with -
        .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
        .replace(/\-\-+/g, '-')         // Replace multiple - with single -
        .replace(/^-+/, '')             // Trim - from start of text
        .replace(/-+$/, '');            // Trim - from end of text
}

export async function generateStaticParams() {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    const { data: tenants } = await supabase
        .from('tenants')
        .select('company_name')
        .eq('status', 'active')

    return (tenants || []).map(t => ({
        slug: slugify(t.company_name)
    }))
}

export default async function StorefrontPage(props: { params: Promise<{ slug: string }> }) {
    const { slug } = await props.params;

    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    
    const slugName = slug.replace(/-/g, ' ')

    // Get tenant by slugish matching
    const { data: tenant } = await supabase
        .from('tenants')
        .select('id, company_name')
        .ilike('company_name', slugName)
        .single()

    if (!tenant) notFound()

    // Get products (direct Supabase query - FAST!)
    const { data: products } = await supabase
        .from('public_products')
        .select('*')
        .eq('tenant_id', tenant.id)
        .eq('published', true)
        .order('created_at', { ascending: false })

    const { data: featured } = await supabase
        .from('public_products')
        .select('*')
        .eq('tenant_id', tenant.id)
        .eq('featured', true)
        .eq('published', true)
        .limit(6)

    return (
        <main className="min-h-screen bg-[#fcfbf9] text-[#171717] font-sans">
            {/* Hero Section */}
            <section className="bg-white border-b py-20 px-4">
                <div className="container mx-auto text-center">
                    <h1 className="text-4xl md:text-6xl font-bold mb-4 tracking-tight capitalize">
                        Welcome to {tenant.company_name}
                    </h1>
                    <p className="text-lg text-[#171717]/60 max-w-2xl mx-auto">
                        Explore our premium collection of highly curated products securely synced in real-time.
                    </p>
                </div>
            </section>

            <div className="container mx-auto px-4 py-16">
                {/* Featured Products */}
                {featured && featured.length > 0 && (
                    <div className="mb-20">
                        <h2 className="text-2xl font-bold mb-8">Featured Collection</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                            {featured.map((p) => (
                                <ProductCard key={p.id} product={p} />
                            ))}
                        </div>
                    </div>
                )}

                {/* All Products Grid */}
                <div>
                    <h2 className="text-2xl font-bold mb-8">All Products</h2>
                    {(!products || products.length === 0) ? (
                        <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-200">
                            <p className="text-[#171717]/50">No products available at the moment. Please check back later.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
                            {products.map((p) => (
                                <ProductCard key={p.id} product={p} />
                            ))}
                        </div>
                    )}
                </div>
            </div>
            
            <footer className="bg-white border-t py-12 text-center text-[#171717]/50 mt-auto">
                <p>&copy; {new Date().getFullYear()} {tenant.company_name}. Customer Storefront Powered by Orvex Core.</p>
            </footer>
        </main>
    )
}

function ProductCard({ product }: { product: any }) {
    const imageUrl = product.images?.[0] || 'https://placehold.co/400x400/eeeeee/999999?text=No+Image'
    const inStock = product.stock_status === 'in_stock' || product.stock_qty > 0

    return (
        <div className="bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 overflow-hidden group flex flex-col">
            <div className="aspect-square bg-gray-50 relative overflow-hidden">
                <img 
                    src={imageUrl} 
                    alt={product.item_name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                {!inStock && (
                    <div className="absolute top-4 right-4 bg-red-50 text-red-600 text-xs font-bold px-2 py-1 rounded-md border border-red-100">
                        Out of Stock
                    </div>
                )}
            </div>
            <div className="p-6 flex flex-col flex-grow">
                <h3 className="font-semibold text-lg line-clamp-1 mb-2">{product.item_name}</h3>
                
                {product.category && (
                    <p className="text-sm text-[#171717]/50 mb-4">{product.category}</p>
                )}
                
                <div className="mt-auto flex items-center justify-between pt-4 border-t border-gray-50">
                    <span className="font-bold text-lg">Rs. {Number(product.price).toLocaleString()}</span>
                    
                    <button 
                        disabled={!inStock} 
                        className="px-4 py-2 rounded-lg font-medium text-sm transition-colors"
                    >
                        {inStock ? 'Buy Now' : 'Check Later'}
                    </button>
                </div>
            </div>
        </div>
    )
}
