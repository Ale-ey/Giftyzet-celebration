"use client"

import { useState, useRef } from "react"
import { X, Upload, Trash2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { STORE_CATEGORIES } from "@/lib/constants"
import type { Product } from "@/types"

interface AddProductDialogProps {
  isOpen: boolean
  onClose: () => void
  onSave: (product: Omit<Product, "id" | "rating" | "reviews" | "vendor">) => void
}

export default function AddProductDialog({ isOpen, onClose, onSave }: AddProductDialogProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    originalPrice: "",
    category: "",
    discount: "",
    stock: ""
  })
  const [images, setImages] = useState<string[]>([])
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([])

  const handleImageUpload = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      alert("Please select an image file")
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("Image size should be less than 5MB")
      return
    }

    const reader = new FileReader()
    reader.onloadend = () => {
      const base64String = reader.result as string
      const newImages = [...images]
      newImages[index] = base64String
      setImages(newImages)
    }
    reader.readAsDataURL(file)
  }

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index)
    setImages(newImages)
    if (fileInputRefs.current[index]) {
      fileInputRefs.current[index]!.value = ""
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name || !formData.price || !formData.category) {
      alert("Please fill in all required fields")
      return
    }

    if (images.length === 0) {
      alert("Please upload at least one image")
      return
    }

    // Calculate discount percentage if both prices are provided
    let discount = formData.discount
    if (formData.originalPrice && formData.price) {
      const original = parseFloat(formData.originalPrice.replace("$", ""))
      const sale = parseFloat(formData.price.replace("$", ""))
      if (original > sale) {
        const discountPercent = Math.round(((original - sale) / original) * 100)
        discount = `${discountPercent}% OFF`
      }
    }

    onSave({
      name: formData.name,
      description: formData.description,
      price: formData.price.startsWith("$") ? formData.price : `$${formData.price}`,
      originalPrice: formData.originalPrice || formData.price,
      category: formData.category,
      image: images[0], // Use first image as main image
      discount: discount || "",
      description: formData.description,
      stock: formData.stock ? parseInt(formData.stock) : undefined
    })

    // Reset form
    setFormData({
      name: "",
      description: "",
      price: "",
      originalPrice: "",
      category: "",
      discount: "",
      stock: ""
    })
    setImages([])
    fileInputRefs.current.forEach(ref => {
      if (ref) ref.value = ""
    })
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl bg-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-900">Add New Product</DialogTitle>
          <DialogDescription className="text-gray-600">
            Fill in the product details and upload images
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-semibold text-gray-900">
              Product Name *
            </label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="bg-white border-gray-200 text-gray-900"
              placeholder="Enter product name"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-semibold text-gray-900">
              Description
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              className="w-full px-3 py-2 border border-gray-200 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-300"
              placeholder="Enter product description"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="price" className="text-sm font-semibold text-gray-900">
                Sale Price *
              </label>
              <Input
                id="price"
                type="text"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                required
                className="bg-white border-gray-200 text-gray-900"
                placeholder="$99.99"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="originalPrice" className="text-sm font-semibold text-gray-900">
                Original Price
              </label>
              <Input
                id="originalPrice"
                type="text"
                value={formData.originalPrice}
                onChange={(e) => setFormData({ ...formData, originalPrice: e.target.value })}
                className="bg-white border-gray-200 text-gray-900"
                placeholder="$129.99"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="stock" className="text-sm font-semibold text-gray-900">
              Stock Quantity
            </label>
            <Input
              id="stock"
              type="number"
              min="0"
              value={formData.stock}
              onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
              className="bg-white border-gray-200 text-gray-900"
              placeholder="Enter stock quantity"
            />
            <p className="text-xs text-gray-500">Leave empty for unlimited stock</p>
          </div>

          <div className="space-y-2">
            <label htmlFor="category" className="text-sm font-semibold text-gray-900">
              Category *
            </label>
            <select
              id="category"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              required
              className="w-full px-3 py-2 border border-gray-200 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-300"
            >
              <option value="">Select a category</option>
              {STORE_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-900">
              Product Images * (Upload up to 5 images)
            </label>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {[0, 1, 2, 3, 4].map((index) => (
                <div key={index} className="relative">
                  {images[index] ? (
                    <div className="relative aspect-square">
                      <img
                        src={images[index]}
                        alt={`Product ${index + 1}`}
                        className="w-full h-full object-cover rounded-lg border border-gray-200"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center hover:border-gray-400 transition-colors">
                      <input
                        ref={(el) => (fileInputRefs.current[index] = el)}
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageUpload(index, e)}
                        className="hidden"
                        id={`image-${index}`}
                      />
                      <label
                        htmlFor={`image-${index}`}
                        className="cursor-pointer flex flex-col items-center justify-center p-2 text-gray-500 hover:text-gray-700"
                      >
                        <Upload className="h-6 w-6 mb-1" />
                        <span className="text-xs text-center">Image {index + 1}</span>
                      </label>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500">
              First image will be used as the main product image
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="border-2 border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="border-2 border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400"
            >
              Add Product
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

