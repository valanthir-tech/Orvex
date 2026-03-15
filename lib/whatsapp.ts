/**
 * WhatsApp Integration Utilities
 * 
 * Used for Phase 1.5 feature: Share WhatsApp Order Link
 * This allows shop owners to share carts, products, or order links directly via WhatsApp.
 */

export interface CartItem {
    name: string;
    quantity: number;
    price: number;
}

/**
 * Generates a pre-filled WhatsApp message link for a customer to order via chat.
 */
export function generateWhatsAppOrderLink(
    shopPhone: string,
    shopName: string,
    cartItems: CartItem[],
    totalAmount: number,
    orderId?: string
): string {
    // Format the phone number (remove +, spaces, dashes)
    const cleanPhone = shopPhone.replace(/[^0-9]/g, "");

    let message = `*New Order for ${shopName}*\n\n`;
    
    if (orderId) {
        message += `Order REF: #${orderId}\n\n`;
    }

    message += `*Items:*\n`;
    cartItems.forEach(item => {
        message += `- ${item.quantity}x ${item.name} (Rs. ${item.price})\n`;
    });

    message += `\n*Total: Rs. ${totalAmount}*\n\n`;
    message += `Please confirm my order. Thank you!`;

    // Encode for URL
    const encodedMessage = encodeURIComponent(message);

    // Provide universal link (works on mobile app + web desktop)
    return `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
}

/**
 * Generates a link to share a specific product for marketing/sales
 */
export function generateProductShareLink(
    shopPhone: string,
    productName: string,
    productUrl: string
): string {
    const cleanPhone = shopPhone.replace(/[^0-9]/g, "");
    
    const message = `Hi! I'm interested in buying this product:\n\n*${productName}*\n${productUrl}\n\nIs this in stock?`;
    
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}
