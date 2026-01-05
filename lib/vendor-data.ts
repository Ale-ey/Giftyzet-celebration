"use client"

import type { Vendor, Store, Order } from "@/types"

// Vendor data management
export const getVendors = (): Vendor[] => {
  if (typeof window === "undefined") return []
  const vendors = localStorage.getItem("vendors")
  return vendors ? JSON.parse(vendors) : []
}

export const saveVendor = (vendor: Vendor): void => {
  if (typeof window === "undefined") return
  const vendors = getVendors()
  const existingIndex = vendors.findIndex((v) => v.id === vendor.id)
  if (existingIndex >= 0) {
    vendors[existingIndex] = vendor
  } else {
    vendors.push(vendor)
  }
  localStorage.setItem("vendors", JSON.stringify(vendors))
}

export const getVendorByEmail = (email: string): Vendor | undefined => {
  const vendors = getVendors()
  return vendors.find((v) => v.email === email)
}

// Store data management
export const getStores = (): Store[] => {
  if (typeof window === "undefined") return []
  const stores = localStorage.getItem("stores")
  return stores ? JSON.parse(stores) : []
}

export const getStoreByVendorId = (vendorId: string): Store | undefined => {
  const stores = getStores()
  return stores.find((s) => s.vendorId === vendorId)
}

export const saveStore = (store: Store): void => {
  if (typeof window === "undefined") return
  const stores = getStores()
  const existingIndex = stores.findIndex((s) => s.id === store.id)
  if (existingIndex >= 0) {
    stores[existingIndex] = store
  } else {
    stores.push(store)
  }
  localStorage.setItem("stores", JSON.stringify(stores))
  window.dispatchEvent(new Event("storesUpdated"))
}

export const getPendingStores = (): Store[] => {
  const stores = getStores()
  return stores.filter((s) => s.status === "pending")
}

export const getApprovedStores = (): Store[] => {
  const stores = getStores()
  return stores.filter((s) => s.status === "approved")
}

// Order data management
export const getOrders = (): Order[] => {
  if (typeof window === "undefined") return []
  const orders = localStorage.getItem("orders")
  return orders ? JSON.parse(orders) : []
}

export const getOrdersByVendorId = (vendorId: string): Order[] => {
  const orders = getOrders()
  return orders.filter((o) => o.vendorId === vendorId)
}

export const saveOrder = (order: Order): void => {
  if (typeof window === "undefined") return
  const orders = getOrders()
  const existingIndex = orders.findIndex((o) => o.id === order.id)
  if (existingIndex >= 0) {
    orders[existingIndex] = order
  } else {
    orders.push(order)
  }
  localStorage.setItem("orders", JSON.stringify(orders))
  window.dispatchEvent(new Event("ordersUpdated"))
}

export const updateOrderStatus = (
  orderId: string,
  status: Order["status"]
): void => {
  const orders = getOrders()
  const order = orders.find((o) => o.id === orderId)
  if (order) {
    const now = new Date().toISOString()
    if (status === "confirmed" && !order.confirmedAt) {
      order.confirmedAt = now
    } else if (status === "dispatched" && !order.dispatchedAt) {
      order.dispatchedAt = now
    } else if (status === "delivered" && !order.deliveredAt) {
      order.deliveredAt = now
    }
    order.status = status
    saveOrder(order)
  }
}

