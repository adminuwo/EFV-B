require('dotenv').config();
const { Order } = require('./src/models');
const path = require('path');

async function test() {
    console.log('--- Testing Enhanced JsonAdapter.find ---');

    const user = {
        _id: 'mlrnq3u492vak53seqk',
        email: 'abha@uwo24.com'
    };

    const query = {
        $or: [
            { userId: user._id },
            { "customer.email": user.email }
        ]
    };

    console.log('Query:', JSON.stringify(query, null, 2));

    try {
        const orders = await Order.find(query);
        console.log(`Found ${orders.length} orders for ${user.email}`);
        orders.forEach(o => {
            console.log(`- Order ID: ${o.orderId}, UserID: ${o.userId}, Customer Email: ${o.customer?.email}`);
        });

        if (orders.length > 0) {
            console.log('✅ SUCCESS: Orders found using $or and nested key.');
        } else {
            console.log('❌ FAILURE: No orders found.');
        }
    } catch (err) {
        console.error('💥 Error:', err);
    }
}

test();
