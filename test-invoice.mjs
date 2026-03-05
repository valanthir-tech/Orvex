const headers = {
    'Content-Type': 'application/json',
    'Authorization': 'token 9ef084a739ecc81:adbb731a11f60bc'
};
const url = 'http://localhost:8080/api/resource';

async function req(path, method = "GET", body = null) {
    const res = await fetch(`${url}/${path}`, {
        method, headers, body: body ? JSON.stringify(body) : undefined
    });
    return { status: res.status, data: await res.json() };
}

async function run() {
    let cust = await req('Customer/Walk-in Customer');
    if (cust.status === 404) {
        console.log("Customer not found, creating...");
        cust = await req('Customer', 'POST', {
            customer_name: 'Walk-in Customer',
            customer_type: 'Individual',
            customer_group: 'All Customer Groups',
            territory: 'All Territories'
        });
        console.log("Created Customer:", cust.data);
    } else {
        console.log("Customer exists.");
    }

    // Create Invoice
    console.log("Creating Sales Invoice...");
    const inv = await req('Sales Invoice', 'POST', {
        customer: 'Walk-in Customer',
        posting_date: new Date().toISOString().split('T')[0],
        is_pos: 1,
        update_stock: 1,
        items: [{ item_code: 'prod-001', qty: 1, rate: 3500 }],
        payments: [{ mode_of_payment: 'Cash', amount: 3500 }],
        paid_amount: 3500,
        change_amount: 0,
    });
    console.log("Invoice Response:", JSON.stringify(inv, null, 2));
}
run();
