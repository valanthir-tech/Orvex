import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getTenantErpClient } from "@/lib/tenant";

export async function POST(request: Request) {
  try {
    // 1. Verify the Internal API Key
    const authHeader = request.headers.get("x-storefront-internal-key");
    const internalKey = process.env.STOREFRONT_INTERNAL_API_KEY;

    if (!internalKey || authHeader !== internalKey) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const body = await request.json();
    const { domain, customer, items, payment_method } = body;

    if (!domain || !customer || !items || !items.length) {
      return NextResponse.json({ error: "Missing required checkout data" }, { status: 400 });
    }

    // 2. Connect to Supabase as Admin to find the Tenant
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const isOrvexPageHost = domain.endsWith(".orvex.page");
    const slug = isOrvexPageHost ? domain.replace(".orvex.page", "") : null;
    
    // We query against storefront_subdomain and storefront_custom_domain
    const orQueryMatches = [
      `storefront_custom_domain.eq.${domain}`,
      `storefront_subdomain.eq.${domain}`
    ];
    
    if (slug) {
      // If it exists on our main orvex.page domain wildcard, also allow checking an exact slug match if they stored just 'ramesh'
      orQueryMatches.push(`storefront_subdomain.eq.${slug}`);
    }

    const { data: tenant, error } = await supabaseAdmin
      .from("tenants")
      .select("id, company_name")
      .or(orQueryMatches.join(","))
      .single();

    if (error || !tenant) {
      console.error("Checkout: Tenant lookup failed for domain:", domain);
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    // 3. (Optional but ideal) Buffer into Supabase 'storefront_orders' table 
    // to ensure we never lose an order even if ERPNext is down.
    
    // 4. Send exact order to ERPNext as a Sales Invoice
    const erpClient = await getTenantErpClient(tenant.id);
    
    // Check if customer exists in ERPNext, or create them
    const existingCustomers = await erpClient.getList<any>('Customer', {
      filters: [['customer_name', '=', customer.name], ['mobile_no', '=', customer.phone]]
    });
    const existingCustomer = existingCustomers && existingCustomers.length > 0 ? existingCustomers[0] : null;
    
    let erpCustomerName = customer.name;
    if (!existingCustomer) {
       await erpClient.createDoc('Customer', {
         customer_name: customer.name,
         customer_type: 'Individual',
         customer_group: 'Commercial',
         territory: 'All Territories',
         mobile_no: customer.phone,
       });
    } else {
       erpCustomerName = existingCustomer.name;
    }

    // Create the Sales Invoice (update_stock = 1 means it drops the stock immediately!)
    const payload = {
      naming_series: "INV-.YYYY.-",
      customer: erpCustomerName,
      update_stock: 1, // This is your Killer Demo feature!
      set_posting_time: 1,
      docstatus: 1, // Submits the invoice automatically!
      items: items.map((i: any) => ({
        item_code: i.item_code,
        qty: i.qty,
      })),
      custom_delivery_address: customer.address, // assuming standard ERPNext fields or custom
      remarks: `Web Order | Phone: ${customer.phone} | Payment: ${payment_method}`,
    };

    const invoiceResult: any = await erpClient.createDoc('Sales Invoice', payload);

    return NextResponse.json({
      success: true,
      message: "Order placed successfully!",
      order_id: invoiceResult?.name
    }, { status: 201 });

  } catch (error: any) {
    console.error("Storefront API Checkout Error:", error.message || error);
    return NextResponse.json({ error: "Failed to process the checkout" }, { status: 500 });
  }
}
