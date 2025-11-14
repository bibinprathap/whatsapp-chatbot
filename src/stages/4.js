import { setState } from '../storage.js';

export const stageFour = {
  exec({ from, message, state }) {
    const address = state.address;
    const phone = from.split('@');

    state.stage = 5;
    setState(from, state);

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

    return `🔔 *NEW REQUEST*🔔: \n\n📞 Client: +${
      phone[0]
    } \n🧁 Flavors: *${desserts}* \n📍 Address:*${address}* \n🚚 Delivery fee: *to be confirmed*. \n💰 Value of cakes: *${
      total * 6
    },00 reais*. \n⏳ Delivery time: *50 minutes*. \n🛑 Details: *${message}*`;
  },
};
