import { storage } from '../storage.js';

export const stageFour = {
  exec({ from, message }) {
    const address = storage[from].address;
    const phone = from.split('@');

    storage[from].stage = 5;
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

    return `🔔 *NEW REQUEST*🔔: \n\n📞 Client: +${
      phone[0]
    } \n🧁 Flavors: *${desserts}* \n📍 Address:*${address}* \n🚚 Delivery fee: *to be confirmed*. \n💰 Value of cakes: *${
      total * 6
    },00 reais*. \n⏳ Delivery time: *50 minutes*. \n🛑 Details: *${message}*`;
  },
};
