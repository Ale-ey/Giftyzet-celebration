"use client"

import { useState, useRef, useEffect } from "react"
import { X, Upload } from "lucide-react"
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
import { createProduct, updateProduct } from "@/lib/api/products"

interface AddProductDialogProps {
  isOpen: boolean
  onClose: () => void
  onSave: () => void
  editProduct?: any | null
  storeId?: string
}

export default function AddProductDialog({ isOpen, onClose, onSave, editProduct, storeId }: AddProductDialogProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    original_price: "",
    category: "",
    stock: "",
    available: true
  })
  const [imageFiles, setImageFiles] = useState<(File | null)[]>([null, null, null, null])
  const [imagePreviews, setImagePreviews] = useState<(string | null)[]>([null, null, null, null])
  const [loading, setLoading] = useState(false)
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([null, null, null, null])

  // Load product data when editing
  useEffect(() => {
    if (editProduct && isOpen) {
      setFormData({
        name: editProduct.name || "",
        description: editProduct.description || "",
        price: editProduct.price?.toString() || "",
        original_price: editProduct.original_price?.toString() || "",
        category: editProduct.category || "",
        stock: editProduct.stock?.toString() || "",
        available: editProduct.available !== false
      })
      
      // Load existing images
      if (editProduct.images && Array.isArray(editProduct.images)) {
        const previews = [...imagePreviews]
        editProduct.images.forEach((url: string, index: number) => {
          if (index < 4) previews[index] = url
        })
        setImagePreviews(previews)
      } else if (editProduct.image_url) {
        setImagePreviews([editProduct.image_url, null, null, null])
      }
      
      setImageFiles([null, null, null, null])
    } else if (!editProduct && isOpen) {
      // Reset form when adding new product
      resetForm()
    }
  }, [editProduct, isOpen])

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      price: "",
      original_price: "",
      category: "",
      stock: "",
      available: true
    })
    setImageFiles([null, null, null, null])
    setImagePreviews([null, null, null, null])
    fileInputRefs.current.forEach(ref => {
      if (ref) ref.value = ""
    })
  }

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

    const newFiles = [...imageFiles]
    newFiles[index] = file
    setImageFiles(newFiles)
    
    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      const newPreviews = [...imagePreviews]
      newPreviews[index] = reader.result as string
      setImagePreviews(newPreviews)
    }
    reader.readAsDataURL(file)
  }

  const removeImage = (index: number) => {
    const newFiles = [...imageFiles]
    newFiles[index] = null
    setImageFiles(newFiles)
    
    const newPreviews = [...imagePreviews]
    newPreviews[index] = null
    setImagePreviews(newPreviews)
    
    if (fileInputRefs.current[index]) {
      fileInputRefs.current[index]!.value = ""
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name || !formData.price || !formData.category) {
      alert("Please fill in all required fields")
      return
    }

    // Check if at least one image is provided
    const hasImage = imagePreviews.some(preview => preview !== null)
    if (!hasImage && !editProduct) {
      alert("Please upload at least one product image")
      return
    }

    if (!storeId) {
      alert("Store ID is missing")
      return
    }

    setLoading(true)

    try {
      const productData = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        original_price: formData.original_price ? parseFloat(formData.original_price) : parseFloat(formData.price),
        category: formData.category,
        stock: formData.stock ? parseInt(formData.stock) : 0,
        available: formData.available
      }

      // Get only the files that were uploaded (not null)
      const filesToUpload = imageFiles.filter((file): file is File => file !== null)

      if (editProduct) {
        // Update existing product - only upload new files
        if (filesToUpload.length > 0) {
          await updateProduct(editProduct.id, productData, filesToUpload, storeId)
        } else {
          // No new images, just update data
          await updateProduct(editProduct.id, productData, undefined, storeId)
        }
      } else {
        // Create new product
        await createProduct(storeId, productData, filesToUpload)
      }

      resetForm()
      onSave() // Reload products
      onClose()
    } catch (error: any) {
      console.error("Error saving product:", error)
      alert(`Failed to save product: ${error.message || "Please try again."}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl bg-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-900">
            {editProduct ? "Edit Product" : "Add New Product"}
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            {editProduct ? "Update the product details and images" : "Fill in the product details and upload images (up to 4)"}
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
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                required
                className="bg-white border-gray-200 text-gray-900"
                placeholder="99.99"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="original_price" className="text-sm font-semibold text-gray-900">
                Original Price
              </label>
              <Input
                id="original_price"
                type="number"
                step="0.01"
                min="0"
                value={formData.original_price}
                onChange={(e) => setFormData({ ...formData, original_price: e.target.value })}
                className="bg-white border-gray-200 text-gray-900"
                placeholder="129.99"
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

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="available"
              checked={formData.available}
              onChange={(e) => setFormData({ ...formData, available: e.target.checked })}
              className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
            />
            <label htmlFor="available" className="text-sm font-semibold text-gray-900">
              Available for purchase
            </label>
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
              Product Images * (Upload up to 4 images)
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[0, 1, 2, 3].map((index) => (
                <div key={index} className="relative">
                  {imagePreviews[index] ? (
                    <div className="relative aspect-square">
                      <img
                        src={imagePreviews[index]!}
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
                      {index === 0 && (
                        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white text-xs py-1 text-center rounded-b-lg">
                          Main Image
                        </div>
                      )}
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
                        <Upload className="h-8 w-8 mb-1" />
                        <span className="text-xs text-center">
                          {index === 0 ? "Main Image" : `Image ${index + 1}`}
                        </span>
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
              onClick={() => {
                resetForm()
                onClose()
              }}
              disabled={loading}
              className="border-2 border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="border-2 border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400 disabled:opacity-50"
            >
              {loading ? "Saving..." : editProduct ? "Update Product" : "Add Product"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
