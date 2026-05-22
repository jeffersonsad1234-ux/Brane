const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/api/tts',
    createProxyMiddleware({
      target: 'https://speech.platform.bing.com',
      changeOrigin: true,
      pathRewrite: {
        '^/api/tts': '/consumer/speech/synthesize/readaloud/edge/v1',
      },
      on: {
        proxyReq: (proxyReq, req, res) => {
          proxyReq.setHeader('Origin', 'https://edge.bing.com');
          proxyReq.setHeader('Referer', 'https://edge.bing.com/');
          proxyReq.setHeader('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36 Edg/125.0.0.0');
        },
      },
    })
  );
};
