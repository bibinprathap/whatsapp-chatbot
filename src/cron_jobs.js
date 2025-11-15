import cron from 'node-cron';
import { db } from './db.js';
import { getState, setState } from './storage.js';

export function startCronJobs(client) {
  console.log('🕐 Starting cron jobs for abandoned cart recovery...');

  // Run every 10 minutes
  cron.schedule('*/10 * * * *', async () => {
    console.log('🔍 Checking for abandoned carts...');
    try {
      const ONE_HOUR_AGO = Date.now() - 3600000; // 1 hour in milliseconds
      const carts = db
        .prepare(
          `
        SELECT phone_number FROM user_state
        WHERE stage IN (2, 3)
        AND last_updated_at < ?
      `
        )
        .all(ONE_HOUR_AGO);

      if (carts.length === 0) {
        console.log('✅ No abandoned carts found.');
        return;
      }

      console.log(`📦 Found ${carts.length} abandoned cart(s). Sending recovery messages...`);

      for (const cart of carts) {
        try {
          const state = getState(cart.phone_number);

          if (state.itens && state.itens.length > 0) {
            const items = state.itens.map((i) => i.description).join(', ');
            const message = `👋 You left these in your cart: ${items}. Want to complete your order?`;

            await client.sendMessage(cart.phone_number, { text: message });
            console.log(`✅ Recovery message sent to ${cart.phone_number}`);

            // Move user to abandoned cart recovery stage (stage 99)
            state.stage = 99;
            setState(cart.phone_number, state);
          }
        } catch (error) {
          console.error(`Error processing abandoned cart for ${cart.phone_number}:`, error);
        }
      }
    } catch (error) {
      console.error('Error in abandoned cart recovery cron job:', error);
    }
  });

  console.log('✅ Cron jobs started successfully!');
}
