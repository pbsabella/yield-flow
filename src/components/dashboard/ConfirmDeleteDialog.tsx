"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
};

export default function ConfirmDeleteDialog({ open, onOpenChange, onConfirm }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete this investment?</DialogTitle>
          <DialogDescription>
            This action cannot be undone. The investment will be removed from your ladder.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            type="button"
            className="bg-danger-solid hover:bg-danger-solid/90 active:bg-danger-solid/80 text-white transition-colors duration-150 ease-out"
          >
            Delete
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
