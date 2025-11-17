import { setState } from "../storage.js";

/**
 * Abandoned Cart Recovery (ACR) Stage
 * Automatically sent to users who haven't completed checkout
 */
export const acrStage = {
  exec({ from, message, state }) {
    // User responds to abandoned cart message
    // Check if they want to continue or cancel

    if (message === "*") {
      // Cancel - reset to initial stage
      state.stage = 0;
      state.itens = [];
      state.address = "";
      setState(from, state);
      return "🔴 Order canceled. Starting fresh!\n\n1️⃣ - ```MAKE A WISH``` \n2️⃣ - ```CHECK DELIVERY RATE```\n0️⃣ - ```TALK TO ATTENDANT```";
    }

    // User wants to continue with checkouta
    state.stage = 2;
    setState(from, state);
    return "Great! You can continue your order. Type #️⃣ to finish or *️⃣ to cancel.";
  },
};
