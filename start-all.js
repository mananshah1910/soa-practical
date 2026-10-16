const inventoryApp = require('./services/inventory-service');
const shippingApp = require('./services/shipping-service');
const gatewayApp = require('./gateway');

const INVENTORY_PORT = process.env.INVENTORY_PORT || 5001;
const SHIPPING_PORT = process.env.SHIPPING_PORT || 5002;
const GATEWAY_PORT = process.env.GATEWAY_PORT || 8000;

console.log('='.repeat(65));
console.log('  STARTING MICROSERVICES & CENTRALIZED API GATEWAY');
console.log('='.repeat(65));

// Start Inventory Microservice
const inventoryServer = inventoryApp.listen(INVENTORY_PORT, () => {
  console.log(`[✓] Inventory Microservice online at  http://localhost:${INVENTORY_PORT}`);
});

// Start Shipping Microservice
const shippingServer = shippingApp.listen(SHIPPING_PORT, () => {
  console.log(`[✓] Shipping Microservice online at   http://localhost:${SHIPPING_PORT}`);
});

// Start Centralized API Gateway
const gatewayServer = gatewayApp.listen(GATEWAY_PORT, () => {
  console.log(`[✓] Centralized API Gateway online at http://localhost:${GATEWAY_PORT}`);
  console.log('='.repeat(65));
  console.log('  GATEWAY ROUTE MAPPINGS:');
  console.log(`    http://localhost:${GATEWAY_PORT}/inventory/* -> http://localhost:${INVENTORY_PORT}/inventory/*`);
  console.log(`    http://localhost:${GATEWAY_PORT}/shipping/*  -> http://localhost:${SHIPPING_PORT}/shipping/*`);
  console.log('='.repeat(65));
  console.log('Ready to receive requests! Press Ctrl+C to terminate.\n');
});

// Graceful shutdown
const shutdown = () => {
  console.log('\nShutting down all services...');
  inventoryServer.close();
  shippingServer.close();
  gatewayServer.close();
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
