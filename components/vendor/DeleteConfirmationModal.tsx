"use client"

import { AlertTriangle } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface DeleteConfirmationModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  itemName: string
  itemType: "product" | "service"
}

export default function DeleteConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  itemName,
  itemType
}: DeleteConfirmationModalProps) {
  const handleConfirm = () => {
    onConfirm()
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-white">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="bg-red-100 p-3 rounded-full">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-gray-900">{title}</DialogTitle>
              <DialogDescription className="text-gray-600 mt-1">
                This action cannot be undone
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="py-4">
          <p className="text-gray-700">
            Are you sure you want to delete <span className="font-semibold">"{itemName}"</span>? 
            This {itemType} will be permanently removed from your store.
          </p>
        </div>

        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="border-2 border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            Delete {itemType === "product" ? "Product" : "Service"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

