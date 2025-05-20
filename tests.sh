#!/bin/bash

# -------------------------------------
# INITIAL REQUESTS (Basic endpoint tests)
# -------------------------------------

# User-specific GET request
curl http://localhost:5000/users/42
# Expected Response: Hello 42

echo -e "\n---"

# GET request with query parameter: electronics
curl http://localhost:5000/products?category=electronics
# Expected Response: Electronics products list

echo -e "\n---"

# GET request with query parameter: clothing
curl http://localhost:5000/products?category=clothing
# Expected Response: Clothing products list

echo -e "\n---"

# GET request with query parameter: books (invalid category)
curl http://localhost:5000/products?category=books
# Expected Response: Invalid category

echo -e "\n---"

# -------------------------------------
# BASIC ORDER REQUESTS
# -------------------------------------

# Create new order (JSON)
curl -X POST http://localhost:5000/orders \
  -H "Content-Type: application/json" \
  -d "{\"status\": \"new\"}"
# Expected Response: Order created successfully

echo -e "\n---"

# Unsupported Media Type (XML)
curl -X POST http://localhost:5000/orders \
  -H "Content-Type: application/xml" \
  -d "{\"status\": \"new\"}"
# Expected Response: Unsupported Media Type

echo -e "\n---"

# Order in pending state
curl -X POST http://localhost:5000/orders \
  -H "Content-Type: application/json" \
  -d "{\"status\": \"pending\"}"
# Expected Response: Order is in pending state

echo -e "\n---"

# Unrecognized order status
curl -X POST http://localhost:5000/orders \
  -H "Content-Type: application/json" \
  -d "{\"status\": \"other\"}"
# Expected Response: Bad request

echo -e "\n---"

# -------------------------------------
# ADVANCED CONDITIONAL REQUESTS
# -------------------------------------

# 1. High priority order from mobile app
curl -X POST http://localhost:5000/orders2 \
  -H "Content-Type: application/json" \
  -H "X-Request-Source: mobile-app" \
  -d "{\"status\": \"new\", \"priority\": \"high\"}"
# Expected Response: High priority order created from mobile app

echo -e "\n---"

# 2. Low priority order
curl -X POST http://localhost:5000/orders2 \
  -H "Content-Type: application/json" \
  -d "{\"status\": \"new\", \"priority\": \"low\"}"
# Expected Response: Low priority order accepted

echo -e "\n---"

# 3. Unsupported media type (XML + version header)
curl -X POST http://localhost:5000/orders2 \
  -H "Content-Type: application/xml" \
  -H "X-API-Version: 1.0" \
  -d "<order><status>new</status></order>"
# Expected Response: Unsupported Media Type for this API version

echo -e "\n---"

# 4. Pending order from guest user
curl -X POST http://localhost:5000/orders2 \
  -H "Content-Type: application/json" \
  -d "{\"status\": \"pending\", \"user\": \"guest\"}"
# Expected Response: Pending order from guest user

echo -e "\n---"

# 5. Fallback / unmatched condition
curl -X POST http://localhost:5000/orders2 \
  -H "Content-Type: application/json" \
  -d "{\"foo\": \"bar\"}"
# Expected Response: Bad request

echo -e "\n---"
