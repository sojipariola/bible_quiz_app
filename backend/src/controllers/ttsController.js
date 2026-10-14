const https = require('https');

// Google Cloud TTS — 1M chars/month free
// Set GOOGLE_TTS_API_KEY in .env
const synthesize = async (req, res) => {
    const { text, voice = 'en-US-Neural2-D', rate = 1.0 } = req.body;

    if (!text || text.length > 5000) {
        return res.status(400).json({ message: 'text required, max 5000 chars' });
    }

    const apiKey = process.env.GOOGLE_TTS_API_KEY;
    if (!apiKey) {
        return res.status(500).json({ message: 'Google TTS key not configured' });
    }

    const payload = JSON.stringify({
        input: { text },
        voice: { languageCode: voice.split('-').slice(0, 2).join('-'), name: voice },
        audioConfig: { audioEncoding: 'MP3', speakingRate: rate }
    });

    const options = {
        hostname: 'texttospeech.googleapis.com',
        path: `/v1/text:synthesize?key=${apiKey}`,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(payload)
        }
    };

    const reqApi = https.request(options, (apiRes) => {
        let body = '';
        apiRes.on('data', chunk => body += chunk);
        apiRes.on('end', () => {
            if (apiRes.statusCode !== 200) {
                return res.status(apiRes.statusCode).json({ message: 'TTS API error', detail: body });
            }
            const parsed = JSON.parse(body);
            const audioBuffer = Buffer.from(parsed.audioContent, 'base64');
            res.set('Content-Type', 'audio/mpeg');
            res.send(audioBuffer);
        });
    });

    reqApi.on('error', (err) => {
        res.status(500).json({ message: 'TTS request failed', error: err.message });
    });

    reqApi.write(payload);
    reqApi.end();
};

module.exports = { synthesize };