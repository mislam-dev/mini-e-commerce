# Mini E-Commerce API - Project Requirements

## Project Overview

**Deadline:** Feb 12, 2026

The Mini E-Commerce API is a backend system designed to simulate a basic online shopping platform. This project focuses on authentication, role-based access control, product management, cart operations, and order processing while ensuring proper business logic and data consistency.

## Functional Requirements

### 1. Authentication & Authorization

- **User Registration**
- **User Login**
- **Role-based access control:**
  - **Admin**
  - **Customer**
- **Fraud Prevention:** Prevent fraudulent behavior (e.g., repeated order cancellations causing stock misuse).

### 2. Product Management (Admin Only)

- Add new products
- Update product details
- Delete products
- Manage and update product stock

### 3. Customer Features

- Add product to cart
- Remove product from cart
- Place order

## Core Entities

Your system should include the following entities:

- **User**
- **Product**
- **Cart**
- **Order**
- **OrderItems**

## Business Rules

- Customers cannot order more than the available stock.
- Order total must be calculated on the backend.
- Prevent negative inventory.
- Deduct product stock only after successful order placement.
- Ensure data consistency across operations.

## Bonus Features (Optional)

- Payment simulation.
- **Order status management:**
  - Pending
  - Shipped
  - Delivered
- Database transaction handling to maintain data integrity.

## Technical Expectations

- **Backend Stack:** Your preferred choice (RESTful API required).
- **HTTP Status Codes:** Use proper codes.
- **Validation:** Input validation and error handling are expected.
- **Security:** Authentication should be secure (e.g., JWT-based).

## Submission Requirements

1.  A public GitHub repository.
2.  A `README.md` including:
    - Setup instructions.
    - Tech stack used.
    - Database schema / ER diagram.
    - Key architectural decisions.
    - Assumptions made.
