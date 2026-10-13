import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Next.js Route Handler for the Internal Storefront API
export async function GET(request: Request) {
  try {
    // 1. Verify the Internal API Key (Zero Public Exposure)
    const authHeader = request.headers.get("x-storefront-internal-key");
    const internalKey = process.env.STOREFRONT_INTERNAL_API_KEY;
    const reqId = request.headers.get("x-request-id") || "unknown-req";

    console.log(`[Storefront Fetch] Tenant Config requested. Trace ID: ${reqId}`);

    if (!internalKey || authHeader !== internalKey) {
      console.warn(`[Storefront Fetch] Unauthorized Config attempt blocked. Trace ID: ${reqId}`);
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    // TODO: Implement Upstash/KV Rate Limiting Here
    // const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
    // const { success } = await ratelimit.limit(ip);
    // if (!success) return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });

    // 2. Extract the domain from the query parameters
    const { searchParams } = new URL(request.url);
    const domainParam = searchParams.get("domain");

    if (!domainParam) {
      return NextResponse.json({ error: "Domain parameter is required" }, { status: 400 });
    }

    // Standardize domain vs slug matching for the .onedexo.page root domain
    const isOnedexoPageHost = domainParam.endsWith(".onedexo.page");
    const slug = isOnedexoPageHost ? domainParam.replace(".onedexo.page", "") : null;

    // 3. Connect to Supabase as Admin (Service Role)
    // We are querying as the admin because the client storefront has ZERO keys.
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 4. Look up the tenant based on the domain OR the slug
    // We query against storefront_subdomain and storefront_custom_domain (using ilike for case insensitivity)
    const orQueryMatches = [
      `storefront_custom_domain.ilike.${domainParam}`,
      `storefront_subdomain.ilike.${domainParam}`
    ];

    if (slug) {
      // If it exists on our main onedexo.page domain wildcard, also allow checking an exact slug match if they stored just 'ramesh'
      orQueryMatches.push(`storefront_subdomain.ilike.${slug}`);
    }

    const { data: tenant, error } = await supabaseAdmin
      .from("tenants")
      .select("id, company_name, storefront_subdomain, storefront_status, plan")
      .or(orQueryMatches.join(","))
      .single();

    if (error || !tenant) {
      console.error("Tenant lookup failed for domain:", domainParam, error);
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    // 5. Fetch their specific storefront customizations
    const { data: config } = await supabaseAdmin
      .from("tenant_storefront_config")
      .select("*")
      .eq("tenant_id", tenant.id)
      .single();

    // 6. Return the sanitized data to the Storefront Engine
    return NextResponse.json({
      tenantId: tenant.id,
      storeName: config?.store_name || tenant.company_name,
      maintenanceMode: config?.is_maintenance_mode || false,
      plan: tenant.plan || 'STARTER',
      theme: {
        primaryColor: config?.theme_primary_color || "#0F172A",
        textColor: config?.theme_text_color || "#1f2937",
        bgColor: config?.theme_bg_color || "#ffffff",
        fontFamily: config?.theme_font_family || "Inter",
        themeBlocks: config?.theme_blocks || [],
        logoUrl: config?.logo_url || null,
        faviconUrl: config?.favicon_url || null,
        heroImageUrl: config?.hero_image_url || null,
        heroHeading: config?.hero_heading || null,
        heroSubheading: config?.hero_subheading || null,
        aboutText: config?.about_text || null,
        aboutHeadline: config?.about_headline || null,
        socialLinks: config?.social_links || {},
        // Content fields
        tagline: config?.tagline || null,
        philosophyText: config?.philosophy_text || null,
        testimonialQuote: config?.testimonial_quote || null,
        testimonialAuthor: config?.testimonial_author || null,
        newsletterDescription: config?.newsletter_description || null,
        materials: config?.materials?.length ? config.materials : null,
      },
      status: tenant.storefront_status
    });

  } catch (error) {
    console.error("Storefront API Check Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
