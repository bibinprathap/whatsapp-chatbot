import { storage } from '../storage.js';

export const initialStage = {
  exec({ from }) {
    storage[from].stage = 1;

    return '👋 Hello how are you? \n\nI am Carlos, the *virtual assistant* of YouCloud. \n* can i help you?* 🙋‍♂️ \n-----------------------------------\n1️⃣ - ```MAKE A WISH``` \n2️⃣ - ```CHECK DELIVERY RATE```\n0️⃣ - ```TALK TO ATTENDANT```';
  },
};
