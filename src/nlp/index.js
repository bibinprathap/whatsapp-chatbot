import { parseNaturalLanguageOrder, isOpenAIConfigured } from './openai.js';
import { buildCart, generateOrderSummary, generateNextStepPrompt, shouldAttemptNLParsing } from './parser.js';
import { menu } from '../menu.js';
import { setState } from '../storage.js';

/**
 * Natural Language Order Processor
 * Intercepts messages before the stage router to detect and process NL orders
 */
export class NLOrderProcessor {
  constructor() {
    this.enabled = isOpenAIConfigured();
    
    if (this.enabled) {
      console.log('🤖 AI Natural Language Ordering is ENABLED');
    } else {
      console.log('⚠️  AI Natural Language Ordering is DISABLED (no OPENAI_API_KEY)');
    }
  }

  /**
   * Process a message and check if it's a natural language order
   * @param {object} params - Message parameters
   * @returns {Promise<object|null>} Response object or null to continue to stage router
   */
  async process({ from, message, client, state }) {
    // Skip if NL processing is disabled
    if (!this.enabled) {
      return null;
    }

    // Skip if user is in certain stages where NL doesn't make sense
    // Stage 4+ = already placed order, Stage 5 = talking to attendant
    if (state.stage >= 4) {
      return null;
    }

    // Quick pre-filter to avoid unnecessary API calls
    if (!shouldAttemptNLParsing(message)) {
      return null;
    }

    console.log(`🔍 Attempting NL parsing for: "${message}"`);

    try {
      // Call OpenAI to parse the message
      const parsedOrder = await parseNaturalLanguageOrder(message, menu);

      if (!parsedOrder) {
        console.log('📝 Not detected as an order, passing to stage router');
        return null;
      }

      console.log('✅ Order detected:', JSON.stringify(parsedOrder, null, 2));

      // Build the cart from parsed order
      const cart = buildCart(parsedOrder);

      if (cart.items.length === 0) {
        console.log('⚠️ No valid items matched, passing to stage router');
        return null;
      }

      // Update user state with cart
      state.itens = cart.items;
      
      if (cart.address) {
        // Full order with address - go to confirmation stage
        state.address = cart.address;
        state.stage = 4;
        setState(from, state);

        const summary = generateOrderSummary(cart);
        const nextStep = generateNextStepPrompt(cart);

        // Send order summary
        await client.sendMessage(from, { text: summary });

        return {
          handled: true,
          response: nextStep,
        };
      } else {
        // Order without address - need to collect address
        state.stage = 3;
        setState(from, state);

        const summary = generateOrderSummary(cart);
        const nextStep = generateNextStepPrompt(cart);

        return {
          handled: true,
          response: summary + nextStep,
        };
      }
    } catch (error) {
      console.error('NL Processing error:', error);
      return null; // Fall back to stage router on error
    }
  }

  /**
   * Check if the processor is enabled
   */
  isEnabled() {
    return this.enabled;
  }
}

// Singleton instance
let processorInstance = null;

/**
 * Get the NL Order Processor instance
 * @returns {NLOrderProcessor}
 */
export function getNLProcessor() {
  if (!processorInstance) {
    processorInstance = new NLOrderProcessor();
  }
  return processorInstance;
}

/**
 * Process a message through NL pipeline
 * Convenience function for server.js
 */
export async function processNaturalLanguage(params) {
  const processor = getNLProcessor();
  return processor.process(params);
}
