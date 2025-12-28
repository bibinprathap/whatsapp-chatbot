import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Extract order intent from natural language using OpenAI function calling
 * @param {string} userMessage - The user's natural language message
 * @param {object} menuItems - Available menu items
 * @returns {Promise<object|null>} Parsed order or null if not an order
 */
export async function parseNaturalLanguageOrder(userMessage, menuItems) {
  const menuDescription = Object.entries(menuItems)
    .map(([id, item]) => `ID ${id}: ${item.description} - ${item.price} reais`)
    .join('\n');

  const tools = [
    {
      type: 'function',
      function: {
        name: 'create_order',
        description: 'Create an order from the customer request. Use this when the customer wants to order items from the menu.',
        parameters: {
          type: 'object',
          properties: {
            items: {
              type: 'array',
              description: 'List of items the customer wants to order',
              items: {
                type: 'object',
                properties: {
                  id: {
                    type: 'string',
                    description: 'The menu item ID',
                  },
                  quantity: {
                    type: 'number',
                    description: 'How many of this item (default 1)',
                  },
                  modifications: {
                    type: 'string',
                    description: 'Any modifications like "no mayo", "extra cheese", etc.',
                  },
                },
                required: ['id', 'quantity'],
              },
            },
            address: {
              type: 'string',
              description: 'Delivery address if provided by the customer',
            },
          },
          required: ['items'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'not_an_order',
        description: 'Use this when the message is NOT an order request (greetings, questions, complaints, etc.)',
        parameters: {
          type: 'object',
          properties: {
            reason: {
              type: 'string',
              description: 'Why this is not an order',
            },
          },
          required: ['reason'],
        },
      },
    },
  ];

  const systemPrompt = `You are an intelligent order assistant for a WhatsApp delivery bot.

AVAILABLE MENU:
${menuDescription}

YOUR TASK:
1. If the user wants to ORDER items, use the create_order function to extract:
   - Which items they want (match to menu IDs using fuzzy matching)
   - Quantities (default to 1 if not specified)
   - Any modifications (no mayo, extra cheese, etc.)
   - Delivery address if mentioned

2. If the message is NOT an order (greetings, questions, complaints, status checks, etc.), use not_an_order.

MATCHING RULES:
- Match items flexibly: "milk" matches "AL Ain Milk", "apple" matches "Apple", etc.
- Handle plurals: "apples" = "apple", "tomatoes" = "tomato"
- Handle quantities: "2 apples", "two milks", "a sugar and an onion"
- If an item doesn't match any menu item, skip it but still process others
- Be generous in matching - partial matches are OK

EXAMPLES:
- "I want 2 milks and an apple" → create_order with items
- "Send me tomatoes and onions to Downtown" → create_order with address
- "Hello" → not_an_order
- "What's on the menu?" → not_an_order
- "Where is my order?" → not_an_order`;

  try {
    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      tools,
      tool_choice: 'required',
      temperature: 0.1,
    });

    const toolCall = response.choices[0]?.message?.tool_calls?.[0];
    
    if (!toolCall) {
      return null;
    }

    const functionName = toolCall.function.name;
    const args = JSON.parse(toolCall.function.arguments);

    if (functionName === 'create_order' && args.items?.length > 0) {
      return {
        intent: 'new_order',
        items: args.items,
        address: args.address || null,
      };
    }

    return null;
  } catch (error) {
    console.error('OpenAI API error:', error);
    return null;
  }
}

/**
 * Check if OpenAI is configured and available
 */
export function isOpenAIConfigured() {
  return !!process.env.OPENAI_API_KEY;
}
