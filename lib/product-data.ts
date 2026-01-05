"use client"

import type { Product, Service } from "@/types"

// Product data management
export const getVendorProducts = (): Product[] => {
  if (typeof window === "undefined") return []
  const products = localStorage.getItem("vendorProducts")
  return products ? JSON.parse(products) : []
}

export const saveVendorProduct = (product: Product): void => {
  if (typeof window === "undefined") return
  const products = getVendorProducts()
  const existingIndex = products.findIndex((p) => p.id === product.id)
  if (existingIndex >= 0) {
    products[existingIndex] = product
  } else {
    products.push(product)
  }
  localStorage.setItem("vendorProducts", JSON.stringify(products))
  window.dispatchEvent(new Event("vendorProductsUpdated"))
}

export const deleteVendorProduct = (productId: number): void => {
  if (typeof window === "undefined") return
  const products = getVendorProducts()
  const filtered = products.filter((p) => p.id !== productId)
  localStorage.setItem("vendorProducts", JSON.stringify(filtered))
  window.dispatchEvent(new Event("vendorProductsUpdated"))
}

// Service data management
export const getVendorServices = (): Service[] => {
  if (typeof window === "undefined") return []
  const services = localStorage.getItem("vendorServices")
  return services ? JSON.parse(services) : []
}

export const saveVendorService = (service: Service): void => {
  if (typeof window === "undefined") return
  const services = getVendorServices()
  const existingIndex = services.findIndex((s) => s.id === service.id)
  if (existingIndex >= 0) {
    services[existingIndex] = service
  } else {
    services.push(service)
  }
  localStorage.setItem("vendorServices", JSON.stringify(services))
  window.dispatchEvent(new Event("vendorServicesUpdated"))
}

export const deleteVendorService = (serviceId: number): void => {
  if (typeof window === "undefined") return
  const services = getVendorServices()
  const filtered = services.filter((s) => s.id !== serviceId)
  localStorage.setItem("vendorServices", JSON.stringify(filtered))
  window.dispatchEvent(new Event("vendorServicesUpdated"))
}

