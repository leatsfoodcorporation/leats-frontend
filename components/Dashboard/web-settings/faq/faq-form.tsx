"use client";
import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ChevronDown, ChevronUp, Trash2 } from "lucide-react";

type ContentItem = { id?: string; title: string; description: string };
type FAQItem = { id: string; title: string; contents: ContentItem[]; sortOrder?: number | null };

interface FAQFormProps {
  onSave: (faq: FAQItem) => void;
  initialData?: FAQItem;
  isEdit?: boolean;
  onClose?: () => void;
}

export default function FAQForm({
  onSave,
  initialData,
  isEdit = false,
  onClose,
}: FAQFormProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [sortOrder, setSortOrder] = useState<number | "" | null>("");
  const [contents, setContents] = useState<ContentItem[]>([
    { id: String(Date.now()), title: "", description: "" },
  ]);
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  // Load initial data for edit mode
  useEffect(() => {
    if (initialData && isEdit) {
      setTitle(initialData.title);
      setSortOrder((initialData as any).sortOrder ?? "");
      const loadedContents = initialData.contents.map((c, idx) => ({
        id: c.id || String(Date.now() + idx),
        title: c.title,
        description: c.description,
      }));
      setContents(loadedContents);
      // Auto-expand first item
      if (loadedContents.length > 0) {
        setExpandedItem(loadedContents[0].id || "0");
      }
      setOpen(true);
    }
  }, [initialData, isEdit]);

  const addContent = () => {
    const newId = String(Date.now() + Math.random());
    setContents((prev) => [
      ...prev,
      { id: newId, title: "", description: "" },
    ]);
    // Auto-expand the newly added item
    setExpandedItem(newId);
  };

  const toggleCollapse = (id: string) => {
    setExpandedItem((prev) => (prev === id ? null : id));
  };

  const removeContent = (id: string) => {
    setContents((prev) => prev.filter((c) => c.id !== id));
  };

  const updateContent = (
    id: string,
    field: "title" | "description",
    value: string,
  ) => {
    setContents((prev) =>
      prev.map((c) => (c.id === id ? { ...c, [field]: value } : c)),
    );
  };

  const handleSave = () => {
    if (!title.trim()) {
      alert("FAQ title is required");
      return;
    }

    const validContents = contents.filter(
      (c) => c.title.trim() || c.description.trim(),
    );
    if (validContents.length === 0) {
      alert("Add at least one content item with title or description");
      return;
    }

    const faq: FAQItem = {
      id: isEdit && initialData ? initialData.id : String(Date.now()),
      title: title.trim(),
      contents: validContents.map(c => ({ title: c.title, description: c.description })),
      sortOrder: sortOrder === "" ? null : Number(sortOrder),
    };

    onSave(faq);
    
    // Reset form
    if (!isEdit) {
      setTitle("");
      setContents([{ id: String(Date.now()), title: "", description: "" }]);
      setOpen(false);
    } else if (onClose) {
      onClose();
    }
  };

  const handleClose = () => {
    if (isEdit && onClose) {
      onClose();
    } else {
      setOpen(false);
    }
  };

  // For edit mode, control open state externally
  const dialogOpen = isEdit ? (initialData ? true : false) : open;
  const dialogOnOpenChange = isEdit ? (open: boolean) => !open && onClose?.() : setOpen;

  return (
    <Dialog open={dialogOpen} onOpenChange={dialogOnOpenChange}>
      {!isEdit && (
        <DialogTrigger asChild>
          <Button size="sm">+ Add FAQ</Button>
        </DialogTrigger>
      )}

      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit FAQ" : "Create FAQ"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Update FAQ details and content items." : "Add FAQ title first, then add one or more content items."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <label className="block text-sm font-medium mb-1">FAQ Title</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Shipping & Delivery"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Sort Order (optional)</label>
            <input
              type="number"
              value={sortOrder as any}
              onChange={(e) => setSortOrder(e.target.value === "" ? "" : Number(e.target.value))}
              placeholder="e.g., 1"
              className="w-full border rounded-md px-3 py-2"
            />
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Contents</label>
              <button
                onClick={addContent}
                type="button"
                className="text-sm text-primary hover:underline"
              >
                + Add content
              </button>
            </div>

            <div className="mt-3 space-y-3">
              {contents.map((c, idx) => {
                const itemId = c.id || String(idx);
                const isExpanded = expandedItem === itemId;
                return (
                  <div key={itemId} className="border rounded-md p-3 bg-muted/5">
                    <div className="flex items-start justify-between">
                      <strong className="text-sm">Item {idx + 1}</strong>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => removeContent(itemId)}
                          type="button"
                          className="text-destructive hover:bg-destructive/10 p-1 rounded"
                          disabled={contents.length === 1}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleCollapse(itemId)}
                          className="p-1 rounded-md hover:bg-accent/50"
                          aria-label={isExpanded ? "Collapse" : "Expand"}
                        >
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="mt-2 space-y-2">
                        <Input
                          value={c.title}
                          onChange={(e) =>
                            updateContent(itemId, "title", e.target.value)
                          }
                          placeholder="Question title"
                        />
                        <Textarea
                          value={c.description}
                          onChange={(e) =>
                            updateContent(itemId, "description", e.target.value)
                          }
                          placeholder="Answer description"
                          rows={3}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            {isEdit ? "Update FAQ" : "Save FAQ"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
