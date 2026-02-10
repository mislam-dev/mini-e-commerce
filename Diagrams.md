# System Diagrams

## 1. Architecture

- **Client** -> **Server** (Auth + Application)
- **Server** connects to:
  - **PostgreSQL** (Primary DB)
  - **Redis** (Cache/Session)

## 2. ER Diagram

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

## Sequence Diagrams

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

### 2 Order Sequence

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

### 3 Payment Sequence

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

### 4 Authentication Sequence

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

### 5 Authorization Sequence

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
