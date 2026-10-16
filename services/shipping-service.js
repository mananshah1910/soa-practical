const express = require('express');
const app = express();

const PORT = process.env.PORT || 5002;
const SERVICE_NAME = 'Shipping Service';

app.use(express.json());

// In-memory data store for Shipping
let shipments = [
  {
    trackingNumber: 'TRK-987654',
    orderId: 'ORD-5001',
    carrier: 'FedEx Express',
    status: 'In Transit',
    origin: 'Chicago, IL',
    destination: 'Austin, TX',
    estimatedDelivery: '2026-10-16'
  },
  {
    trackingNumber: 'TRK-987655',
    orderId: 'ORD-5002',
    carrier: 'DHL Global',
    status: 'Delivered',
    origin: 'New York, NY',
    destination: 'Miami, FL',
    estimatedDelivery: '2026-10-13'
  },
  {
    trackingNumber: 'TRK-987656',
    orderId: 'ORD-5003',
    carrier: 'UPS Ground',
    status: 'Out for Delivery',
    origin: 'Seattle, WA',
    destination: 'Portland, OR',
    estimatedDelivery: '2026-10-14'
  }
];

// Helper to format responses with service metadata
const formatResponse = (data, message = 'Success') => ({
  service: SERVICE_NAME,
  port: PORT,
  timestamp: new Date().toISOString(),
  message,
  data
});

// Root / health check endpoint (supports both / and /shipping)
const handleRoot = (req, res) => {
  res.json(formatResponse({
    status: 'HEALTHY',
    activeShipments: shipments.length,
    availableEndpoints: [
      'GET /shipping or /shipping/',
      'GET /shipping/orders',
      'GET /shipping/track/:trackingNumber',
      'POST /shipping/create'
    ]
  }, 'Shipping Service is running'));
};

app.get('/', handleRoot);
app.get('/shipping', handleRoot);
app.get('/shipping/', handleRoot);

// Get all shipment orders
const handleGetOrders = (req, res) => {
  res.json(formatResponse(shipments, 'Fetched all active shipments'));
};

app.get('/orders', handleGetOrders);
app.get('/shipping/orders', handleGetOrders);

// Track specific shipment by tracking number
const handleTrackShipment = (req, res) => {
  const trk = req.params.trackingNumber.toUpperCase();
  const shipment = shipments.find(s => s.trackingNumber.toUpperCase() === trk);

  if (!shipment) {
    return res.status(404).json(formatResponse(null, `Shipment with tracking number ${trk} not found`));
  }

  res.json(formatResponse(shipment, `Tracking details for ${trk}`));
};

app.get('/track/:trackingNumber', handleTrackShipment);
app.get('/shipping/track/:trackingNumber', handleTrackShipment);

// Create a new shipment
const handleCreateShipment = (req, res) => {
  const { orderId, carrier, destination, origin } = req.body;

  if (!orderId || !carrier || !destination) {
    return res.status(400).json(formatResponse(null, 'Missing required fields: orderId, carrier, destination'));
  }

  const newTrackingNumber = `TRK-${Math.floor(100000 + Math.random() * 900000)}`;
  const deliveryDate = new Date();
  deliveryDate.setDate(deliveryDate.getDate() + 3);

  const newShipment = {
    trackingNumber: newTrackingNumber,
    orderId,
    carrier,
    status: 'Order Processed',
    origin: origin || 'Central Warehouse, OH',
    destination,
    estimatedDelivery: deliveryDate.toISOString().split('T')[0]
  };

  shipments.push(newShipment);
  res.status(201).json(formatResponse(newShipment, 'New shipment created successfully'));
};

app.post('/create', handleCreateShipment);
app.post('/shipping/create', handleCreateShipment);

// Start server
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`[${SERVICE_NAME}] listening on port ${PORT}`);
  });
}

module.exports = app;
