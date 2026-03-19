import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface AuthDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AuthDialog({ open, onOpenChange }: AuthDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Sign in to save</DialogTitle>
          <DialogDescription>
            You need to be logged in to save your resume progress. Please sign in or create an
            account to continue.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Link href="/auth?login=false" className="w-full sm:w-auto">
            <Button variant="secondary" className="w-full">
              Register
            </Button>
          </Link>
          <Link href="/auth?login=true" className="w-full sm:w-auto">
            <Button className="w-full">Login</Button>
          </Link>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
