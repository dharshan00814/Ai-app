/**
 * Testing & Debugging Utilities
 * Run these commands in browser console or Node.js to test the system
 */

// ============================================
// BROWSER CONSOLE TESTS
// ============================================

// 1. Test system health
async function testHealth() {
    const response = await fetch('http://localhost:3000/api/health');
    const data = await response.json();
    console.log('✅ Health Check:', data);
    return data.success;
}

// 2. Test system stats
async function testStats() {
    const response = await fetch('http://localhost:3000/api/stats');
    const data = await response.json();
    console.log('📊 System Stats:', data);
    return data.stats;
}

// 3. Simulate resume upload (requires file)
async function testUpload(file) {
    const formData = new FormData();
    formData.append('resumes', file);
    
    const response = await fetch('http://localhost:3000/api/upload', {
        method: 'POST',
        body: formData
    });
    const data = await response.json();
    console.log('📤 Upload Result:', data);
    return data;
}

// 4. Get all results
async function testGetResults() {
    const response = await fetch('http://localhost:3000/api/results');
    const data = await response.json();
    console.log('📋 All Results:', data);
    return data;
}

// 5. Cleanup uploads
async function testCleanup() {
    const response = await fetch('http://localhost:3000/api/cleanup', {
        method: 'POST'
    });
    const data = await response.json();
    console.log('🧹 Cleanup Result:', data);
    return data;
}

// ============================================
// NODE.JS TEST SCRIPT
// ============================================

const testScript = `
const http = require('http');

function makeRequest(options, data = null) {
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(body));
                } catch (e) {
                    resolve(body);
                }
            });
        });
        
        req.on('error', reject);
        if (data) req.write(JSON.stringify(data));
        req.end();
    });
}

async function runTests() {
    console.log('🧪 Starting Tests...\\n');
    
    try {
        // Test 1: Health Check
        console.log('Test 1: Health Check');
        const healthResp = await makeRequest({
            hostname: 'localhost',
            port: 3000,
            path: '/api/health',
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });
        console.log('Result:', healthResp);
        console.log();
        
        // Test 2: Get Stats
        console.log('Test 2: Get System Stats');
        const statsResp = await makeRequest({
            hostname: 'localhost',
            port: 3000,
            path: '/api/stats',
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });
        console.log('Result:', statsResp);
        console.log();
        
        // Test 3: Get Results
        console.log('Test 3: Get All Results');
        const resultsResp = await makeRequest({
            hostname: 'localhost',
            port: 3000,
            path: '/api/results',
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });
        console.log('Result:', resultsResp);
        console.log();
        
        console.log('✅ All tests completed!');
        
    } catch (err) {
        console.error('❌ Test failed:', err.message);
    }
}

runTests();
`;

// ============================================
// PERFORMANCE TEST
// ============================================

const performanceTest = `
async function performanceTest() {
    console.time('Total Performance Test');
    
    // Test API response times
    const tests = [
        { name: 'Health Check', endpoint: '/api/health' },
        { name: 'Get Stats', endpoint: '/api/stats' },
        { name: 'Get Results', endpoint: '/api/results' }
    ];
    
    for (let test of tests) {
        console.time(test.name);
        const response = await fetch('http://localhost:3000' + test.endpoint);
        const data = await response.json();
        console.timeEnd(test.name);
        console.log('✅', test.name, '- Status:', response.status);
    }
    
    console.timeEnd('Total Performance Test');
}
`;

// ============================================
// STRESS TEST
// ============================================

const stressTest = `
async function stressTest(iterations = 100) {
    console.log(\`🔥 Starting stress test with \${iterations} concurrent requests...\\n\`);
    
    const start = Date.now();
    const requests = [];
    
    for (let i = 0; i < iterations; i++) {
        requests.push(
            fetch('http://localhost:3000/api/health')
                .then(r => r.json())
                .catch(e => ({ error: e.message }))
        );
    }
    
    const results = await Promise.all(requests);
    const duration = Date.now() - start;
    
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => r.error || !r.success).length;
    
    console.log(\`✅ Completed in \${duration}ms\`);
    console.log(\`📊 Successful: \${successful} | Failed: \${failed}\`);
    console.log(\`⚡ Requests/sec: \${(iterations / (duration / 1000)).toFixed(2)}\`);
}
`;

// ============================================
// DEBUGGING HELPERS
// ============================================

const debugHelpers = `
// Log all network requests
function logNetworkRequests() {
    const originalFetch = window.fetch;
    window.fetch = function(...args) {
        console.log('🌐 Request:', args[0], args[1]);
        return originalFetch.apply(this, args)
            .then(response => {
                console.log('📨 Response:', response.status);
                return response;
            })
            .catch(err => {
                console.error('❌ Error:', err);
                throw err;
            });
    };
}

// Monitor stats updates
function monitorStats() {
    const originalTextContent = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'textContent').set;
    Object.defineProperty(HTMLElement.prototype, 'textContent', {
        set: function(value) {
            if (this.id && this.id.includes('Count')) {
                console.log(\`📊 \${this.id} updated to: \${value}\`);
            }
            return originalTextContent.call(this, value);
        }
    });
}

// Check browser console for errors
function checkConsoleErrors() {
    const errors = [];
    const originalError = console.error;
    console.error = function(...args) {
        errors.push(args);
        return originalError.apply(console, args);
    };
    return errors;
}
`;

// ============================================
// EXAMPLE TEST COMMANDS
// ============================================

const exampleCommands = `
// Run these in browser console (F12):

// 1. Check system health
await testHealth()

// 2. Get system stats
await testStats()

// 3. Get all results
await testGetResults()

// 4. Performance test
await performanceTest()

// 5. Stress test (100 requests)
await stressTest(100)

// 6. Monitor network requests
logNetworkRequests()

// 7. Monitor stats
monitorStats()

// 8. Cleanup
await testCleanup()

// 9. Check for errors
checkConsoleErrors()
`;

module.exports = {
    testScript,
    performanceTest,
    stressTest,
    debugHelpers,
    exampleCommands
};
`;
