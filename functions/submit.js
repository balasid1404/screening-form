// Serverless proxy — hides KoboToolbox API token from the frontend
exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method not allowed' };
    }

    const KOBO_TOKEN = process.env.KOBO_API_TOKEN;
    const KOBO_ASSET_UID = process.env.KOBO_ASSET_UID;
    const KOBO_SERVER = process.env.KOBO_SERVER || 'https://kf.kobotoolbox.org';

    if (!KOBO_TOKEN || !KOBO_ASSET_UID) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Server not configured. Set KOBO_API_TOKEN and KOBO_ASSET_UID.' })
        };
    }

    try {
        const formData = JSON.parse(event.body);
        const url = `${KOBO_SERVER}/api/v2/assets/${KOBO_ASSET_UID}/submissions/`;

        const resp = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Token ${KOBO_TOKEN}`
            },
            body: JSON.stringify({ submission: formData })
        });

        const data = await resp.text();
        return {
            statusCode: resp.status,
            headers: { 'Content-Type': 'application/json' },
            body: data
        };
    } catch (err) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: err.message })
        };
    }
};
