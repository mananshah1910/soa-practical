const express = require('express');
const app = express();

const PORT = process.env.PORT || 5001;
const SERVICE_NAME = 'Inventory Service';

app.use(express.json());

// In-memory data store for Inventory
let inventory = [
  { id: 101, name: 'Wireless Ergonomic Mouse', sku: 'TECH-101', stock: 45, price: 29.99 },
  { id: 102, name: 'Mechanical Keyboard (RGB)', sku: 'TECH-102', stock: 80, price: 89.99 },
  { id: 103, name: 'Ultra-Wide Monitor 34"', sku: 'TECH-103', stock: 15, price: 499.99 },
  { id: 104, name: 'USB-C Multiport Adapter Hub', sku: 'TECH-104', stock: 120, price: 34.50 },
  { id: 105, name: 'Noise-Cancelling Headphones', sku: 'TECH-105', stock: 60, price: 199.99 }
];

// Helper to format responses with service metadata
const formatResponse = (data, message = 'Success') => ({
  service: SERVICE_NAME,
  port: PORT,
  timestamp: new Date().toISOString(),
  message,
  data
});

// Root / health check endpoint (supports both / and /inventory)
const handleRoot = (req, res) => {
  res.json(formatResponse({
    status: 'HEALTHY',
    totalProducts: inventory.length,
    availableEndpoints: [
      'GET /inventory or /inventory/',
      'GET /inventory/items',
      'GET /inventory/items/:id',
      'GET /inventory/check/:sku',
      'POST /inventory/items'
    ]
  }, 'Inventory Service is running'));
};

app.get('/', handleRoot);
app.get('/inventory', handleRoot);
app.get('/inventory/', handleRoot);

// Get all inventory items
const handleGetItems = (req, res) => {
  res.json(formatResponse(inventory, 'Fetched all inventory items'));
};

app.get('/items', handleGetItems);
app.get('/inventory/items', handleGetItems);

// Get item by ID
const handleGetItemById = (req, res) => {
  const id = parseInt(req.params.id, 10);
  const item = inventory.find(prod => prod.id === id);

  if (!item) {
    return res.status(404).json(formatResponse(null, `Item with ID ${id} not found`));
  }

  res.json(formatResponse(item, `Found item with ID ${id}`));
};

app.get('/items/:id', handleGetItemById);
app.get('/inventory/items/:id', handleGetItemById);

// Check stock by SKU
const handleCheckStock = (req, res) => {
  const sku = req.params.sku.toUpperCase();
  const item = inventory.find(prod => prod.sku.toUpperCase() === sku);

  if (!item) {
    return res.status(404).json(formatResponse(null, `Product with SKU ${sku} not found`));
  }

  res.json(formatResponse({
    sku: item.sku,
    name: item.name,
    inStock: item.stock > 0,
    availableQuantity: item.stock
  }, `Stock check completed for ${sku}`));
};

app.get('/check/:sku', handleCheckStock);
app.get('/inventory/check/:sku', handleCheckStock);

// Add a new inventory item
const handleAddItem = (req, res) => {
  const { name, sku, stock, price } = req.body;

  if (!name || !sku || stock === undefined || price === undefined) {
    return res.status(400).json(formatResponse(null, 'Missing required fields: name, sku, stock, price'));
  }

  const existing = inventory.find(prod => prod.sku.toUpperCase() === sku.toUpperCase());
  if (existing) {
    return res.status(409).json(formatResponse(null, `Item with SKU ${sku} already exists`));
  }

  const newItem = {
    id: inventory.length > 0 ? Math.max(...inventory.map(i => i.id)) + 1 : 101,
    name,
    sku: sku.toUpperCase(),
    stock: parseInt(stock, 10),
    price: parseFloat(price)
  };

  inventory.push(newItem);
  res.status(201).json(formatResponse(newItem, 'Item successfully added to inventory'));
};

app.post('/items', handleAddItem);
app.post('/inventory/items', handleAddItem);

// Start server
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`[${SERVICE_NAME}] listening on port ${PORT}`);
  });
}

module.exports = app;
