const express = require('express');
const { createProxyMiddleware, fixRequestBody } = require('http-proxy-middleware');

const app = express();
const PORT = process.env.GATEWAY_PORT || 8000;

// Downstream service target URLs
const INVENTORY_SERVICE_URL = process.env.INVENTORY_SERVICE_URL || 'http://localhost:5001';
const SHIPPING_SERVICE_URL = process.env.SHIPPING_SERVICE_URL || 'http://localhost:5002';

// Gateway Routing Table configuration
const ROUTE_TABLE = [
  {
    path: '/inventory',
    service: 'Inventory Service',
    target: INVENTORY_SERVICE_URL,
    description: 'Manages products, stock levels, and pricing'
  },
  {
    path: '/shipping',
    service: 'Shipping Service',
    target: SHIPPING_SERVICE_URL,
    description: 'Manages shipments, carriers, tracking, and delivery'
  }
];

// Custom request logger middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(
      `[API GATEWAY] ${new Date().toISOString()} | ${req.method} ${req.originalUrl} -> Status ${res.statusCode} (${duration}ms)`
    );
  });
  next();
});

// Root Gateway Catalog & Documentation endpoint
app.get('/', (req, res) => {
  res.json({
    gateway: 'E-Commerce Centralized API Gateway',
    status: 'ACTIVE',
    port: PORT,
    timestamp: new Date().toISOString(),
    architecture: 'Microservices with Centralized Path-Based Gateway',
    routingTable: ROUTE_TABLE,
    quickTestEndpoints: {
      inventoryHealth: `http://localhost:${PORT}/inventory`,
      inventoryItems: `http://localhost:${PORT}/inventory/items`,
      inventoryItem101: `http://localhost:${PORT}/inventory/items/101`,
      shippingHealth: `http://localhost:${PORT}/shipping`,
      shippingOrders: `http://localhost:${PORT}/shipping/orders`,
      shippingTracking: `http://localhost:${PORT}/shipping/track/TRK-987654`
    }
  });
});

// Configure Inventory Proxy Middleware
const inventoryProxy = createProxyMiddleware({
  target: INVENTORY_SERVICE_URL,
  changeOrigin: true,
  on: {
    proxyReq: (proxyReq, req, res) => {
      // Forward gateway metadata headers
      proxyReq.setHeader('x-forwarded-by', 'Centralized-API-Gateway');
      proxyReq.setHeader('x-gateway-timestamp', new Date().toISOString());
    },
    error: (err, req, res) => {
      console.error(`[API GATEWAY ERROR] Could not reach Inventory Service:`, err.message);
      if (!res.headersSent) {
        res.status(503).json({
          error: 'Bad Gateway / Service Unavailable',
          gateway: 'API Gateway',
          targetService: 'Inventory Service',
          targetUrl: INVENTORY_SERVICE_URL,
          message: 'Failed to connect to downstream Inventory Service. Ensure the service is running on port 5001.',
          timestamp: new Date().toISOString()
        });
      }
    }
  }
});

// Configure Shipping Proxy Middleware
const shippingProxy = createProxyMiddleware({
  target: SHIPPING_SERVICE_URL,
  changeOrigin: true,
  on: {
    proxyReq: (proxyReq, req, res) => {
      // Forward gateway metadata headers
      proxyReq.setHeader('x-forwarded-by', 'Centralized-API-Gateway');
      proxyReq.setHeader('x-gateway-timestamp', new Date().toISOString());
    },
    error: (err, req, res) => {
      console.error(`[API GATEWAY ERROR] Could not reach Shipping Service:`, err.message);
      if (!res.headersSent) {
        res.status(503).json({
          error: 'Bad Gateway / Service Unavailable',
          gateway: 'API Gateway',
          targetService: 'Shipping Service',
          targetUrl: SHIPPING_SERVICE_URL,
          message: 'Failed to connect to downstream Shipping Service. Ensure the service is running on port 5002.',
          timestamp: new Date().toISOString()
        });
      }
    }
  }
});

// Mount path-based routes
// Any request starting with /inventory is routed to Inventory Service
app.use('/inventory', inventoryProxy);

// Any request starting with /shipping is routed to Shipping Service
app.use('/shipping', shippingProxy);

// Fallback 404 handler for routes not registered on the Gateway
app.use((req, res) => {
  res.status(404).json({
    error: 'Route Not Found',
    gateway: 'API Gateway',
    requestedPath: req.originalUrl,
    message: `No microservice route configured for '${req.originalUrl}'`,
    availableRoutes: ROUTE_TABLE.map(r => `${r.path} -> ${r.service} (${r.target})`)
  });
});

// Start Gateway
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`  Centralized API Gateway Running on Port ${PORT}`);
    console.log(`  Routing:`);
    console.log(`    /inventory/* -> ${INVENTORY_SERVICE_URL}`);
    console.log(`    /shipping/*  -> ${SHIPPING_SERVICE_URL}`);
    console.log(`====================================================`);
  });
}

module.exports = app;
