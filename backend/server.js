import path from "node:path";
import { fileURLToPath } from "node:url";
import next from "next";
import { createApp } from "./dist/app.js";

const port = Number(process.env.PORT) || 5000;
const dev = process.env.NODE_ENV !== "production";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendDir = path.resolve(__dirname, "../frontend");

const nextApp = next({ dev, dir: frontendDir });
const handle = nextApp.getRequestHandler();

async function startServer() {
	await nextApp.prepare();

	const app = createApp();

	// Let Next.js handle all non-API routes (/, /admin, /book, etc.)
	app.all("*", (req, res) => handle(req, res));

	const server = app.listen(port, () => {
		console.log(`Server listening on port ${port}`);
	});

	server.on("error", (err) => {
		if (err.code === "EADDRINUSE") {
			console.error(
				`Port ${port} is already in use. Close the other process or set PORT in environment variables.`,
			);
		} else {
			console.error(err);
		}
		process.exit(1);
	});
}

startServer().catch((error) => {
	console.error("Failed to start combined server", error);
	process.exit(1);
});
