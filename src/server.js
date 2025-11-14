import { makeWASocket, useMultiFileAuthState, DisconnectReason } from '@whiskeysockets/baileys';
import { stages } from './stages.js';
import { getState, setState } from './storage.js';
import { startCronJobs } from './cron_jobs.js';
import Pino from 'pino';

const logger = Pino();

async function start() {
  const { state, saveCreds } = await useMultiFileAuthState('./tokens/session-name');

  const client = makeWASocket({
    auth: state,
    logger: Pino({ level: 'silent' }),
    printQRInTerminal: true,
    syncFullHistory: true,
    defaultQueryTimeoutMs: 30000,
  });

  const { connection, lastDisconnect } = client.ev;

  client.ev.on('creds.update', saveCreds);

  client.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === 'close') {
      const shouldReconnect = (lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut);

      if (shouldReconnect) {
        start();
      } else {
        console.log('❌ Bot disconnected:', lastDisconnect?.error);
        process.exit();
      }
    } else if (connection === 'open') {
      console.log('✅ Bot connected successfully!');
      startCronJobs(client);
    }
  });

  client.ev.on('messages.upsert', async ({ messages }) => {
    for (const message of messages) {
      try {
        if (message.key.fromMe) return;
        if (!message.message) return;

        const text = message.message.conversation || message.message.extendedTextMessage?.text || '';
        const from = message.key.remoteJid;

        if (!text) return;

        const state = getState(from);

        const messageResponse = stages[state.stage].stage.exec({
          from,
          message: text,
          client,
          state,
        });

        if (messageResponse) {
          await client.sendMessage(from, { text: messageResponse });
        }
      } catch (error) {
        console.error('Error processing message:', error);
      }
    }
  });

  process.on('SIGINT', function () {
    console.log('👋 Closing bot gracefully...');
    client.end();
    process.exit(0);
  });
}

start().catch((err) => {
  console.error('❌ Error starting bot:', err);
  process.exit(1);
});
