const http = require('http');
const fs = require('fs');
const path = require('path');

/**
 * Test script for the generateQrCode method
 * This script generates a QR code and saves it as a PNG image
 */

function makeRequest(method, params = {}) {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify({
            jsonrpc: "2.0",
            method: method,
            params: params,
            id: 1
        });

        const options = {
            hostname: 'localhost',
            port: 8080,
            path: '/',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': data.length
            }
        };

        const req = http.request(options, (res) => {
            let body = '';

            res.on('data', (chunk) => {
                body += chunk;
            });

            res.on('end', () => {
                try {
                    const response = JSON.parse(body);
                    resolve(response);
                } catch (e) {
                    reject(new Error(`Failed to parse response: ${e.message}`));
                }
            });
        });

        req.on('error', (e) => {
            reject(e);
        });

        req.write(data);
        req.end();
    });
}

function saveQrCodeImage(base64Data, filename) {
    try {
        // Remove the data URL prefix (data:image/png;base64,)
        const base64Image = base64Data.replace(/^data:image\/png;base64,/, '');
        
        // Convert base64 to buffer
        const imageBuffer = Buffer.from(base64Image, 'base64');
        
        // Save to file
        const outputPath = path.join(__dirname, filename);
        fs.writeFileSync(outputPath, imageBuffer);
        
        console.log(`✅ QR code saved to: ${outputPath}`);
        return outputPath;
    } catch (error) {
        console.error('❌ Error saving QR code:', error.message);
        return null;
    }
}

async function testGenerateAndDisplayQrCode() {
    console.log('🧪 Testing QR Code Generation with Visual Display\n');
    console.log('='.repeat(60));

    try {
        // Test 1: Generate QR code for 0.1 NANO
        console.log('\n📱 Test 1: Generate QR code for 0.1 NANO payment');
        console.log('-'.repeat(60));
        
        const test1 = await makeRequest('generateQrCode', {
            address: 'nano_3qya5xpjfsbk3ndfebo9dsrj6iy6f6idmogqtn1mtzdtwnxu6rw3dz18i6xf',
            amount: '0.1'
        });

        if (test1.result && test1.result.success) {
            console.log('✅ QR Code Generated Successfully!');
            console.log('\n📋 Payment Details:');
            console.log('   Address:', test1.result.address);
            console.log('   Amount:', test1.result.amount, 'NANO');
            console.log('   Payment String:', test1.result.paymentString);
            console.log('   Format:', test1.result.format);
            
            const savedPath = saveQrCodeImage(test1.result.qrCode, 'qr-payment-0.1-nano.png');
            if (savedPath) {
                console.log('\n🖼️  You can now open the QR code image:');
                console.log('   ', savedPath);
            }
        } else {
            console.log('❌ Failed:', test1.error || 'No result returned');
        }

        console.log('\n' + '='.repeat(60));

        // Test 2: Generate QR code for 1.5 NANO (different amount)
        console.log('\n📱 Test 2: Generate QR code for 1.5 NANO payment');
        console.log('-'.repeat(60));
        
        const test2 = await makeRequest('generateQrCode', {
            address: 'nano_13ptrmobmsd9xawyequr83cz833x4usybeejtrc7sr6i358k89yumtyko5ao',
            amount: '1.5'
        });

        if (test2.result && test2.result.success) {
            console.log('✅ QR Code Generated Successfully!');
            console.log('\n📋 Payment Details:');
            console.log('   Address:', test2.result.address);
            console.log('   Amount:', test2.result.amount, 'NANO');
            console.log('   Payment String:', test2.result.paymentString);
            
            const savedPath = saveQrCodeImage(test2.result.qrCode, 'qr-payment-1.5-nano.png');
            if (savedPath) {
                console.log('\n🖼️  You can now open the QR code image:');
                console.log('   ', savedPath);
            }
        } else {
            console.log('❌ Failed:', test2.error || 'No result returned');
        }

        console.log('\n' + '='.repeat(60));

        // Test 3: Generate QR code for your specific wallet
        console.log('\n📱 Test 3: Generate QR code for 0.5 NANO to your wallet');
        console.log('-'.repeat(60));
        
        const test3 = await makeRequest('generateQrCode', {
            address: 'nano_3h5fu37g8mcz8ndu8xgfx3dds6dks6qnp3k8rhjf8knuzec7zr1gdujjqqwc',
            amount: '0.5'
        });

        if (test3.result && test3.result.success) {
            console.log('✅ QR Code Generated Successfully!');
            console.log('\n📋 Payment Details:');
            console.log('   Address:', test3.result.address);
            console.log('   Amount:', test3.result.amount, 'NANO');
            console.log('   Payment String:', test3.result.paymentString);
            
            const savedPath = saveQrCodeImage(test3.result.qrCode, 'qr-payment-your-wallet.png');
            if (savedPath) {
                console.log('\n🖼️  You can now open the QR code image:');
                console.log('   ', savedPath);
            }
        } else {
            console.log('❌ Failed:', test3.error || 'No result returned');
        }

        console.log('\n' + '='.repeat(60));
        console.log('\n🎉 All QR codes have been generated and saved!');
        console.log('\n💡 How to use:');
        console.log('   1. Open the PNG files in your file explorer');
        console.log('   2. Scan with any NANO wallet (Natrium, Nault, etc.)');
        console.log('   3. The wallet will automatically fill in the address and amount');
        console.log('\n📁 Files saved in:', __dirname);
        console.log('\n');

    } catch (error) {
        console.error('\n❌ Test failed with error:', error.message);
        console.error('Make sure the MCP server is running on http://localhost:8080');
        console.error('\nTo start the server, run:');
        console.error('   node src/index.js');
    }
}

// Run tests
testGenerateAndDisplayQrCode();

