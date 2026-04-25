import http from 'http';
import https from 'https';

const server = http.createServer((req, res) => {
  let body = [];
  
  req.on('data', chunk => {
    body.push(chunk);
  });
  
  req.on('end', () => {
    const buffer = Buffer.concat(body);
    
    // Prepare headers for OpenRouter
    const headers = { ...req.headers };
    headers['host'] = 'openrouter.ai';
    
    // These are the magical headers required for completely free models!
    headers['HTTP-Referer'] = 'http://localhost:5173/';
    headers['X-Title'] = 'Claude Code CLI';
    
    const options = {
      hostname: 'openrouter.ai',
      port: 443,
      path: req.url, // Usually /api/v1/messages
      method: req.method,
      headers: headers
    };
    
    const proxyReq = https.request(options, proxyRes => {
      res.writeHead(proxyRes.statusCode, proxyRes.headers);
      proxyRes.pipe(res);
    });
    
    proxyReq.on('error', e => {
      console.error('Proxy Error:', e.message);
      res.statusCode = 500;
      res.end('Proxy Error');
    });
    
    if (buffer.length > 0) {
      proxyReq.write(buffer);
    }
    proxyReq.end();
  });
});

server.listen(8000, () => {
  console.log('OpenRouter Proxy is running on http://127.0.0.1:8000');
  console.log('This proxy automatically injects the HTTP-Referer headers required for free models.');
});
