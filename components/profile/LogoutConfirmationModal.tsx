"use client"

import { LogOut, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"

interface LogoutConfirmationModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  loading?: boolean
}

export default function LogoutConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  loading = false
}: LogoutConfirmationModalProps) {
  const handleOpenChange = (open: boolean) => {
    // Only allow closing if not loading
    if (!open && !loading) {
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-full bg-red-100">
            <LogOut className="h-8 w-8 text-red-600" />
          </div>
          <DialogTitle className="text-2xl font-semibold text-gray-900 text-center">
            Sign Out?
          </DialogTitle>
          <DialogDescription className="text-center text-gray-600 mt-2">
            Are you sure you want to sign out? You'll need to sign in again to access your account.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={loading}
            className="flex-1 border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400"
          >
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Signing out...
              </>
            ) : (
              <>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

