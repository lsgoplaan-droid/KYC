const http = require('http');
const https = require('https');

const PORT = 3001;

// Target hosts by route prefix
const TARGETS = {
  '/ch/': { hostname: 'api.company-information.service.gov.uk', stripPrefix: '/ch' },
  '/sg/': { hostname: 'data.gov.sg', stripPrefix: '/sg' },
};

function getTarget(url) {
  for (const [prefix, config] of Object.entries(TARGETS)) {
    if (url.startsWith(prefix)) {
      return { ...config, path: url.slice(config.stripPrefix.length) };
    }
  }
  // Default: forward to Companies House (backward compatibility)
  return { hostname: 'api.company-information.service.gov.uk', path: url };
}

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const target = getTarget(req.url);

  // Only forward Authorization and Accept headers — strip browser headers
  const forwardHeaders = {
    host: target.hostname,
    accept: 'application/json',
  };
  if (req.headers.authorization) {
    forwardHeaders['authorization'] = req.headers.authorization;
  }

  const options = {
    hostname: target.hostname,
    path: target.path,
    method: req.method,
    headers: forwardHeaders,
  };

  const proxyReq = https.request(options, (proxyRes) => {
    const headers = { ...proxyRes.headers };
    headers['access-control-allow-origin'] = '*';
    res.writeHead(proxyRes.statusCode, headers);
    proxyRes.pipe(res);
  });

  proxyReq.on('error', (e) => {
    res.writeHead(502, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: e.message }));
  });

  req.pipe(proxyReq);
});

server.listen(PORT, () => {
  console.log(`CORS proxy running on http://localhost:${PORT}`);
  console.log('Routes: /ch/* -> Companies House, /sg/* -> data.gov.sg, default -> Companies House');
});
