import { menu } from '../menu.js';
import { storage } from '../storage.js';
import { neighborhoods } from './neighborhoods.js';

export const stageOne = {
  exec({ from, message, client }) {
    if (message === '1') {
      let msg = '🚨  MENU  🚨\n\n';

      Object.keys(menu).map((value) => {
        const element = menu[value];
        if (value === '1') {
          msg += `1️⃣ - _${element.description}_ \n`;
        } else if (value === '2') {
          msg += `2️⃣ - _${element.description}_ \n`;
        } else if (value === '3') {
          msg += `3️⃣ - _${element.description}_ \n`;
        } else if (value === '4') {
          msg += `4️⃣ - _${element.description}_ \n`;
        } else if (value === '5') {
          msg += `5️⃣ - _${element.description}_ \n`;
        }
      });

      msg +=
        '\nTo view the cakes, *acesse*: https://wa.me/c/556884257619\n\n⚠️ ```ONLY ONE OPTION AT A TIME``` ⚠️\n*Enter OPTION referring to the product you want to order:*';
      storage[from].stage = 2;

      return msg;
    } else if (message === '2') {
      return (
        '\n-----------------------------------\n1️⃣ - ```MAKE A WISH``` \n0️⃣ - ```TALK TO ATTENDANT```\n\n' +
        neighborhoods +
        '\n-----------------------------------\n1️⃣ - ```MAKE A WISH``` \n0️⃣ - ```TALK TO ATTENDANT``` '
      );
    } else if (message === '0') {
      client.markUnseenMessage(from);

      storage[from].stage = 5;

      return '🔃 Forwarding you to an attendant. \n⏳ *Wait a minute*.';
    }

    return '❌ *Enter a valid option, please.*\n⚠️ ```ONLY ONE OPTION AT A TIME``` ⚠️';
  },
};
