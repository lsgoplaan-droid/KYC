const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type',
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS_HEADERS };
  }

  const path = event.path.replace(/^\/(api\/ch|\.netlify\/functions\/proxy-ch)/, '') || '/';
  const qs = event.rawQuery ? `?${event.rawQuery}` : '';
  const targetUrl = `https://api.company-information.service.gov.uk${path}${qs}`;

  const headers = { Accept: 'application/json' };

  if (event.headers.authorization) {
    headers.Authorization = event.headers.authorization;
  } else if (process.env.COMPANIES_HOUSE_API_KEY) {
    const encoded = Buffer.from(process.env.COMPANIES_HOUSE_API_KEY + ':').toString('base64');
    headers.Authorization = `Basic ${encoded}`;
  }

  try {
    const response = await fetch(targetUrl, {
      method: event.httpMethod,
      headers,
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
