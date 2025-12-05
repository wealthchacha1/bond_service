// logger.js
const path = require("path");
const pino = require("pino");

const logPath = path.join(
  __dirname,
  "logs",
  `app-${new Date().toISOString().split("T")[0]}.log`
);

const logger = pino({
  level: "info",
  base: { service: process.env.SERVICE_NAME },
  transport: {
    targets: [
      { target: "pino-pretty", options: { colorize: true } },
      { target: "pino/file", options: { destination: logPath, mkdir: true } },
    ],
  },
});

global.logger = logger;
module.exports = logger;
