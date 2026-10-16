package com.ecommerce.shipping.controller;

import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/shipping")
public class ShippingController {

    private final List<Map<String, Object>> shipments = new ArrayList<>(Arrays.asList(
        Map.of("trackingNumber", "TRK-987654", "orderId", "ORD-5001", "carrier", "FedEx Express", "status", "In Transit", "destination", "Austin, TX"),
        Map.of("trackingNumber", "TRK-987655", "orderId", "ORD-5002", "carrier", "DHL Global", "status", "Delivered", "destination", "Miami, FL"),
        Map.of("trackingNumber", "TRK-987656", "orderId", "ORD-5003", "carrier", "UPS Ground", "status", "Out for Delivery", "destination", "Portland, OR")
    ));

    @GetMapping
    public Map<String, Object> getServiceStatus() {
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("service", "Shipping Service");
        response.put("status", "UP");
        response.put("port", 8082);
        response.put("message", "Shipping Service is actively running");
        return response;
    }

    @GetMapping("/orders")
    public List<Map<String, Object>> getAllShipments() {
        return shipments;
    }

    @GetMapping("/track/{trackingNumber}")
    public Map<String, Object> trackShipment(@PathVariable String trackingNumber) {
        return shipments.stream()
            .filter(s -> s.get("trackingNumber").toString().equalsIgnoreCase(trackingNumber))
            .findFirst()
            .orElse(Map.of("error", "Shipment not found", "trackingNumber", trackingNumber));
    }
}
