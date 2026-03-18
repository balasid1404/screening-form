// Serverless proxy — submits to KoboToolbox via kc API (v1 submissions endpoint)
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
    const KC_SERVER = process.env.KOBO_SERVER
        ? process.env.KOBO_SERVER.replace('kf.', 'kc.')
        : 'https://kc.kobotoolbox.org';

    if (!KOBO_TOKEN || !KOBO_ASSET_UID) {
        return {
            statusCode: 500, headers,
            body: JSON.stringify({ error: 'Missing KOBO_API_TOKEN or KOBO_ASSET_UID' })
        };
    }

    try {
        const formData = JSON.parse(event.body);
        const instanceId = 'uuid:' + crypto.randomUUID();

        // Build submission in the format KoboToolbox expects
        const submission = {
            id: KOBO_ASSET_UID,
            submission: {
                ...formData,
                'meta/instanceID': instanceId,
                'formhub/uuid': KOBO_ASSET_UID
            }
        };

        const url = `${KC_SERVER}/api/v1/submissions`;

        const resp = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Token ${KOBO_TOKEN}`
            },
            body: JSON.stringify(submission)
        });

        const data = await resp.text();

        if (resp.status === 201 || resp.status === 202) {
            return {
                statusCode: 201, headers,
                body: JSON.stringify({ success: true, message: 'Submitted' })
            };
        }

        return {
            statusCode: resp.status, headers,
            body: JSON.stringify({ error: 'Submission failed', detail: data })
        };
    } catch (err) {
        return {
            statusCode: 500, headers,
            body: JSON.stringify({ error: err.message })
        };
    }
};
