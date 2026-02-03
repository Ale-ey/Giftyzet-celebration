# Giftyzet Plugin API — Complete Reference

This document is the **full reference** for integrating the Giftyzet Plugin API. It explains **how to use** the API step by step, then gives exact request/response formats so you can implement the plugin without asking anything else.

---

## Table of contents

1. [How to use this API — detailed guide](#1-how-to-use-this-api--detailed-guide)
2. [Overview](#2-overview)
3. [Base URL & authentication](#3-base-url--authentication)
4. [Enums (allowed values)](#4-enums-allowed-values)
5. [Endpoints](#5-endpoints)
6. [Request/response schemas](#6-requestresponse-schemas)
7. [Error format](#7-error-format)
8. [Integration steps](#8-integration-steps)
9. [cURL examples](#9-curl-examples)
10. [Recipient link & flow](#10-recipient-link--flow)
11. [Admin endpoints (API key creation)](#11-admin-endpoints-api-key-creation)

---

## 1. How to use this API — detailed guide

This section explains **when** and **why** you call each part of the API, and **what to do** with the responses.

### 1.1 What this API is for

- **Your platform:** You run an e‑commerce site or marketplace. A customer can buy something **as a gift** and pay on your site. You do **not** collect the recipient’s delivery address at checkout.
- **Giftyzet:** After the customer pays, you tell Giftyzet about the order. Giftyzet gives you a **recipient link**. The **recipient** (the person who will receive the gift) opens that link and enters their **name, email, phone, and delivery address**. Once they submit, the order is ready to be fulfilled (e.g. by your store on Giftyzet).
- **This API:** It is the way you **create** that order on Giftyzet and **get** the recipient link. You also use it to **fetch** the order later (e.g. to check if the recipient has submitted their address).

So the API has three main uses:

1. **Create order** — Call this once per gift order, **after** payment succeeds on your side. You send buyer + recipient info and line items. You get back a **recipient link** to share with the recipient.
2. **Get order by your ID** — Call this when you have **your** order ID (e.g. `ORD-12345`) and want to see the current order (status, recipient address once filled, etc.).
3. **Get order by Giftyzet ID** — Call this when you have the **Giftyzet** order UUID (from the create-order response) and want to see the order.

You do **not** use this API to process payment. Payment is done on your side. You only call the API **after** payment has succeeded.

---

### 1.2 End-to-end flow (who does what)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 1. YOUR SITE (checkout)                                                      │
│    • Customer selects "Send as gift"                                         │
│    • Customer enters: recipient name, email, (optional) phone                 │
│    • Customer pays (your payment provider)                                    │
│    • Payment succeeds → you have: your order ID, sender + receiver info,     │
│      line items, subtotal, tax, total                                         │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 2. YOUR BACKEND (call Plugin API)                                            │
│    • POST /api/plugin/v1/orders                                               │
│    • Body: external_order_id = YOUR order ID, sender_*, receiver_*,          │
│      items[], subtotal, shipping, tax, total                                  │
│    • Response: order_id, order_number, recipient_link, status "pending"       │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 3. YOUR SITE (order confirmation page)                                       │
│    • Show buyer: "Share this link with the recipient"                          │
│    • Show recipient_link and/or offer: Send by email / Send by SMS / Copy     │
│    • Buyer sends link to recipient (email, SMS, or copy-paste)                │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 4. GIFTYZET (recipient page — you don’t build this)                          │
│    • Recipient opens recipient_link in browser                                │
│    • Sees: order summary (items, total), sender name                          │
│    • Form: full name, email, phone, delivery address (all can be edited)     │
│    • Submits → order status becomes "confirmed", address saved               │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 5. OPTIONAL — YOUR BACKEND (poll for address)                                 │
│    • GET /api/plugin/v1/orders?external_order_id=YOUR_ORDER_ID                │
│    • Check order.status: when "confirmed", order.receiver_address (and        │
│      receiver_name, receiver_email, receiver_phone) are filled               │
│    • Use that data for your own records or fulfilment if needed               │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Summary:** You create the order with the API after payment → you get `recipient_link` → you give that link to the buyer to share → the recipient opens it and enters their details on Giftyzet’s page → you can optionally GET the order to read the recipient’s address once they’ve submitted.

---

### 1.3 When to call “Create order” (POST /api/plugin/v1/orders)

- **When:** Immediately after the customer’s **payment succeeds** on your platform (e.g. after your payment provider confirms the charge).
- **From where:** Your **backend** only. Never call this from the browser or mobile app, because you must send the API key.
- **What you send:**  
  - **external_order_id:** Your own order ID (e.g. from your database). This must be **unique per gift order** for your integration. The API uses it so that if you call create twice with the same ID (e.g. retry after a timeout), it does not create two orders — you get **409** and can GET the existing order instead.  
  - **Sender** (buyer): name, email, phone, address.  
  - **Receiver** (recipient): name, email; phone optional. The recipient can change these when they open the link.  
  - **items:** Array of `{ name, price, quantity?, image_url? }`. At least one item.  
  - **subtotal, shipping, tax, total:** Numbers; total must be &gt; 0.
- **What you get back:**  
  - **order_id** — Giftyzet’s UUID for this order. Use it for “Get order by Giftyzet ID” if you want.  
  - **order_number** — Human-readable (e.g. `PLUG-1709123456-ABC12XY`). Useful for support or display.  
  - **recipient_link** — **This is the URL the recipient must open.** Save it and show it to the buyer so they can share it (email, SMS, or copy).  
  - **gift_token** — The token inside the URL; you usually don’t need it if you have `recipient_link`.  
  - **status** — Always `"pending"` at creation. It becomes `"confirmed"` after the recipient submits the form.
- **What you must do with the response:**  
  Store `order_id` and/or keep your `external_order_id` linked to it. **Always** use `recipient_link` on your order confirmation so the buyer can send it to the recipient (email, SMS, or copy link).

---

### 1.4 When to call “Get order” (GET)

You have **two** ways to fetch an order:

| Situation | Endpoint | When to use it |
|-----------|----------|----------------|
| You have **your** order ID (e.g. `ORD-12345`) | `GET /api/plugin/v1/orders?external_order_id=ORD-12345` | After creating the order you usually store your ID; use this to look up the order later (e.g. on “View order” or when polling for recipient address). |
| You have **Giftyzet’s** order UUID (from create response) | `GET /api/plugin/v1/orders/{order_id}` | When you stored `order_id` from the create response and want to fetch that order by Giftyzet’s ID. |

**What you get back:**  
A JSON object with **order** (full order object: status, sender, receiver, amounts, `receiver_address` once filled, timestamps, etc.) and **order_items** (list of line items).

**Typical uses:**

- **Polling for recipient address:** Call GET (with `external_order_id` or `order_id`) every few minutes (or on a “Refresh” button). When `order.status` is `"confirmed"`, the recipient has submitted the form; then `order.receiver_address`, `order.receiver_name`, `order.receiver_email`, `order.receiver_phone` are filled. You can use these for your own fulfilment or records.
- **Order details page:** When the buyer or support views an order, call GET to show current status and, if confirmed, delivery address.

---

### 1.5 Use of the recipient link

- **What it is:** The `recipient_link` from the create-order response. Example: `https://your-giftyzet-domain.com/gift-receiver/gift-1709123456-abc12xy`
- **Who uses it:** The **recipient** (the person receiving the gift). The **buyer** gets this link from your order confirmation and sends it to the recipient (by email, SMS, or copy-paste).
- **What the recipient sees (on Giftyzet’s page):**  
  - Order summary (items, total, who sent it).  
  - A form: Full name, Email, Phone (optional), Delivery address.  
  - Fields can be pre-filled from what you sent in the create request, but the recipient can change them.  
  - Submit button: “Confirm details & accept gift”.
- **What happens when they submit:**  
  Giftyzet saves the recipient’s name, email, phone, and address and sets the order **status** to `"confirmed"`. After that, when you call GET order, you will see `order.status === "confirmed"` and `order.receiver_address` (and contact details) filled.
- **Important:** You do **not** build this page. Giftyzet hosts it. You only need to **send** the link to the recipient (via email, SMS, or copy).

---

### 1.6 Idempotency (calling create order twice with the same external_order_id)

- **Rule:** For a given API key (integration), **one** `external_order_id` must correspond to **one** plugin order. If you send the same `external_order_id` again in the create body, the API does **not** create a second order.
- **Response:** You get HTTP **409** and a body like: `{ "error": "An order with this external_order_id already exists for your integration." }`
- **What you should do:** Treat 409 as “this order already exists.” Call **GET** order with `external_order_id` to get the existing order and its `recipient_link`. Use that link (do not create again). This way, retries (e.g. after a timeout) do not create duplicate orders.

---

### 1.7 What to do when you get an error

| HTTP | Meaning | What you should do |
|------|--------|---------------------|
| **400** | Bad request (missing or invalid field) | Check the `error` message (e.g. "external_order_id is required", "items must be a non-empty array"). Fix the request body or query and retry. |
| **401** | Unauthorized | API key missing or wrong. Check that you send `X-API-Key` with the correct value. Do not retry with the same key. |
| **404** | Not found | Order not found or not belonging to your integration. Check `external_order_id` or `order_id`. Do not retry the same request. |
| **409** | Conflict | Duplicate `external_order_id`. Use GET to fetch the existing order and use its `recipient_link`. Do not create again. |
| **500** | Server error | Something failed on Giftyzet’s side. Retry the same request after a short delay (e.g. exponential backoff). If it keeps failing, contact support. |

All error responses are JSON with at least one field: **`error`** (string message). Use it to show a message to the user or to log.

---

### 1.8 Quick checklist for integration

- [ ] Store API key in backend env; never expose in frontend.
- [ ] After payment succeeds, call **POST /api/plugin/v1/orders** with your order ID as `external_order_id`, sender, receiver, items, amounts.
- [ ] If response is **409**, call **GET** with `external_order_id` and use the returned `recipient_link`.
- [ ] On order confirmation page, show **recipient_link** and/or offer “Send by email”, “Send by SMS”, “Copy link” (you implement sending).
- [ ] (Optional) Poll **GET** with `external_order_id` until `order.status === "confirmed"`; then use `order.receiver_address` and contact details.

---

## 2. Overview

- **Purpose:** Your platform (e‑commerce, marketplace) creates **gift orders** on Giftyzet after the customer pays on your side. The buyer shares a **recipient link** with the recipient; the recipient opens it and enters **address and contact details**. The order is then fulfilled by the seller (your store on Giftyzet).
- **Order type:** All orders created via this API have `order_type: "plugin"`.
- **Payment:** Payment happens on **your** platform. When you call the create-order API, you are declaring that payment is complete. Do **not** call the API before payment succeeds.
- **Plugin fee:** A per-order fee is charged from the **seller** (your store) and deducted at payout time. It is set when the Giftyzet admin creates your plugin integration.

---

## 3. Base URL & authentication

| Item | Value |
|------|--------|
| **Base URL** | `https://<your-giftyzet-domain.com>` (e.g. `https://app.giftyzet.com`) |
| **API prefix** | All plugin endpoints: `{base}/api/plugin/v1` |
| **Auth** | Header: `X-API-Key: <your_api_key>` |
| **Content-Type** | `application/json` for request bodies |

**Rules:**

- Send the API key on **every** request in the `X-API-Key` header (case-insensitive).
- Do **not** send the API key in query params or in the body.
- Use the API key only in **server-side** code; never expose it in frontend or mobile apps.

---

## 4. Enums (allowed values)

Use these exact strings in requests and when interpreting responses.

### Order status (`order.status`)

| Value | Description |
|-------|-------------|
| `pending` | Order created; recipient has not yet submitted address/contact details. |
| `confirmed` | Recipient submitted address and contact details; order can be fulfilled. |
| `dispatched` | Order has been shipped/dispatched. |
| `delivered` | Order has been delivered. |
| `cancelled` | Order was cancelled. |

### Payment status (`order.payment_status`)

| Value | Description |
|-------|-------------|
| `paid` | Payment completed (plugin orders are always created as `paid` on your side). |
| `pending` | Not used for plugin orders. |
| `failed` | Payment failed. |
| `refunded` | Payment was refunded. |

### Order type (`order.order_type`)

| Value | Description |
|-------|-------------|
| `plugin` | Order created via Plugin API. |

---

## 5. Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/plugin/v1/orders` | Create a plugin order (after payment on your side). |
| `GET` | `/api/plugin/v1/orders?external_order_id=<id>` | Get order by **your** order ID. |
| `GET` | `/api/plugin/v1/orders/<giftyzet_order_id>` | Get order by **Giftyzet** order UUID. |

---

## 6. Request/response schemas

This section gives the **exact** request and response formats for each endpoint. Use it when implementing: field names, types, required vs optional, and example values.

### 6.1 Create order — request and response in detail

**Request**

- **Method:** `POST`
- **Path:** `/api/plugin/v1/orders`
- **Headers:** `X-API-Key` (required), `Content-Type: application/json`
- **Body:** JSON object

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `external_order_id` | string | **Yes** | Your platform’s order ID. Must be unique per integration. Used for idempotency and lookups. |
| `sender_name` | string | **Yes** | Buyer’s full name. |
| `sender_email` | string | **Yes** | Buyer’s email. |
| `sender_phone` | string | **Yes** | Buyer’s phone. |
| `sender_address` | string | **Yes** | Buyer’s full address. |
| `receiver_name` | string | **Yes** | Recipient’s full name (recipient can change it on the link). |
| `receiver_email` | string | **Yes** | Recipient’s email (recipient can change it on the link). |
| `receiver_phone` | string | No | Recipient’s phone (recipient can add/change on the link). |
| `items` | array | **Yes** | Line items; see [Items array](#items-array) below. Must have at least one item. |
| `subtotal` | number | **Yes** | Order subtotal (e.g. USD). Must be a valid number. |
| `shipping` | number | No | Shipping amount. Default: `0`. |
| `tax` | number | No | Tax amount. Default: `0`. |
| `total` | number | **Yes** | Order total. Must be a valid positive number. |

**Why each field matters:**

- **external_order_id** — Your unique order ID. Use the same ID you store in your database. If you retry the request (e.g. after a timeout), send the same ID; the API will return 409 and you can GET the existing order instead of creating a duplicate.
- **sender_*** — The person who paid (buyer). Used for order records and shown to the recipient (“Jane Doe sent you a gift”).
- **receiver_name, receiver_email, receiver_phone** — Who will receive the gift. The recipient can change these when they open the link; sending them here pre-fills the form.
- **items** — What was ordered. Each item needs at least `name` and `price`; `quantity` defaults to 1. Used for order summary on the recipient page and for records.
- **subtotal, shipping, tax, total** — Order amounts. Must match what the customer paid. `total` must be positive.

**Items array** (each element):

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | **Yes** | Product/service name. |
| `price` | number | **Yes** | Unit price. |
| `quantity` | number | No | Quantity. Default: `1`. Minimum: `1`. |
| `image_url` | string | No | Optional image URL. |

**Success response (HTTP 200)**

JSON object:

| Field | Type | Description |
|-------|------|-------------|
| `order_id` | string (UUID) | Giftyzet’s order ID. Use this when calling GET by Giftyzet ID (e.g. `GET /api/plugin/v1/orders/{order_id}`). Store it if you want to look up the order by Giftyzet’s ID later. |
| `order_number` | string | Human-readable order number (e.g. `PLUG-1709123456-ABC12XY`). Useful for support or display on your “View order” page. |
| `recipient_link` | string (URL) | **The URL the recipient must open.** Save it and show it to the buyer on your order confirmation. The buyer shares it (email, SMS, or copy). Do not modify this URL. |
| `gift_token` | string | The token inside the recipient link. You usually don’t need it if you have `recipient_link`. |
| `status` | string | Always `"pending"` at creation. It becomes `"confirmed"` after the recipient submits the form on the recipient page. See [Enums](#4-enums-allowed-values). |
| `message` | string | Human-readable message (e.g. “Order created. Send recipient_link to the recipient…”). You can show it in logs or to support. |

**Example success body:**

```json
{
  "order_id": "550e8400-e29b-41d4-a716-446655440000",
  "order_number": "PLUG-1709123456-ABC12XY",
  "recipient_link": "https://your-giftyzet-domain.com/gift-receiver/gift-1709123456-abc12xy",
  "gift_token": "gift-1709123456-abc12xy",
  "status": "pending",
  "message": "Order created. Send recipient_link to the recipient so they can enter their delivery address."
}
```

---

### 6.2 Get order by external order ID

**Request**

- **Method:** `GET`
- **Path:** `/api/plugin/v1/orders`
- **Query:** `external_order_id` (required) — your order ID.
- **Headers:** `X-API-Key` (required)

**Success response (HTTP 200)**

JSON object:

| Field | Type | Description |
|-------|------|-------------|
| `order` | object | Order object; see [Order object](#order-object) below. |
| `order_items` | array | Line items; see [Order item object](#order-item-object) below. |

---

### 6.3 Get order by Giftyzet order ID

**Request**

- **Method:** `GET`
- **Path:** `/api/plugin/v1/orders/<order_id>`
- **Path parameter:** `order_id` — Giftyzet order UUID (e.g. from create-order response).
- **Headers:** `X-API-Key` (required)

**Success response (HTTP 200)**

Same as [6.2](#62-get-order-by-external-order-id): `{ "order": {...}, "order_items": [...] }`.

---

### Order object (returned in GET responses)

When you call **GET** order (by `external_order_id` or by Giftyzet `order_id`), the response has **order** (one object) and **order_items** (array). Use them as follows:

- **order.status** — Use this to know the order state. `"pending"` = recipient has not yet submitted the form. `"confirmed"` = recipient submitted; you can use `receiver_address` and contact details. `"dispatched"` / `"delivered"` = fulfilment progress.
- **order.receiver_address, order.receiver_name, order.receiver_email, order.receiver_phone** — Filled only after the recipient submits the form (when status is `"confirmed"`). Use them for your own fulfilment or records.
- **order.gift_link** — Same as the `recipient_link` you got at creation. You can show it again on “View order” if the buyer wants to resend it.
- **order_items** — The line items (name, price, quantity). Use for display on your “View order” page.

All fields are strings unless noted. Timestamps are ISO 8601.

| Field | Type | Description |
|-------|------|-------------|
| `id` | string (UUID) | Giftyzet order ID. |
| `order_number` | string | Human-readable order number. |
| `external_order_id` | string \| null | Your order ID. |
| `order_type` | string | Always `"plugin"` for plugin orders. |
| `status` | string | One of: `pending`, `confirmed`, `dispatched`, `delivered`, `cancelled`. |
| `payment_status` | string | One of: `paid`, `pending`, `failed`, `refunded`. Plugin orders are `paid` at creation. |
| `sender_name` | string | Buyer name. |
| `sender_email` | string | Buyer email. |
| `sender_phone` | string | Buyer phone. |
| `sender_address` | string | Buyer address. |
| `receiver_name` | string \| null | Recipient name (filled when recipient submits). |
| `receiver_email` | string \| null | Recipient email. |
| `receiver_phone` | string \| null | Recipient phone. |
| `receiver_address` | string \| null | Delivery address (filled when recipient submits). |
| `subtotal` | number | Subtotal. |
| `shipping` | number | Shipping amount. |
| `tax` | number | Tax amount. |
| `total` | number | Order total. |
| `gift_token` | string \| null | Token used in recipient link. |
| `gift_link` | string \| null | Full recipient URL. |
| `plugin_fee` | number | Fee charged from seller for this order. |
| `created_at` | string | Order creation time (ISO 8601). |
| `confirmed_at` | string \| null | When recipient submitted details (ISO 8601). |
| `updated_at` | string | Last update (ISO 8601). |

Other internal fields (e.g. `user_id`, `plugin_integration_id`) may be present but are not required for integration.

### Order item object

| Field | Type | Description |
|-------|------|-------------|
| `id` | string (UUID) | Item ID. |
| `order_id` | string (UUID) | Order ID. |
| `item_type` | string | e.g. `"product"`. |
| `name` | string | Product/service name. |
| `price` | number | Unit price. |
| `quantity` | number | Quantity. |
| `image_url` | string \| null | Optional image URL. |

**Example GET response (200):**

```json
{
  "order": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "order_number": "PLUG-1709123456-ABC12XY",
    "external_order_id": "ORD-12345",
    "order_type": "plugin",
    "status": "confirmed",
    "payment_status": "paid",
    "sender_name": "Jane Doe",
    "sender_email": "jane@example.com",
    "sender_phone": "+1234567890",
    "sender_address": "123 Main St, City, ST 12345",
    "receiver_name": "John Doe",
    "receiver_email": "john@example.com",
    "receiver_phone": "+1987654321",
    "receiver_address": "456 Oak Ave, City, ST 67890",
    "subtotal": 54.99,
    "shipping": 0,
    "tax": 4.40,
    "total": 59.39,
    "gift_token": "gift-1709123456-abc12xy",
    "gift_link": "https://your-giftyzet-domain.com/gift-receiver/gift-1709123456-abc12xy",
    "plugin_fee": 1.5,
    "created_at": "2025-02-03T12:00:00.000Z",
    "confirmed_at": "2025-02-03T14:30:00.000Z",
    "updated_at": "2025-02-03T14:30:00.000Z"
  },
  "order_items": [
    {
      "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "order_id": "550e8400-e29b-41d4-a716-446655440000",
      "item_type": "product",
      "name": "Gift Box",
      "price": 49.99,
      "quantity": 1,
      "image_url": null
    },
    {
      "id": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
      "order_id": "550e8400-e29b-41d4-a716-446655440000",
      "item_type": "product",
      "name": "Card",
      "price": 5,
      "quantity": 1,
      "image_url": null
    }
  ]
}
```

---

## 7. Error format

All error responses are JSON with at least:

| Field | Type | Description |
|-------|------|-------------|
| `error` | string | Human-readable error message. |

**HTTP status codes and when they are used:**

| Code | Meaning | Typical cause |
|------|--------|----------------|
| **400** | Bad Request | Missing or invalid body/query (e.g. missing `external_order_id`, invalid `items`, invalid numbers). |
| **401** | Unauthorized | Missing or invalid `X-API-Key`. |
| **404** | Not Found | Order not found or not belonging to your integration. |
| **409** | Conflict | Duplicate `external_order_id` for the same integration (idempotency). |
| **500** | Internal Server Error | Server error; retry with backoff. |

**Example error body (401):**

```json
{
  "error": "Invalid or missing API key. Use X-API-Key header."
}
```

**Example error body (400):**

```json
{
  "error": "external_order_id is required"
}
```

**Example error body (409):**

```json
{
  "error": "An order with this external_order_id already exists for your integration."
}
```

**Example error body (404):**

```json
{
  "error": "Order not found or access denied"
}
```

---

## 8. Integration steps

Do these in order on **your** backend and frontend.

### Step 1: Obtain API key

- Giftyzet admin creates a plugin integration for your store and receives an **API key** (e.g. `gfty_live_...`).
- Store the API key in your backend (env or secrets). Never expose it to the browser or mobile app.

### Step 2: Checkout and payment on your side

- Customer selects “Send as gift” and enters recipient **name** and **email** (and optionally **phone**).
- Customer pays on your platform (your payment provider).
- Only after **payment succeeds**, proceed to Step 3.

### Step 3: Create plugin order (idempotent)

- From your **backend**, call:

  `POST {base}/api/plugin/v1/orders`

- **Headers:**  
  `X-API-Key: <your_api_key>`  
  `Content-Type: application/json`

- **Body:** Use the same `external_order_id` as your own order ID (so retries do not create duplicates). Include sender and receiver details and `items`, `subtotal`, `shipping`, `tax`, `total` as in [6.1](#61-create-order--request-and-response-in-detail).

- If you get **409**, an order for this `external_order_id` already exists; use GET to fetch it and use its `recipient_link` (do not create again).

- On **200**, store:
  - `order_id` (Giftyzet ID)
  - `order_number`
  - **`recipient_link`** — this is what the buyer will share with the recipient.

### Step 4: Show order confirmation and share options

- On your **order confirmation page** (after payment):
  - Show the buyer: “Share this link with the recipient so they can enter their delivery address and contact details.”
  - Offer at least one of:
    - **Send by email** — send `recipient_link` to `receiver_email` (your email sending).
    - **Send by SMS** — send `recipient_link` to `receiver_phone` (your SMS provider).
    - **Copy link** — copy `recipient_link` to clipboard.

- You can implement “Send by email” and “Send by SMS” on your side using your own providers; the only requirement is that the recipient receives the **exact** `recipient_link` URL.

### Step 5: Recipient flow (handled by Giftyzet)

- Recipient opens **`recipient_link`** in a browser.
- They see the order summary and a form to enter or edit:
  - Full name (required)
  - Email (required)
  - Phone (optional)
  - Delivery address (required)
- When they submit, the order on Giftyzet becomes `status: "confirmed"` and can be fulfilled.

### Step 6: Optional — Poll or webhook for status

- To know when the recipient has submitted details, either:
  - **Poll:** Periodically call `GET /api/plugin/v1/orders?external_order_id=<your_order_id>` and check `order.status`. When it is `confirmed`, you have `receiver_address` and contact details.
  - Or use any future webhook mechanism Giftyzet may provide (not covered in this doc).

### Step 7: Fulfilment

- Fulfilment (shipping, etc.) is handled by the seller (your store) on Giftyzet. You do not need to call the API again for that unless you have a custom process.

---

### Example: common use case (pseudocode)

This example shows how your backend and frontend can use the API in a typical flow.

**1. Customer completes gift checkout and pays on your site.**

- Your backend has: `my_order_id = "ORD-12345"`, sender (buyer) details, receiver (recipient) details, line items, amounts.

**2. After payment succeeds, your backend calls the Plugin API:**

```
POST https://your-giftyzet-domain.com/api/plugin/v1/orders
Headers: X-API-Key: <your_api_key>, Content-Type: application/json
Body: {
  "external_order_id": "ORD-12345",
  "sender_name": "Jane Doe",
  "sender_email": "jane@example.com",
  "sender_phone": "+1234567890",
  "sender_address": "123 Main St, City, ST 12345",
  "receiver_name": "John Doe",
  "receiver_email": "john@example.com",
  "receiver_phone": "+1987654321",
  "items": [ { "name": "Gift Box", "price": 49.99, "quantity": 1 } ],
  "subtotal": 54.99, "shipping": 0, "tax": 4.40, "total": 59.39
}
```

**3. Handle the response:**

- If status is **200:** Save `order_id`, `order_number`, and **recipient_link** in your database (linked to `my_order_id`). Return these to your frontend so the order confirmation page can show the link and “Send by email / SMS / Copy”.
- If status is **409:** The order already exists (e.g. retry). Call `GET /api/plugin/v1/orders?external_order_id=ORD-12345` and use the returned `order.gift_link` (or `recipient_link` equivalent) from the response. Do not create again.
- If status is **400, 401, 500:** Handle as in [1.7](#17-what-to-do-when-you-get-an-error).

**4. Order confirmation page (your frontend):**

- Show the buyer: “Share this link with the recipient so they can enter their delivery address and contact details.”
- Show **recipient_link** and buttons: “Send by email” (you send the link to `receiver_email`), “Send by SMS” (you send to `receiver_phone`), “Copy link” (copy `recipient_link` to clipboard).

**5. (Optional) Poll for recipient address:**

- Every few minutes (or on “Refresh”), call:  
  `GET https://your-giftyzet-domain.com/api/plugin/v1/orders?external_order_id=ORD-12345`  
  with the same `X-API-Key`.
- When `response.order.status === "confirmed"`, the recipient has submitted the form. Then use `response.order.receiver_address`, `response.order.receiver_name`, etc. for your records or fulfilment.

---

## 9. cURL examples

Replace `BASE`, `API_KEY`, and body values with your real values.

**Create order:**

```bash
curl -X POST "https://BASE/api/plugin/v1/orders" \
  -H "X-API-Key: API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "external_order_id": "YOUR-ORDER-123",
    "sender_name": "Jane Doe",
    "sender_email": "jane@example.com",
    "sender_phone": "+1234567890",
    "sender_address": "123 Main St, City, ST 12345",
    "receiver_name": "John Doe",
    "receiver_email": "john@example.com",
    "receiver_phone": "+1987654321",
    "items": [
      { "name": "Gift Box", "price": 49.99, "quantity": 1 },
      { "name": "Card", "price": 5, "quantity": 1 }
    ],
    "subtotal": 54.99,
    "shipping": 0,
    "tax": 4.40,
    "total": 59.39
  }'
```

**Get order by external order ID:**

```bash
curl -X GET "https://BASE/api/plugin/v1/orders?external_order_id=YOUR-ORDER-123" \
  -H "X-API-Key: API_KEY"
```

**Get order by Giftyzet order ID:**

```bash
curl -X GET "https://BASE/api/plugin/v1/orders/550e8400-e29b-41d4-a716-446655440000" \
  -H "X-API-Key: API_KEY"
```

---

## 10. Recipient link & flow

- **URL format:** `{base}/gift-receiver/{gift_token}`  
  You get the full URL as **`recipient_link`** in the create-order response; use it as-is.

- **Behavior:**
  - Recipient opens the link (no login required).
  - They see order summary (items, total, sender).
  - They enter or edit: name, email, phone, delivery address.
  - On submit, the order is updated and `status` becomes `confirmed`; `receiver_name`, `receiver_email`, `receiver_phone`, `receiver_address` are set.
  - The same link can be used to see that details were already submitted (e.g. “Already confirmed” or pre-filled).

- **Sending the link:** Implement on your side (email/SMS/copy) as in [Step 4](#step-4-show-order-confirmation-and-share-options) of [Integration steps](#8-integration-steps).

---

## 11. Admin endpoints (API key creation)

These are for **Giftyzet admins** only (not for plugin integrators). Documented here for completeness.

**Create plugin integration (get API key once):**

- **Method:** `POST`
- **Path:** `{base}/api/admin/plugin-integrations`
- **Headers:** `Authorization: Bearer <admin_jwt>`, `Content-Type: application/json`
- **Body:**

```json
{
  "name": "My Store",
  "store_id": "<store_uuid>",
  "fee_per_order": 1.50
}
```

- **Success (200):**  
  Returns integration record plus **`api_key`** (only time it is returned). Also `message: "Store this API key securely. It will not be shown again."`

**List plugin integrations (no API keys):**

- **Method:** `GET`
- **Path:** `{base}/api/admin/plugin-integrations`
- **Headers:** `Authorization: Bearer <admin_jwt>`
- **Success (200):**  
  `{ "integrations": [ { "id", "name", "store_id", "vendor_id", "fee_per_order", "api_key_prefix", "is_active", "created_at" }, ... ] }`

---

## Quick reference

| What | Value |
|------|--------|
| Auth header | `X-API-Key: <api_key>` |
| Create order | `POST /api/plugin/v1/orders` |
| Get by your ID | `GET /api/plugin/v1/orders?external_order_id=<id>` |
| Get by Giftyzet ID | `GET /api/plugin/v1/orders/<uuid>` |
| Idempotency | Use same `external_order_id`; 409 = already exists. |
| Order status enum | `pending`, `confirmed`, `dispatched`, `delivered`, `cancelled` |
| Payment status (plugin) | `paid` at creation |
| Share with recipient | Use `recipient_link` from create response (email/SMS/copy on your side). |

---

For API key, fee changes, or integration support, contact the Giftyzet platform administrator.
