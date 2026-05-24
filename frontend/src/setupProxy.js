const { createProxyMiddleware } = require("http-proxy-middleware");

module.exports = function (app) {
  app.use(
    "/ollama-proxy",
    createProxyMiddleware({
      target: "http://127.0.0.1:11434",
      changeOrigin: true,
      pathRewrite: { "^/ollama-proxy": "" },
    })
  );
};
