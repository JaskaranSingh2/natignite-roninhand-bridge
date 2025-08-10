const { createProxyMiddleware } = require("http-proxy-middleware");
const express = require("express");
const app = express();

// Proxy configuration to handle CORS issues with api.py
const proxy = createProxyMiddleware({
	target: "http://127.0.0.1:7001",
	changeOrigin: true,
	onProxyRes: function (proxyRes, req, res) {
		// Remove duplicate CORS headers from api.py
		delete proxyRes.headers["access-control-allow-origin"];
		delete proxyRes.headers["access-control-allow-methods"];
		delete proxyRes.headers["access-control-allow-headers"];

		// Set clean CORS headers
		res.header("Access-Control-Allow-Origin", "*");
		res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
		res.header("Access-Control-Allow-Headers", "Content-Type");
	},
});

app.use("/", proxy);

const PORT = 7002;
app.listen(PORT, () => {
	console.log(`CORS Proxy running on http://localhost:${PORT}`);
	console.log(`Proxying requests to api.py at http://127.0.0.1:7001`);
});
