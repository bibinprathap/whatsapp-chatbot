import { menu } from '../menu.js';

/**
 * Build cart items from parsed order
 * @param {object} parsedOrder - Order from OpenAI parser
 * @returns {object} Cart with validated items and total
 */
export function buildCart(parsedOrder) {
  const cartItems = [];
  let total = 0;
  const invalidItems = [];

  for (const item of parsedOrder.items) {
    const menuItem = menu[item.id];
    
    if (menuItem) {
      const quantity = item.quantity || 1;
      
      for (let i = 0; i < quantity; i++) {
        cartItems.push({
          ...menuItem,
          id: item.id,
          modifications: item.modifications || null,
        });
      }
      
      total += menuItem.price * quantity;
    } else {
      invalidItems.push(item.id);
    }
  }

  return {
    items: cartItems,
    total,
    invalidItems,
    address: parsedOrder.address,
  };
}

/**
 * Generate order summary message
 * @param {object} cart - Built cart object
 * @returns {string} Formatted order summary
 */
export function generateOrderSummary(cart) {
  if (cart.items.length === 0) {
    return null;
  }

  // Group items by description for cleaner display
  const grouped = {};
  for (const item of cart.items) {
    const key = item.description + (item.modifications ? ` (${item.modifications})` : '');
    grouped[key] = (grouped[key] || 0) + 1;
  }

  let itemsList = '';
  for (const [name, qty] of Object.entries(grouped)) {
    itemsList += `   • ${qty}x ${name}\n`;
  }

  const pricePerItem = cart.items[0]?.price || 6;
  
  let summary = `🛒 *ORDER CONFIRMED VIA AI* 🤖\n`;
  summary += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
  summary += `📦 *Items:*\n${itemsList}\n`;
  summary += `💰 *Subtotal:* ${cart.total} reais\n`;
  summary += `🚚 *Delivery fee:* to be confirmed\n`;

  if (cart.address) {
    summary += `📍 *Address:* ${cart.address}\n`;
  }

  summary += `\n━━━━━━━━━━━━━━━━━━━━━\n`;

  return summary;
}

/**
 * Generate the next step prompt based on what info we have
 * @param {object} cart - Built cart object
 * @returns {string} Next step message
 */
export function generateNextStepPrompt(cart) {
  if (!cart.address) {
    return `\n🗺️ *Please provide your delivery address:*\n(Street, Number, Neighborhood)\n\n━━━━━━━━━━━━━━━━━━━━━\n*️⃣ - \`\`\`CANCEL order\`\`\``;
  }

  return `\n✅ *Order placed successfully!*\n\n🔊 \`\`\`Please inform your payment method and if you need change.\`\`\`\n\n⏳ An attendant will confirm your delivery fee shortly.`;
}

/**
 * Check if a message looks like it might be a natural language order
 * Quick pre-filter to avoid unnecessary API calls
 * @param {string} message - User message
 * @returns {boolean} Whether to try NL parsing
 */
export function shouldAttemptNLParsing(message) {
  // Skip single digit/character messages (menu navigation)
  if (/^[0-9*#]$/.test(message.trim())) {
    return false;
  }

  // Skip very short messages
  if (message.trim().length < 5) {
    return false;
  }

  // Order-indicating keywords
  const orderKeywords = [
    'want', 'need', 'order', 'send', 'get', 'give',
    'quero', 'preciso', 'pedir', 'enviar', 'mandar',
    'please', 'can i', 'could i', 'i\'d like', 'i would like',
    'deliver', 'delivery', 'buy', 'purchase',
  ];

  // Menu item keywords (from menu)
  const menuKeywords = [
    'milk', 'apple', 'sugar', 'onion', 'tomato',
    'leite', 'maçã', 'açúcar', 'cebola', 'tomate',
  ];

  const lowerMessage = message.toLowerCase();

  // Check for order intent keywords
  const hasOrderIntent = orderKeywords.some(kw => lowerMessage.includes(kw));
  
  // Check for menu items mentioned
  const hasMentionedItems = menuKeywords.some(kw => lowerMessage.includes(kw));

  // If it has quantity patterns like "2 apples" or "two milk"
  const hasQuantityPattern = /\b(one|two|three|four|five|six|seven|eight|nine|ten|\d+)\s+\w+/i.test(message);

  return hasOrderIntent || hasMentionedItems || hasQuantityPattern;
}
