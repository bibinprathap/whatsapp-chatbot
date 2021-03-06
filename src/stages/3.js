import { storage } from '../storage.js';

export const stageThree = {
  async exec({ from, message, client }) {
    storage[from].address = message;
    storage[from].stage = 4;

    if (message === '*') {
      storage[from].stage = 0;
      return 'Request *CANCELED* successfully. \n Times Always!';
    }

    let desserts = '';
    const itens = storage[from].itens;
    itens.map((item, index) => {
      if (index == itens.length - 1) {
        desserts += item.description + '.';
      } else {
        desserts += item.description + ', ';
      }
    });
    const total = storage[from].itens.length;

    await client.sendText(
      message.from,
      `šļø *ORDER SUMMARY*: \n\nš§ Flavors: *${desserts}* \nš Delivery fee: *to be confirmed*. \nš Address:*${message}* \nš° Value of cakes: *${
        total * 6
      },00 reais*. \nā³ Delivery time: *50 minutes*. \n\n` +
        'š ```Now, inform the method of payment and if you will need change, please.```'
    );

    return 'ā *Done, order placed!*\n\nNow, if you still do not know the value of the delivery fee for your region, I will pass it on to an attendant so that he can check the value of the *delivery fee*. \n\nā³ *Wait a minute*.';
  },
};
