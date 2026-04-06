import "dotenv/config";
import { createApp } from "./app.js";

const port = Number(process.env.PORT) || 5000;
const app = createApp();

const server = app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

server.on("error", (err: NodeJS.ErrnoException) => {
  if (err.code === "EADDRINUSE") {
    console.error(
      `Port ${port} is already in use. Close the other process (e.g. another \`node server.js\` or \`npm run dev\`) or set PORT in .env.`,
    );
  } else {
    console.error(err);
  }
  process.exit(1);
});
