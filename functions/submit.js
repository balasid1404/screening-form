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
    const kcServer = KF_SERVER.replace('kf.', 'kc.');

    if (!KOBO_TOKEN || !KOBO_ASSET_UID) {
        return { statusCode: 500, headers, body: JSON.stringify({ error: 'Missing env vars' }) };
    }

    try {
        const formData = JSON.parse(event.body);
        const instanceId = 'uuid:' + crypto.randomUUID();

        // Get form UUID from kc API
        const formsResp = await fetch(
            `${kcServer}/api/v1/forms?format=json`,
            { headers: { 'Authorization': `Token ${KOBO_TOKEN}` } }
        );
        const forms = await formsResp.json();
        let formUUID = null;
        let formIdString = null;
        for (const f of forms) {
            if (f.id_string === KOBO_ASSET_UID) {
                formUUID = f.uuid;
                formIdString = f.id_string;
                break;
            }
        }
        console.log('Found form:', formIdString, 'uuid:', formUUID);

        // Build submission with nested meta and formhub objects
        const submission = {
            id: formIdString || KOBO_ASSET_UID,
            submission: {
                ...formData,
                meta: {
                    instanceID: instanceId
                },
                formhub: {
                    uuid: formUUID || KOBO_ASSET_UID
                }
            }
        };

        console.log('Payload:', JSON.stringify(submission).substring(0, 500));

        const resp = await fetch(`${kcServer}/api/v1/submissions?format=json`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Token ${KOBO_TOKEN}`
            },
            body: JSON.stringify(submission)
        });

        const data = await resp.text();
        console.log('Response:', resp.status, data);

        if (resp.status >= 200 && resp.status < 300) {
            return { statusCode: 201, headers, body: JSON.stringify({ success: true }) };
        }

        return {
            statusCode: resp.status, headers,
            body: JSON.stringify({ error: 'Submission failed', status: resp.status, detail: data })
        };
    } catch (err) {
        console.log('Error:', err.message);
        return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
    }
};
