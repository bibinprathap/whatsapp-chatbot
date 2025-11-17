import { menu } from '../menu.js';
import { setState } from '../storage.js';

export const stageTwo = {
  exec({ from, message, state }) {
    const order =
      '\n-----------------------------------\n#️⃣ - ```FINISH order``` \n*️⃣ - ```CANCEL order```';
    if (message === '*') {
      state.stage = 0;
      state.itens = [];
      setState(from, state);

      return '🔴 Request *CANCELED* successfully.\n\n ```Times Always!```';
    } else if (message === '#') {
      state.stage = 3;
      setState(from, state);

      return (
        '🗺️ Now enter the *ADDRESS*. \n ( ```Street, Number, Neighborhood``` ) \n\n ' +
        '\n-----------------------------------\n*️⃣ - ```CANCEL order```'
      );
    } else {
      if (!menu[message]) {
        return `❌ *Invalid code, retype!* \n\n ${order}`;
      }
    }

    state.itens.push(menu[message]);
    setState(from, state);

    return (
      `✅ *${menu[message].description}* successfully added! \n\n` +
      '```Enter another option```: \n\n' +
      order
    );
  },
};
