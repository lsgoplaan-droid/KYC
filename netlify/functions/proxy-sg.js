const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS_HEADERS };
  }

  const path = event.path.replace(/^\/(api\/sg|\.netlify\/functions\/proxy-sg)/, '') || '/';
  const qs = event.rawQuery ? `?${event.rawQuery}` : '';
  const targetUrl = `https://data.gov.sg${path}${qs}`;

  try {
    const response = await fetch(targetUrl, {
      method: event.httpMethod,
      headers: { Accept: 'application/json' },
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
