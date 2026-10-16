package com.ecommerce.inventory.controller;

import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/inventory")
public class InventoryController {

    private final List<Map<String, Object>> items = new ArrayList<>(Arrays.asList(
        Map.of("id", 101, "name", "Wireless Ergonomic Mouse", "stock", 45, "price", 29.99),
        Map.of("id", 102, "name", "Mechanical Keyboard (RGB)", "stock", 80, "price", 89.99),
        Map.of("id", 103, "name", "Gaming Monitor 34-inch", "stock", 15, "price", 499.99)
    ));

    @GetMapping
    public Map<String, Object> getServiceStatus() {
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("service", "Inventory Service");
        response.put("status", "UP");
        response.put("port", 8081);
        response.put("message", "Inventory Service is actively running");
        return response;
    }

    @GetMapping("/items")
    public List<Map<String, Object>> getAllItems() {
        return items;
    }

    @GetMapping("/items/{id}")
    public Map<String, Object> getItemById(@PathVariable int id) {
        return items.stream()
            .filter(item -> (int) item.get("id") == id)
            .findFirst()
            .orElse(Map.of("error", "Item not found", "id", id));
    }
}
