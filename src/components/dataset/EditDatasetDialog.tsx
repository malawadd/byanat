"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface EditDatasetDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  editablePrice: number | null;
  setEditablePrice: (price: number | null) => void;
  editableVisibility: number;
  setEditableVisibility: (visibility: number) => void;
  isProcessingTx: boolean;
  handleSaveChanges: () => void;
}

export function EditDatasetDialog({
  isOpen,
  onOpenChange,
  editablePrice,
  setEditablePrice,
  editableVisibility,
  setEditableVisibility,
  isProcessingTx,
  handleSaveChanges,
}: EditDatasetDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Dataset Details</DialogTitle>
          <DialogDescription>
            Modify the dataset's price and visibility.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="editableVisibility">Visibility</Label>
            <Select
              value={String(editableVisibility)}
              onValueChange={(value) => setEditableVisibility(Number(value))}
            >
              <SelectTrigger id="editableVisibility">
                <SelectValue placeholder="Select visibility" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Public (Sellable)</SelectItem>
                <SelectItem value="1">Private (Not Sellable)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {editableVisibility === 0 && (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="editablePrice">Price (in USDC)</Label>
              <Input
                id="editablePrice"
                type="number"
                value={editablePrice ? editablePrice : ""}
                onChange={(e) => setEditablePrice(Number(e.target.value))}
                min="0"
              />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSaveChanges} disabled={isProcessingTx}>
            {isProcessingTx ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}