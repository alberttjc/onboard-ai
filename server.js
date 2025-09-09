// server.js - Improved Next.js server with better WebSocket support
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer((req, res) => {
    // Be sure to pass `true` as the second argument to `url.parse`.
    // This tells it to parse the query portion of the URL.
    const parsedUrl = parse(req.url, true);
    
    // Set longer timeout for responses to prevent premature connection closing
    res.setTimeout(120000); // 2 minutes
    
    handle(req, res, parsedUrl);
  });
  
  // Increase timeout for keep-alive connections to prevent WebSocket disconnects
  server.keepAliveTimeout = 65000; // 65 seconds
  server.headersTimeout = 66000; // 66 seconds
  
  // Allow larger payloads for audio/video data
  server.maxHeadersCount = 100; // Default is 40
  
  server.listen(3000, (err) => {
    if (err) throw err;
    console.log('> Ready on http://localhost:3000');
    console.log('> Enhanced server configuration for WebSocket stability');
  });
});
