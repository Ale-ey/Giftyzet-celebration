/**
 * Shape plugin order for API response: explicit sender and receiver info for external stores.
 */
export function shapePluginOrderResponse(
  order: Record<string, unknown>,
  orderItems: unknown[]
): Record<string, unknown> {
  const normalize = (value: unknown): string | null => {
    if (value == null) return null
    const s = String(value).trim()
    return s === '' ? null : s
  }

  return {
    order_id: order.id,
    order_number: order.order_number,
    external_order_id: order.external_order_id,
    status: order.status,
    payment_status: order.payment_status,
    total: order.total,
    subtotal: order.subtotal,
    shipping: order.shipping,
    tax: order.tax,
    created_at: order.created_at,
    confirmed_at: order.confirmed_at,
    // Do not expose gift_token or gift_link in public plugin API responses
    sender: {
      name: normalize(order.sender_name),
      email: normalize(order.sender_email),
      phone: normalize(order.sender_phone),
      address: normalize(order.sender_address),
    },
    receiver: {
      // Receiver fields are null until the receiver opens the gift link and submits the form
      name: normalize(order.receiver_name),
      email: normalize(order.receiver_email),
      phone: normalize(order.receiver_phone),
      address: normalize(order.receiver_address),
    },
    order_items: orderItems || [],
  }
}
