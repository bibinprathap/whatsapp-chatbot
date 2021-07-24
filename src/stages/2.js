import { menu } from '../menu.js';
import { storage } from '../storage.js';

export const stageTwo = {
  exec({ from, message }) {
    const order =
      '\n-----------------------------------\n#️⃣ - ```FINISH order``` \n*️⃣ - ```CANCEL order```';
    if (message === '*') {
      storage[from].stage = 0;
      storage[from].itens = [];

      return '🔴 Request *CANCELED* successfully.\n\n ```Times Always!```';
    } else if (message === '#') {
      storage[from].stage = 3;

      return (
        '🗺️ Now enter the *ADDRESS*. \n ( ```Street, Number, Neighborhood``` ) \n\n ' +
        '\n-----------------------------------\n*️⃣ - ```CANCEL order```'
      );
    } else {
      if (!menu[message]) {
        return `❌ *Invalid code, retype!* \n\n ${order}`;
      }
    }

    storage[from].itens.push(menu[message]);

    return (
      `✅ *${menu[message].description}* successfully added! \n\n` +
      '```Enter another option```: \n\n' +
      order
    );
  },
};
