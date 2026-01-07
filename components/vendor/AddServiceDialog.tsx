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
import type { Service } from "@/types"

interface AddServiceDialogProps {
  isOpen: boolean
  onClose: () => void
  onSave: (service: Omit<Service, "id" | "rating" | "reviews" | "vendor">) => void
  editService?: Service | null
}

export default function AddServiceDialog({ isOpen, onClose, onSave, editService }: AddServiceDialogProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    originalPrice: "",
    category: "",
    discount: "",
    duration: "",
    location: "",
    available: true
  })
  const [images, setImages] = useState<string[]>([])
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([])

  // Load service data when editing
  useEffect(() => {
    if (editService && isOpen) {
      setFormData({
        name: editService.name || "",
        description: editService.description || "",
        price: editService.price.replace("$", "") || "",
        originalPrice: editService.originalPrice.replace("$", "") || "",
        category: editService.category || "",
        discount: editService.discount || "",
        duration: editService.duration || "",
        location: editService.location || "",
        available: editService.available !== false
      })
      setImages(editService.image ? [editService.image] : [])
    } else if (!editService && isOpen) {
      // Reset form when adding new service
      setFormData({
        name: "",
        description: "",
        price: "",
        originalPrice: "",
        category: "",
        discount: "",
        duration: "",
        location: "",
        available: true
      })
      setImages([])
      fileInputRefs.current.forEach(ref => {
        if (ref) ref.value = ""
      })
    }
  }, [editService, isOpen])

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

    if (images.length === 0 && !editService) {
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
      duration: formData.duration || undefined,
      location: formData.location || undefined,
      available: formData.available
    })

    // Reset form
    setFormData({
      name: "",
      description: "",
      price: "",
      originalPrice: "",
      category: "",
      discount: "",
      duration: "",
      location: "",
      available: true
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
          <DialogTitle className="text-2xl font-bold text-gray-900">
            {editService ? "Edit Service" : "Add New Service"}
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            {editService ? "Update the service details and images" : "Fill in the service details and upload images"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-semibold text-gray-900">
              Service Name *
            </label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="bg-white border-gray-200 text-gray-900"
              placeholder="Enter service name"
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
              placeholder="Enter service description"
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="duration" className="text-sm font-semibold text-gray-900">
                Duration
              </label>
              <Input
                id="duration"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                className="bg-white border-gray-200 text-gray-900"
                placeholder="e.g., 2 hours, 1 day"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="location" className="text-sm font-semibold text-gray-900">
                Location
              </label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="bg-white border-gray-200 text-gray-900"
                placeholder="Service location"
              />
            </div>
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

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="available"
              checked={formData.available}
              onChange={(e) => setFormData({ ...formData, available: e.target.checked })}
              className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
            />
            <label htmlFor="available" className="text-sm font-semibold text-gray-900">
              Available for booking
            </label>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-900">
              Service Images * (Upload up to 5 images)
            </label>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {[0, 1, 2, 3, 4].map((index) => (
                <div key={index} className="relative">
                  {images[index] ? (
                    <div className="relative aspect-square">
                      <img
                        src={images[index]}
                        alt={`Service ${index + 1}`}
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
                        id={`service-image-${index}`}
                      />
                      <label
                        htmlFor={`service-image-${index}`}
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
              First image will be used as the main service image
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
              {editService ? "Update Service" : "Add Service"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

