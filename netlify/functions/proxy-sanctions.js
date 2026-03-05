const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type',
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS_HEADERS };
  }

  const path = event.path.replace('/.netlify/functions/proxy-sanctions', '') || '/';
  const qs = event.rawQuery ? `?${event.rawQuery}` : '';
  const targetUrl = `https://api.opensanctions.org${path}${qs}`;

  const headers = { 'Content-Type': 'application/json' };

  if (event.headers.authorization) {
    headers.Authorization = event.headers.authorization;
  } else if (process.env.OPENSANCTIONS_API_KEY) {
    headers.Authorization = `ApiKey ${process.env.OPENSANCTIONS_API_KEY}`;
  }

  try {
    const response = await fetch(targetUrl, {
      method: event.httpMethod,
      headers,
      body: event.httpMethod !== 'GET' ? event.body : undefined,
    });

    const body = await response.text();

    return {
      statusCode: response.status,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      body,
    };
  } catch (error) {
    return {
      statusCode: 502,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: error.message }),
    };
  }
};
