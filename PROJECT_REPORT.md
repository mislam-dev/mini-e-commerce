# Mini E-Commerce Backend - Project Report

## 1. Implementation Approach and Rationale

The mini e-commerce backend is architected to be highly robust, scalable, and maintainable. The core technology stack and architectural decisions were driven by the need for strong data integrity, modularity, and high performance.

### **Key Architectural Decisions**
- **Framework - NestJS (TypeScript):** Selected for its out-of-the-box modular architecture, Dependency Injection (DI) system, and strong TypeScript support. It enforces separation of concerns (e.g., Controllers, Services, Modules), making the codebase highly maintainable.
- **Database & ORM - PostgreSQL & TypeORM:** E-commerce data (Users, Products, Orders, Carts) is inherently relational. PostgreSQL ensures ACID compliance and data integrity, while TypeORM abstracts complex queries and migrations.
- **Primary Keys - UUIDs:** UUIDs are utilized instead of auto-incrementing integers to prevent enumeration attacks and allow for distributed database scaling without ID collisions.
- **Caching & State Management - Redis:** Redis is heavily utilized for two main purposes:
  - **Caching:** Frequently accessed read-heavy endpoints, like the nested Category tree, are cached to dramatically reduce database load and improve response times.
  - **Fraud Detection:** Redis tracks stateful transient data, such as a user's order cancellation counter, to enforce abuse-prevention rules (e.g., max 5 cancellations per hour).
- **Payment Strategy Pattern:** The payment module uses a factory/strategy pattern to seamlessly switch between different payment providers (e.g., Stripe, SSLCommerz/bKash) based on the client's request, keeping the core order logic decoupled from third-party SDKs.
- **Containerization - Docker:** The entire infrastructure (API, Database, Redis) is containerized via Docker Compose, guaranteeing identical environments across development, testing, and production.

## 2. Rejected Alternatives

During the design phase, several alternative technologies and approaches were evaluated and subsequently rejected:

- **MongoDB / NoSQL Database:** 
  - *Reason for Rejection:* E-commerce systems rely heavily on complex transactions and relationships (e.g., linking a User to a Cart, a Cart to Products, and converting that into an Order with locked pricing). While NoSQL is great for flexible schemas, enforcing data integrity and executing complex joins for orders/payments is more safely handled by a relational database like PostgreSQL.
- **Vanilla Express.js:**
  - *Reason for Rejection:* While lightweight, building a complex system with plain Express requires implementing custom architecture, DI, and validation logic. NestJS provided these out of the box, speeding up development and ensuring enterprise-grade structure.
- **Synchronous Payment Processing:**
  - *Reason for Rejection:* Processing payments synchronously within the order checkout request blocks the main thread and can lead to timeouts if the payment gateway is slow. Instead, an asynchronous webhook-based approach was implemented to handle payment confirmations and failures, ensuring the API remains responsive.

## 3. Testing Approach and Reports

The testing approach prioritized strict data constraints, state management, and edge-case validation.

### **Testing Strategy**
A comprehensive manual testing roadmap was executed, simulating real-world user flows and potential abuse vectors.

- **Authentication & RBAC:** Verified JWT lifecycles and strict Role-Based Access Control. Customers were actively blocked (`403 Forbidden`) from accessing Admin endpoints (e.g., product creation).
- **Algorithmic & Cache Testing:** The Depth-First Search (DFS) algorithm for retrieving hierarchical categories was validated for deep nesting. Redis cache invalidation was tested to ensure updates to categories were immediately reflected.
- **Constraint Validations:**
  - *SKU Uniqueness:* Ensured database rejected duplicate product SKUs (`400 Bad Request`).
  - *Stock Integrity:* Validated that the system absolutely prevents placing an order if the requested cart quantity exceeds available database stock.
- **Webhook Simulation:** Simulating third-party payment gateways (Stripe/bKash) via manual webhook triggers (success/failure) to ensure Orders transition properly between `PENDING`, `PAID`, and `CANCELLED`, and that inventory is correctly deducted or restocked.

### **Execution Report**
An Ultimate End-to-End Scenario was executed successfully:
1. Admin created a nested category and a product with limited stock.
2. Customer added items to the cart and initiated checkout.
3. The system locked the cart, created a `PENDING` order, and generated a payment intent.
4. A webhook successfully resolved the payment, transitioning the order to `PAID`.
5. Database constraints successfully verified that the stock was accurately deducted.

## 4. API and Router Documentation

The application exposes a fully documented RESTful API utilizing **Swagger/OpenAPI**. When running, the interactive documentation is accessible at `http://localhost:3000/api`.

### **Core Modules & Routing Structure:**
- **Auth (`/auth`):** Handles user registration, JWT generation (login), and profile retrieval.
- **Categories (`/categories`):** Admin endpoints for creating hierarchical categories. Public endpoints for retrieving the heavily-cached DFS category tree.
- **Products (`/products`):** Admin endpoints for inventory management. Public endpoints support paginated listing and detailed product views.
- **Cart (`/cart`):** Customer endpoints to add items, modify quantities (with automatic subtotal calculation aggregation), and clear the cart.
- **Orders (`/orders`):** Customer endpoints to convert an active cart into a pending order. Enforces stock verification and triggers the fraud detection module.
- **Payments (`/payments`):** Webhook receivers (`/payments/bkash/callback`, etc.) and endpoints to initiate third-party payment flows linked to specific order IDs.

## 5. Final Verdict

The **Mini E-Commerce API** successfully achieves its goal of providing a robust, scalable, and secure backend foundation. The architectural choices—specifically the use of NestJS for modularity, PostgreSQL for strict data integrity, and Redis for performance and fraud detection—make the system highly reliable.

**Strengths:**
- Strong separation of concerns and clean code architecture.
- Exceptional handling of race conditions and stock integrity during checkout.
- Extensible payment gateway integration.

**Future Enhancements (Readiness):**
The system is well-positioned for future scaling. Next steps could include implementing partial cart checkouts, advanced multi-role permissions, and background workers (e.g., using RabbitMQ) for processing email notifications post-purchase.

Overall, the implementation is production-ready for its defined scope.
