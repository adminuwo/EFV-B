const http = require('http');

const data = JSON.stringify({ message: 'Explain the philosophy of quantum alignment in simple terms' });

const req = http.request({
    hostname: 'localhost',
    port: 8080,
    path: '/api/chat/message',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
}, res => {
    let body = '';
    res.on('data', d => body += d);
    res.on('end', () => {
        const json = JSON.parse(body);
        console.log(`isDemo: ${json.isDemo}`);
        if (json.response) {
            console.log(`Response snippet: ${json.response.substring(0, 50)}...`);
        } else {
            console.log(`Full response: ${body}`);
        }
    });
});

req.on('error', error => {
    console.error(error);
});

req.write(data);
req.end();
