import { setState } from '../storage.js';

export const stageThree = {
  async exec({ from, message, client, state }) {
    state.address = message;
    state.stage = 4;

    if (message === '*') {
      state.stage = 0;
      setState(from, state);
      return 'Request *CANCELED* successfully. \n Times Always!';
    }

    let desserts = '';
    const itens = state.itens;
    itens.map((item, index) => {
      if (index == itens.length - 1) {
        desserts += item.description + '.';
      } else {
        desserts += item.description + ', ';
      }
    });
    const total = state.itens.length;

    setState(from, state);

    await client.sendMessage(
      from,
      { text: `🗒️ *ORDER SUMMARY*: \n\n🧁 Flavors: *${desserts}* \n🚚 Delivery fee: *to be confirmed*. \n📍 Address:*${message}* \n💰 Value of cakes: *${
        total * 6
      },00 reais*. \n⏳ Delivery time: *50 minutes*. \n\n` +
        '🔊 ```Now, inform the method of payment and if you will need change, please.```' }
    );

    return '✅ *Done, order placed!*\n\nNow, if you still do not know the value of the delivery fee for your region, I will pass it on to an attendant so that he can check the value of the *delivery fee*. \n\n⏳ *Wait a minute*.';
  },
};
