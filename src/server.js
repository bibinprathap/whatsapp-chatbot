import 'dotenv/config';
import {
  makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
} from "@whiskeysockets/baileys";
import { stages } from "./stages.js";
import { getState, setState } from "./storage.js";
import { startCronJobs } from "./cron_jobs.js";
import { processNaturalLanguage } from "./nlp/index.js";
import Pino from "pino";
import qrcode from "qrcode-terminal";

const logger = Pino();

let client = null;

async function start() {
  const { state, saveCreds } = await useMultiFileAuthState(
    "./tokens/session-name"
  );

  client = makeWASocket({
    auth: state,
    logger: Pino({ level: "silent" }),
    browser: ["WhatsApp-Bot", "Chrome", "5.0"],
    syncFullHistory: false,
    defaultQueryTimeoutMs: 60000,
    generateHighQualityLinkPreview: true,
    markOnlineOnConnect: true,
    printQRInTerminal: false,
  });

  client.ev.on("creds.update", saveCreds);

  client.ev.on("connection.update", async (update) => {
    const { qr, connection, lastDisconnect, isOnline } = update;

    if (qr) {
      console.log("\n\n████████████████████████████████████████");
      console.log("👇👇👇 SCAN THIS QR CODE 👇👇👇");
      console.log("████████████████████████████████████████\n");
      qrcode.generate(qr, { small: true });
      console.log("\n████████████████████████████████████████");
      console.log("👆👆👆 USE YOUR PHONE TO SCAN 👆👆👆");
      console.log("████████████████████████████████████████\n\n");
    }

    if (connection === "open") {
      console.log("\n✅✅✅ WhatsApp connection is OPEN! ✅✅✅\n");
      startCronJobs(client);
    }

    if (connection === "close") {
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

      if (shouldReconnect) {
        console.log("\n❌ Connection closed. Reconnecting in 5 seconds...\n");
        await new Promise(resolve => setTimeout(resolve, 5000));
        console.log("🔄 Attempting to reconnect...\n");
        if (client) client.end();
        await new Promise(resolve => setTimeout(resolve, 1000));
        start();
      } else {
        console.log("\n✋ Bot was logged out. Exiting gracefully.\n");
        process.exit(0);
      }
    }
  });

  client.ev.on("messages.upsert", async ({ messages }) => {
    for (const message of messages) {
      try {
        if (message.key.fromMe) return;
        if (!message.message) return;

        const text =
          message.message.conversation ||
          message.message.extendedTextMessage?.text ||
          "";
        const from = message.key.remoteJid;

        if (!text) return;

        const state = getState(from);

        // 🤖 Try Natural Language processing first (AI-powered ordering)
        const nlResult = await processNaturalLanguage({
          from,
          message: text,
          client,
          state,
        });

        if (nlResult?.handled) {
          // NL processor handled the message
          if (nlResult.response) {
            await client.sendMessage(from, { text: nlResult.response });
          }
          continue;
        }

        // Fall back to traditional stage-based routing
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
        console.error("Error processing message:", error);
      }
    }
  });

  process.removeAllListeners("SIGINT");
  process.on("SIGINT", function () {
    console.log("👋 Closing bot gracefully...");
    if (client) client.end();
    process.exit(0);
  });
}

process.setMaxListeners(15);

start().catch((err) => {
  console.error("❌ Error starting bot:", err);
  process.exit(1);
});
