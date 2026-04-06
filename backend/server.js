import { createApp } from "./dist/app.js";

const port = Number(process.env.PORT) || 5000;

const app = createApp();

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

process.on("SIGTERM", () => {
	console.log("SIGTERM signal received: closing HTTP server");
	server.close(() => {
		console.log("HTTP server closed");
	});
});
