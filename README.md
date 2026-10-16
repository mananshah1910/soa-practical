# SOA Practical - Centralized API Gateway Routing

## Problem Statement
An e-commerce platform isolates **Inventory Service** and **Shipping Service**. Accessing services via different base URIs increases complexity for frontend applications and client consumers. 

An **API Gateway** is configured as a single centralized entry point to route incoming requests directly to downstream microservices using path-based routing.

---

## Architecture Overview

```
                      +-----------------------------+
                      |       Client / Frontend     |
                      +-----------------------------+
                                     |
                                     | (Single Base URI: http://localhost:8000)
                                     v
                      +-----------------------------+
                      |   Centralized API Gateway   |
                      |        (Port 8000)          |
                      +-----------------------------+
                                     |
                 +-------------------+-------------------+
                 |                                       |
    Path: /inventory/*                      Path: /shipping/*
                 |                                       |
                 v                                       v
+-------------------------------+       +-------------------------------+
|     Inventory Microservice    |       |      Shipping Microservice    |
|          (Port 5001)          |       |          (Port 5002)          |
+-------------------------------+       +-------------------------------+
| - Product Stock Catalog       |       | - Shipment Tracking           |
| - SKU Verification            |       | - Carrier Management          |
| - Restocking Endpoints        |       | - Shipment Creation           |
+-------------------------------+       +-------------------------------+
```

---

## Components & Port Allocation

| Component | Port | Role | Technology |
| :--- | :--- | :--- | :--- |
| **API Gateway** | `8000` | Single entry point, path-based reverse proxy routing, request logging, error isolation | Express & `http-proxy-middleware` |
| **Inventory Microservice** | `5001` | Handles inventory queries, product items, and stock checks | Node.js Express REST API |
| **Shipping Microservice** | `5002` | Handles shipment order dispatch, carrier routing, and tracking | Node.js Express REST API |

---

## Route Mappings

All client requests are sent to `http://localhost:8000`:

| Gateway Route (Port 8000) | Target Microservice (Internal) | HTTP Method | Description |
| :--- | :--- | :--- | :--- |
| `GET /` | API Gateway Root | `GET` | Gateway metadata, routing catalog, quick links |
| `GET /inventory` | `http://localhost:5001/inventory` | `GET` | Inventory service health and endpoint guide |
| `GET /inventory/items` | `http://localhost:5001/inventory/items` | `GET` | Fetches list of all inventory items |
| `GET /inventory/items/:id` | `http://localhost:5001/inventory/items/:id` | `GET` | Fetches a specific item by product ID |
| `GET /inventory/check/:sku`| `http://localhost:5001/inventory/check/:sku`| `GET` | Checks stock availability for an SKU |
| `POST /inventory/items` | `http://localhost:5001/inventory/items` | `POST` | Adds a new inventory item |
| `GET /shipping` | `http://localhost:5002/shipping` | `GET` | Shipping service health and endpoint guide |
| `GET /shipping/orders` | `http://localhost:5002/shipping/orders` | `GET` | Fetches all active shipments |
| `GET /shipping/track/:trk` | `http://localhost:5002/shipping/track/:trk` | `GET` | Tracks a shipment by tracking code |
| `POST /shipping/create` | `http://localhost:5002/shipping/create` | `POST` | Creates a new shipment order |

---

## Project Structure

```
.
├── gateway.js                 # Centralized API Gateway with path-based routing
├── package.json               # Project manifest with scripts and dependencies
├── services/
│   ├── inventory-service.js   # Inventory Microservice REST endpoints
│   └── shipping-service.js    # Shipping Microservice REST endpoints
├── start-all.js               # Starts all services concurrently in one command
├── test-routing.js            # Automated test suite testing all routes through Gateway
└── README.md                  # Complete documentation and execution guide
```

---

## How to Run

### Option 1: Start All Services Together (Recommended)

Run the unified runner script to start the Gateway and both microservices concurrently:

```bash
npm start
```
or:
```bash
node start-all.js
```

### Option 2: Start Services in Separate Terminals

If you want to run each service in its own terminal window:

**Terminal 1 (Inventory Microservice):**
```bash
npm run start:inventory
# runs on http://localhost:5001
```

**Terminal 2 (Shipping Microservice):**
```bash
npm run start:shipping
# runs on http://localhost:5002
```

**Terminal 3 (Centralized API Gateway):**
```bash
npm run start:gateway
# runs on http://localhost:8000
```

---

## Verification & Testing

### 1. Run Automated Test Suite
The automated test suite issues requests exclusively to the API Gateway (`http://localhost:8000`), validating status codes, routed services, and JSON payloads:

```bash
npm test
```

### 2. Manual Testing using `curl`

#### API Gateway Overview
```bash
curl -s http://localhost:8000/ | json_pp
```

#### Test Inventory Service via Gateway
```bash
# 1. Service Health
curl -s http://localhost:8000/inventory | json_pp

# 2. Get All Items
curl -s http://localhost:8000/inventory/items | json_pp

# 3. Get Item by ID
curl -s http://localhost:8000/inventory/items/102 | json_pp

# 4. Check Stock by SKU
curl -s http://localhost:8000/inventory/check/TECH-101 | json_pp

# 5. Add New Item
curl -s -X POST http://localhost:8000/inventory/items \
  -H "Content-Type: application/json" \
  -d '{"name": "Ultra HD Webcam 4K", "sku": "TECH-106", "stock": 40, "price": 129.99}' | json_pp
```

#### Test Shipping Service via Gateway
```bash
# 1. Service Health
curl -s http://localhost:8000/shipping | json_pp

# 2. Get All Active Shipments
curl -s http://localhost:8000/shipping/orders | json_pp

# 3. Track Shipment
curl -s http://localhost:8000/shipping/track/TRK-987654 | json_pp

# 4. Create New Shipment
curl -s -X POST http://localhost:8000/shipping/create \
  -H "Content-Type: application/json" \
  -d '{"orderId": "ORD-5010", "carrier": "FedEx", "destination": "San Francisco, CA"}' | json_pp
```

#### Test Error & Resilience Handling
```bash
# Unmapped Route (Returns 404 Gateway Error)
curl -s http://localhost:8000/unmapped-endpoint | json_pp
```
