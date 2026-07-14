# Local Environment & Ngrok Setup Guide

To run the `mini-e-commerce` backend locally and test third-party payment integrations like Stripe, SSLCommerz, and bKash, you need to properly configure your environment variables and expose your local server to the internet using Ngrok.

---

## 1. Environment Configuration

The project relies on environment variables for database connections, caching, authentication secrets, and payment gateway credentials.

### **Step-by-Step Setup**

1. **Create the `.env` file:**
   Duplicate the provided `.env.exmaple` file and rename the copy to `.env`.
   ```bash
   cp .env.exmaple .env
   ```

2. **Configure Database & Redis:**
   If you are running PostgreSQL and Redis locally (or via Docker Compose), ensure the credentials match your setup:
   ```env
   DB_HOST=localhost
   DB_PORT=5432
   DB_USERNAME=postgres
   DB_PASSWORD=postgres
   DB_NAME=mini_ecom

   REDIS_HOST=localhost
   REDIS_PORT=6379
   ```

3. **Authentication:**
   Set a strong, secure string for your JWT tokens.
   ```env
   JWT_SECRET=your_super_secret_jwt_key
   ```

4. **Payment Gateway Credentials:**
   You will need to create test accounts for the respective payment providers and fill in their API keys and secrets:
   - **Stripe:** Fill in `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, and `STRIPE_WEBHOOK_SECRET`.
   - **bKash:** Fill in `BKASH_USERNAME`, `BKASH_PASSWORD`, `BKASH_APP_KEY`, and `BKASH_APP_SECRET`.
   - **SSLCommerz:** Fill in `SSLCOMERZ_STORE_ID` and `SSLCOMERZ_STORE_PASSWORD`.

---

## 2. Ngrok Setup (For Testing Webhooks)

### **Why do we need Ngrok?**
Payment gateways (like Stripe, bKash, and SSLCommerz) need to send HTTP requests (Webhooks/IPNs) to your server to notify it when a payment succeeds or fails. Because your server is running locally (`http://localhost:3000`), the payment gateways cannot reach it. 

**Ngrok** solves this by creating a secure tunnel and providing a public URL (e.g., `https://1234-abcd.ngrok-free.app`) that forwards traffic directly to your `localhost`.

### **Step-by-Step Ngrok Setup**

1. **Install Ngrok:**
   Download and install ngrok from [ngrok.com](https://ngrok.com/download) or use Homebrew (macOS):
   ```bash
   brew install ngrok/ngrok/ngrok
   ```

2. **Start the Tunnel:**
   Start ngrok on port `3000` (the port your NestJS app runs on):
   ```bash
   ngrok http 3000
   ```
   *Ngrok will output a Forwarding URL (e.g., `https://random-string.ngrok-free.app`). Keep this terminal window open.*

3. **Update Payment Provider Dashboards:**
   Copy the `https` Forwarding URL from ngrok and paste it into the webhook settings of your Stripe/bKash/SSLCommerz developer dashboards.
   - Example Stripe Webhook URL: `https://random-string.ngrok-free.app/api/v1/callback/stripe/webhook`

4. **Update your `.env` Callback URLs:**
   You must replace `http://localhost:3000` with your new ngrok URL in the `.env` file so the application generates the correct return URLs for the user.

   Update the following variables in your `.env`:
   ```env
   # SSLCommerz
   SSLCOMERZ_SUCCESS_URL="https://<your-ngrok-id>.ngrok-free.app/api/v1/payment/callback/sslcommerz/success"
   SSLCOMERZ_FAILURE_URL="https://<your-ngrok-id>.ngrok-free.app/api/v1/payment/callback/sslcommerz/failure"
   SSLCOMERZ_CANCEL_URL="https://<your-ngrok-id>.ngrok-free.app/api/v1/payment/callback/sslcommerz/cancel"
   SSLCOMERZ_IPN_URL="https://<your-ngrok-id>.ngrok-free.app/api/v1/payment/callback/sslcommerz/ipn"

   # Stripe
   STRIPE_SUCCESS_URL="https://<your-ngrok-id>.ngrok-free.app/api/v1/callback/stripe/webhook"
   STRIPE_FAILURE_URL="https://<your-ngrok-id>.ngrok-free.app/api/v1/callback/stripe/webhook"
   STRIPE_CANCEL_URL="https://<your-ngrok-id>.ngrok-free.app/api/v1/callback/stripe/webhook"

   # bKash
   BKASH_CALLBACK_URL="https://<your-ngrok-id>.ngrok-free.app/api/v1/payment/callback/bkash"
   ```

> [!WARNING]  
> **Important Note:** If you are using the free tier of ngrok, your Forwarding URL will change every time you restart ngrok. You will need to update your `.env` file and payment provider dashboards with the new URL each time.
