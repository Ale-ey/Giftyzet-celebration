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
import { createService, updateService } from "@/lib/api/products"

interface AddServiceDialogProps {
  isOpen: boolean
  onClose: () => void
  onSave: () => void
  editService?: any | null
  storeId?: string
}

export default function AddServiceDialog({ isOpen, onClose, onSave, editService, storeId }: AddServiceDialogProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    original_price: "",
    category: "",
    location: "",
    available: true
  })
  const [imageFiles, setImageFiles] = useState<(File | null)[]>([null, null, null, null])
  const [imagePreviews, setImagePreviews] = useState<(string | null)[]>([null, null, null, null])
  const [loading, setLoading] = useState(false)
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([null, null, null, null])

  // Load service data when editing
  useEffect(() => {
    if (editService && isOpen) {
      setFormData({
        name: editService.name || "",
        description: editService.description || "",
        price: editService.price?.toString() || "",
        original_price: editService.original_price?.toString() || "",
        category: editService.category || "",
        location: editService.location || "",
        available: editService.available !== false
      })
      
      // Load existing images
      if (editService.images && Array.isArray(editService.images)) {
        const previews = [...imagePreviews]
        editService.images.forEach((url: string, index: number) => {
          if (index < 4) previews[index] = url
        })
        setImagePreviews(previews)
      } else if (editService.image_url) {
        setImagePreviews([editService.image_url, null, null, null])
      }
      
      setImageFiles([null, null, null, null])
    } else if (!editService && isOpen) {
      // Reset form when adding new service
      resetForm()
    }
  }, [editService, isOpen])

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      price: "",
      original_price: "",
      category: "",
      location: "",
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
    if (!hasImage && !editService) {
      alert("Please upload at least one service image")
      return
    }

    if (!storeId) {
      alert("Store ID is missing")
      return
    }

    setLoading(true)

    try {
      const serviceData = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        original_price: formData.original_price ? parseFloat(formData.original_price) : parseFloat(formData.price),
        category: formData.category,
        location: formData.location,
        available: formData.available
      }

      // Get only the files that were uploaded (not null)
      const filesToUpload = imageFiles.filter((file): file is File => file !== null)

      if (editService) {
        // Update existing service - only upload new files
        if (filesToUpload.length > 0) {
          await updateService(editService.id, serviceData, filesToUpload, storeId)
        } else {
          // No new images, just update data
          await updateService(editService.id, serviceData, undefined, storeId)
        }
      } else {
        // Create new service
        await createService(storeId, serviceData, filesToUpload)
      }

      resetForm()
      onSave() // Reload services
      onClose()
    } catch (error: any) {
      console.error("Error saving service:", error)
      alert(`Failed to save service: ${error.message || "Please try again."}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl bg-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-900">
            {editService ? "Edit Service" : "Add New Service"}
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            {editService ? "Update the service details and images" : "Fill in the service details and upload images (up to 4)"}
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
                Price per hour ($) *
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
                placeholder="e.g. 50.00"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="original_price" className="text-sm font-semibold text-gray-900">
                Original price per hour ($)
              </label>
              <Input
                id="original_price"
                type="number"
                step="0.01"
                min="0"
                value={formData.original_price}
                onChange={(e) => setFormData({ ...formData, original_price: e.target.value })}
                className="bg-white border-gray-200 text-gray-900"
                placeholder="e.g. 65.00"
              />
            </div>
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
              Service Images * (Upload up to 4 images)
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[0, 1, 2, 3].map((index) => (
                <div key={index} className="relative">
                  {imagePreviews[index] ? (
                    <div className="relative aspect-square">
                      <img
                        src={imagePreviews[index]!}
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
                      {index === 0 && (
                        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white text-xs py-1 text-center rounded-b-lg">
                          Main Image
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center hover:border-gray-400 transition-colors">
                      <input
                        ref={(el) => { fileInputRefs.current[index] = el }}
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
              First image will be used as the main service image
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
              {loading ? "Saving..." : editService ? "Update Service" : "Add Service"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
