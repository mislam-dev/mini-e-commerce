# Mini E-Commerce API

A robust backend for a mini e-commerce application built with NestJS, designed to handle products, carts, orders, and payments with fraud detection capabilities.

## 🛠 Tech Stack

- **Framework:** [NestJS](https://nestjs.com/) (Node.js)
- **Language:** TypeScript
- **Database:** PostgreSQL
- **ORM:** TypeORM
- **Caching & Sessions:** Redis
- **Containerization:** Docker & Docker Compose
- **Payment Gateways:** SSLCommerz, Stripe
- **Authentication:** Passport (JWT strategy)
- **Documentation:** Swagger / OpenAPI

## 🚀 Setup Instructions

### Prerequisites

- [Docker](https://www.docker.com/) and Docker Compose installed on your machine.
- [Node.js](https://nodejs.org/) and [pnpm](https://pnpm.io/) (if running locally without Docker).

### Option 1: Run with Docker (Recommended)

This project is fully containerized. You can spin up the API, Database, and Redis with a single command.

1.  **Clone the repository:**

    ```bash
    git clone <repository-url>
    cd mini-e-commerce
    ```

2.  **Create `.env` file:**
    Copy the example environment file (or create one based on `docker-compose.yml` variables).

    ```bash
    cp .env.example .env
    ```

3.  **Start the application:**

    ```bash
    docker-compose up --build
    ```

    - The API will be available at `http://localhost:3000`.
    - Swagger documentation: `http://localhost:3000/api` (or `/doc` depending on config).

### Option 2: Run Locally

1.  **Install dependencies:**

    ```bash
    pnpm install
    ```

2.  **Start Infrastructure:**
    Ensure you have PostgreSQL and Redis running locally or via Docker.

    ```bash
    # You can use the docker-compose to start just the services if you like
    docker-compose up postgres redis -d
    ```

3.  **Configure Environment:**
    Update your `.env` file to point to your local database and Redis instances.

4.  **Run Migrations (if applicable):**

    ```bash
    pnpm run migration:run
    ```

5.  **Start the server:**
    ```bash
    pnpm run start:dev
    ```

## 🗄️ Database Migrations

Migrations are automatically executed when the application starts in the **Development** Docker environment.

- **Development:** The `migration:run` script is executed before `start:dev`.
- **Production:** Database migrations should be run manually or as part of a deployment pipeline, as the production container does not include development tools required to run TypeScript migrations directly.

### Managing Migrations Manually

To run migrations manually (e.g., when running locally without Docker):

```bash
# Run pending migrations
pnpm run migration:run

# Revert last migration
pnpm run migration:revert

# Generate a new migration
pnpm run migration:generate <MigrationName>
```

## 📊 Database Schema / ER Diagram

The database uses a relational model with UUIDs for primary keys to ensure scalability.

```mermaid
erDiagram
    USER ||--o{ ORDER : places
    USER ||--o{ CART : add_products_to
    PRODUCT ||--o{ CART : contained_in
    PRODUCT ||--o{ ORDER_ITEM : includes
    ORDER ||--|{ ORDER_ITEM : consists_of

    USER {
        string id PK "UUID"
        string email "unique"
        string password
        string status "active | restricted | order_restricted"
        string role "admin | customer"
        datetime created_at
    }

    PRODUCT {
        string id PK "UUID"
        string code "unique"
        string name
        string description
        float price
        int stock_quantity
    }

    CART {
        string id PK "UUID"
        string user_id FK
        string product_id FK
        int quantity
    }

    ORDER {
        string id PK "UUID"
        string user_id FK
        float total_amount
        string status "pending | shipped | delivered | cancelled"
        datetime created_at
    }

    ORDER_ITEM {
        string id PK "UUID"
        string order_id FK
        string product_id FK
        int quantity
        float price_at_purchase
    }
```

## 🔄 Sequence Diagrams

### 1. Fraud Detection Sequence

```mermaid
sequenceDiagram
    autonumber
    title Fraud Detection Sequence
    participant Client
    participant Server
    participant OrderService
    participant Database
    participant Redis

    Client->>Server: Send Order Request
    activate Server
    Server->>Database: Retrieve User data
    Database-->>Server: User data

    alt if user is restricted
        Server->>Client: Restriction response
    else user is clear
        Server->>Redis: Retrieve cancel counter
        Redis-->>Server: Cancel count

        alt if cancellation limit exceeded
            Server->>Database: Update user to restricted
            Server->>Client: Restriction response
        else limit not exceeded
            Server->>OrderService: Send Order Request
            activate OrderService
            OrderService->>OrderService: Process order
            OrderService-->>Server: Return order data
            deactivate OrderService
            Server-->>Client: Order response
        end
    end
    deactivate Server
```

### 2. Order Sequence

```mermaid
sequenceDiagram
    autonumber
    title Order Sequence
    participant Client
    participant Server
    participant OrderModule
    participant Payment
    participant Gateway

    Note over Client, Server: Phase 1: Order Creation
    Client->>Server: Make a order with cart
    activate Server
    Server->>OrderModule: Create order entry (status: pending)
    activate OrderModule
    OrderModule-->>Server: Return order data
    deactivate OrderModule
    Server-->>Client: Return Payment data
    deactivate Server

    Note over Client, Server: Phase 2: Payment Execution
    Client->>Server: Request to payment
    activate Server
    Server->>Payment: Initiate Payment
    deactivate Server
    activate Payment
    critical Payment Interaction
        Payment-->>Gateway: ref: Payment Sequence
        Gateway-->>Payment: Payment Confirmation
    end
    Payment->>OrderModule: Request to update status
    activate OrderModule
    OrderModule->>OrderModule: Update Order status to paid
    deactivate OrderModule
    Payment-->>Server: Return data
    deactivate Payment
    activate Server
    Server-->>Client: Return response
    deactivate Server
```

### 3. Payment Sequence

```mermaid
sequenceDiagram
    autonumber
    title Payment Sequence
    participant Client
    participant Server
    participant Gateway
    participant Database

    Client->>Server: Make a payment request
    activate Server
    Server->>Server: Process the data
    Server->>Database: Create pending payment record
    Server-->>Client: Response Gateway url
    deactivate Server

    Client->>Gateway: Redirect to gateway
    activate Gateway
    Note right of Gateway: User enters card details
    Gateway->>Gateway: Do payment
    Gateway-->>Server: hit IPN url
    Gateway-->>Client: Redirect (Success/Fail URL)
    deactivate Gateway

    Client->>Server: Request payment completion
    activate Server
    Server->>Gateway: Verify Payment
    Gateway-->>Server: Response with trx id

    alt if valid
        Server->>Database: Update payment to success
        Server-->>Client: Return success data
    else if failed
        Server->>Database: Update payment to failed
        Server-->>Client: Return failed data
    end
    deactivate Server
```

### 4. Authentication Sequence

```mermaid
sequenceDiagram
    autonumber

    participant Client as 🖥️ Client
    participant Server as 🟦 Server
    participant TokenService as 🔑 TokenService
    participant Database as 🗄️ Database

    title Authentication Sequence

    Client->>Server: Login request
    activate Server
    Server->>Server: Validate body

    Server->>Database: Retrieve user info
    Database-->>Server: User data

    Server->>Server: Validate credentials

    alt if credentials do not match
        Server-->>Client: Return errors
    else credentials valid
        Server->>TokenService: Generate tokens
        TokenService-->>Server: Access & Refresh tokens
        Server-->>Client: Return tokens
    end

    deactivate Server
```

### 5. Authorization Sequence

```mermaid
sequenceDiagram
    autonumber

    participant Client as 🖥️ Client
    participant Server as 🟦 Server
    participant TokenService as 🔑 Token Service

    title Authorization Sequence

    Client->>Server: Locked Request
    activate Server

    Server->>TokenService: Validate Auth token
    TokenService-->>Server: Token status (Valid/Invalid)

    alt if token is invalid
        Server-->>Client: Return 401 Unauthorized
    else token is valid
        Server->>Server: Validate Role & Permissions

        alt if role and permission don't exist
            Server-->>Client: Return 403 Forbidden
        else authorized
            Server-->>Client: Forward to routes / Success
        end
    end

    deactivate Server
```

## 🏗 Key Architectural Decisions

1.  **Modular Architecture:** The application is structured into domain-specific modules (e.g., `UserModule`, `ProductModule`, `OrderModule`) to enforce separation of concerns and maintainability.
2.  **UUID Primary Keys:** UUIDs are used instead of auto-incrementing integers to prevent enumeration attacks and allow for distributed database scaling in the future.
3.  **Redis Caching:** Redis is utilized to handle caching and potentially session management/counters, particularly for the fraud detection mechanism (tracking cancellation rates).
4.  **Dockerized Development:** The entire environment is defined in `docker-compose.yml` to ensure consistency across different development machines and simplify setup.
5.  **TypeORM with PostgreSQL:** Provides a robust outcome for managing relational data with strong typing support, ensuring data integrity.

## 📝 Assumptions

The following assumptions were made during the development of this project:

1.  **Cart Operations:** When a user places an order, it is assumed they are ordering the **entire** contents of their current cart. Partial checkout of the cart is not currently supported.
2.  **Fraud Detection Rule:** To prevent abuse, the system assumes a simple fraud detection rule: A user can cancel up to **5 orders within a one-hour window**. Exceeding this limit will trigger a restriction (e.g., `order_restricted` status).
3.  **User Roles:** A user is assigned exactly **one role** at a time—either `customer` or `admin`. Complex multi-role setups are not part of the current scope.
4.  **Stock Reservation**: Stock is not reserved when adding items to the cart. Validation happens only at the moment of order creation
5.  **Payment**: Payment is not processed until the order is confirmed. The payment process is handled by a third-party payment gateway (e.g., Stripe, SSLcommerz).
