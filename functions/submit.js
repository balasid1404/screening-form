// Serverless proxy — submits to KoboToolbox
const crypto = require('crypto');

exports.handler = async (event) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, headers, body: 'Method not allowed' };
    }

    const KOBO_TOKEN = process.env.KOBO_API_TOKEN;
    const KOBO_ASSET_UID = process.env.KOBO_ASSET_UID;
    const KF_SERVER = process.env.KOBO_SERVER || 'https://kf.kobotoolbox.org';

    if (!KOBO_TOKEN || !KOBO_ASSET_UID) {
        return {
            statusCode: 500, headers,
            body: JSON.stringify({ error: 'Missing KOBO_API_TOKEN or KOBO_ASSET_UID' })
        };
    }

    try {
        const formData = JSON.parse(event.body);
        const instanceId = 'uuid:' + crypto.randomUUID();

        // Try v1 submission first (kc endpoint)
        const kcServer = KF_SERVER.replace('kf.', 'kc.');
        const v1Payload = {
            id: KOBO_ASSET_UID,
            submission: {
                ...formData,
                'meta/instanceID': instanceId,
                'formhub/uuid': KOBO_ASSET_UID
            }
        };

        let resp = await fetch(`${kcServer}/api/v1/submissions?format=json`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Token ${KOBO_TOKEN}`
            },
            body: JSON.stringify(v1Payload)
        });

        // If v1 fails, try v2 endpoint
        if (resp.status === 404) {
            const v2Url = `${KF_SERVER}/api/v2/assets/${KOBO_ASSET_UID}/submissions/`;
            resp = await fetch(v2Url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Token ${KOBO_TOKEN}`
                },
                body: JSON.stringify({
                    submission: {
                        ...formData,
                        'meta/instanceID': instanceId
                    }
                })
            });
        }

        const data = await resp.text();

        // Log for debugging (visible in Netlify function logs)
        console.log('Response status:', resp.status);
        console.log('Response body:', data);

        if (resp.status >= 200 && resp.status < 300) {
            return {
                statusCode: 201, headers,
                body: JSON.stringify({ success: true })
            };
        }

        return {
            statusCode: resp.status, headers,
            body: JSON.stringify({
                error: 'Submission failed',
                status: resp.status,
                detail: data
            })
        };
    } catch (err) {
        console.log('Error:', err.message);
        return {
            statusCode: 500, headers,
            body: JSON.stringify({ error: err.message })
        };
    }
};
