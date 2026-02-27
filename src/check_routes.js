
const express = require('express');
const app = express();
const nimbusShipping = require('./routes/nimbusShipping').default || require('./routes/nimbusShipping');
console.log('Type of nimbusShipping:', typeof nimbusShipping);
if (typeof nimbusShipping === 'function' && nimbusShipping.stack) {
    console.log('Routes in nimbusShipping:');
    nimbusShipping.stack.forEach(r => {
        if (r.route && r.route.path) {
            console.log(Object.keys(r.route.methods).join(', ').toUpperCase(), r.route.path);
        }
    });
} else {
    console.log('Not a router or standard middleware');
}
