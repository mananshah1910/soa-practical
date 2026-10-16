const http = require('http');

const GATEWAY_URL = process.env.GATEWAY_URL || 'http://localhost:8000';

// ANSI colors for clean test reporting
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

const delay = (ms) => new Promise(res => setTimeout(res, ms));

async function isGatewayRunning() {
  try {
    const res = await fetch(`${GATEWAY_URL}/`);
    return res.status === 200;
  } catch (err) {
    return false;
  }
}

async function runTestSuite() {
  console.log(`\n${colors.bright}${colors.cyan}${'='.repeat(70)}${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}  CENTRALIZED API GATEWAY ROUTING VERIFICATION SUITE${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}${'='.repeat(70)}${colors.reset}\n`);

  const tests = [
    {
      id: 1,
      name: 'Gateway Root & Service Discovery',
      method: 'GET',
      path: '/',
      expectedStatus: 200,
      verify: (data) => data.gateway && data.routingTable && data.routingTable.length === 2
    },
    {
      id: 2,
      name: 'Route to Inventory Microservice Root',
      method: 'GET',
      path: '/inventory',
      expectedStatus: 200,
      verify: (data) => data.service === 'Inventory Service' && data.port === 5001
    },
    {
      id: 3,
      name: 'Fetch All Items via Gateway (/inventory/items)',
      method: 'GET',
      path: '/inventory/items',
      expectedStatus: 200,
      verify: (data) => Array.isArray(data.data) && data.data.length >= 5
    },
    {
      id: 4,
      name: 'Fetch Single Item by ID (/inventory/items/102)',
      method: 'GET',
      path: '/inventory/items/102',
      expectedStatus: 200,
      verify: (data) => data.data && data.data.id === 102 && data.data.name.includes('Keyboard')
    },
    {
      id: 5,
      name: 'Check Stock by SKU (/inventory/check/TECH-101)',
      method: 'GET',
      path: '/inventory/check/TECH-101',
      expectedStatus: 200,
      verify: (data) => data.data && data.data.sku === 'TECH-101' && data.data.inStock === true
    },
    {
      id: 6,
      name: 'Add New Inventory Item via Gateway (POST /inventory/items)',
      method: 'POST',
      path: '/inventory/items',
      body: {
        name: 'Smart Watch Series 9',
        sku: 'TECH-109',
        stock: 50,
        price: 399.99
      },
      expectedStatus: 201,
      verify: (data) => data.data && data.data.sku === 'TECH-109' && data.data.stock === 50
    },
    {
      id: 7,
      name: 'Route to Shipping Microservice Root',
      method: 'GET',
      path: '/shipping',
      expectedStatus: 200,
      verify: (data) => data.service === 'Shipping Service' && data.port === 5002
    },
    {
      id: 8,
      name: 'Fetch All Active Shipments via Gateway (/shipping/orders)',
      method: 'GET',
      path: '/shipping/orders',
      expectedStatus: 200,
      verify: (data) => Array.isArray(data.data) && data.data.length >= 3
    },
    {
      id: 9,
      name: 'Track Shipment by Tracking Number (/shipping/track/TRK-987654)',
      method: 'GET',
      path: '/shipping/track/TRK-987654',
      expectedStatus: 200,
      verify: (data) => data.data && data.data.trackingNumber === 'TRK-987654' && data.data.carrier === 'FedEx Express'
    },
    {
      id: 10,
      name: 'Create New Shipment via Gateway (POST /shipping/create)',
      method: 'POST',
      path: '/shipping/create',
      body: {
        orderId: 'ORD-9999',
        carrier: 'BlueDart Air',
        destination: 'San Francisco, CA'
      },
      expectedStatus: 201,
      verify: (data) => data.data && data.data.orderId === 'ORD-9999' && data.data.status === 'Order Processed'
    },
    {
      id: 11,
      name: 'Gateway Route Not Found Handling (/unmapped-service)',
      method: 'GET',
      path: '/unmapped-service',
      expectedStatus: 404,
      verify: (data) => data.error === 'Route Not Found' && data.availableRoutes
    }
  ];

  let passed = 0;
  let failed = 0;

  for (const t of tests) {
    const url = `${GATEWAY_URL}${t.path}`;
    const options = {
      method: t.method,
      headers: { 'Content-Type': 'application/json' }
    };
    if (t.body) {
      options.body = JSON.stringify(t.body);
    }

    try {
      const res = await fetch(url, options);
      const data = await res.json();
      const statusMatch = res.status === t.expectedStatus;
      const dataMatch = t.verify ? t.verify(data) : true;

      if (statusMatch && dataMatch) {
        passed++;
        console.log(`${colors.green}[PASS] Test ${t.id}: ${t.name}${colors.reset}`);
        console.log(`       Request:  ${t.method} ${t.path}`);
        console.log(`       Response: HTTP ${res.status} | OK`);
        if (data.service) {
          console.log(`       Resolved Service: ${colors.magenta}${data.service} (Port ${data.port})${colors.reset}`);
        }
      } else {
        failed++;
        console.log(`${colors.red}[FAIL] Test ${t.id}: ${t.name}${colors.reset}`);
        console.log(`       Request:  ${t.method} ${t.path}`);
        console.log(`       Expected HTTP ${t.expectedStatus}, received ${res.status}`);
        console.log(`       Payload:`, JSON.stringify(data, null, 2));
      }
    } catch (err) {
      failed++;
      console.log(`${colors.red}[ERROR] Test ${t.id}: ${t.name}${colors.reset}`);
      console.log(`        Message: ${err.message}`);
    }
    console.log(`${colors.yellow}${'-'.repeat(70)}${colors.reset}`);
  }

  console.log(`\n${colors.bright}Test Summary:${colors.reset}`);
  console.log(`  Total:  ${tests.length}`);
  console.log(`  Passed: ${colors.green}${passed}${colors.reset}`);
  console.log(`  Failed: ${failed > 0 ? colors.red + failed : '0'}${colors.reset}`);

  return failed === 0;
}

async function main() {
  let serversToClose = null;
  const running = await isGatewayRunning();

  if (!running) {
    console.log(`Gateway is not currently running. Starting services in-process for testing...`);
    const inventoryApp = require('./services/inventory-service');
    const shippingApp = require('./services/shipping-service');
    const gatewayApp = require('./gateway');

    const inv = inventoryApp.listen(5001);
    const shp = shippingApp.listen(5002);
    const gtw = gatewayApp.listen(8000);

    serversToClose = [inv, shp, gtw];
    await delay(600); // Give servers time to bind
  } else {
    console.log(`Connecting to existing Gateway at ${GATEWAY_URL}...`);
  }

  const success = await runTestSuite();

  if (serversToClose) {
    console.log(`\nStopping test servers...`);
    for (const s of serversToClose) {
      s.close();
    }
  }

  process.exit(success ? 0 : 1);
}

main();
