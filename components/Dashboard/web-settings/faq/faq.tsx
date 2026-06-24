"use client";
import { usePermissions } from "@/hooks/usePermissions";
import React, { useState, useEffect } from "react";
import FAQForm from "./faq-form";
import * as faqService from "@/services/web/faqService";
import { Card, CardHeader, CardContent, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, Edit, Trash2, MessageSquare } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

type ContentItem = { title: string; description: string };
type FAQItem = { id: string; title: string; contents: ContentItem[]; isActive?: boolean; sortOrder?: number | null };

export default function FAQ() {
  const { canAdd, canEdit, canDelete } = usePermissions();
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [viewFaq, setViewFaq] = useState<FAQItem | null>(null);
  const [editFaq, setEditFaq] = useState<FAQItem | null>(null);

  // Load from backend
  const loadFaqs = () => {
    faqService
      .getAllFaqs()
      .then((data) => setFaqs(data))
      .catch((e) => console.error(e));
  };

  useEffect(() => {
    loadFaqs();
  }, []);

  const handleSave = async (faq: FAQItem) => {
    try {
      const payload: any = {
        title: faq.title,
        contents: faq.contents.map((c) => ({ title: c.title, description: c.description })),
      };
      if (faq.sortOrder !== undefined) payload.sortOrder = faq.sortOrder;

      const res = await faqService.createFaq(payload);
      const created = res.data ? res.data : res;
      const faqItem = created.data ? created.data : created;
      setFaqs((prev) => [faqItem, ...prev]);
      toast.success("FAQ created successfully");
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 409) {
        const conflict = err.response.data?.conflict;
        const replace = window.confirm(`Sort order ${conflict?.sortOrder} is already used by '${conflict?.title}'. Replace it?`);
        if (replace) {
          try {
            const payload: any = {
              title: faq.title,
              contents: faq.contents.map((c) => ({ title: c.title, description: c.description })),
            };
            if (faq.sortOrder !== undefined) payload.sortOrder = faq.sortOrder;
            const res2 = await faqService.createFaqForce(payload);
            const created2 = res2.data ? res2.data : res2;
            const faqItem2 = created2.data ? created2.data : created2;
            setFaqs((prev) => [faqItem2, ...prev]);
            toast.success("FAQ created and sort order replaced");
          } catch (e2) {
            console.error("Failed to force-create faq:", e2);
            toast.error("Failed to replace sort order");
          }
        }
      } else {
        console.error("Failed to save faq:", err);
        toast.error("Failed to create FAQ");
      }
    }
  };

  const handleUpdate = async (faq: FAQItem) => {
    try {
      const payload: any = {
        title: faq.title,
        contents: faq.contents.map((c) => ({ title: c.title, description: c.description })),
      };
      if (faq.sortOrder !== undefined) payload.sortOrder = faq.sortOrder;

      await faqService.updateFaq(faq.id, payload);
      loadFaqs();
      setEditFaq(null);
      toast.success("FAQ updated successfully");
    } catch (error) {
      const status = (error as any)?.response?.status;
      if (status === 409) {
        const conflict = (error as any).response.data?.conflict;
        const replace = window.confirm(`Sort order ${conflict?.sortOrder} is already used by '${conflict?.title}'. Replace it?`);
        if (replace) {
          try {
            const payload: any = {
              title: faq.title,
              contents: faq.contents.map((c) => ({ title: c.title, description: c.description })),
              sortOrder: faq.sortOrder,
            };
            await faqService.updateFaq(faq.id, payload, true);
            loadFaqs();
            setEditFaq(null);
            toast.success("FAQ updated and sort order replaced");
            return;
          } catch (e2) {
            console.error("Failed to force-update faq:", e2);
            toast.error("Failed to replace sort order");
          }
        }
      }
      console.error("Failed to update faq:", error);
      toast.error("Failed to update FAQ");
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await faqService.deleteFaq(deleteId);
      setFaqs((prev) => prev.filter((f) => f.id !== deleteId));
      setDeleteId(null);
      toast.success("FAQ deleted successfully");
    } catch (error) {
      console.error("Failed to delete faq:", error);
      toast.error("Failed to delete FAQ");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between px-1">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <MessageSquare className="h-6 w-6" />
            FAQ Management
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">Manage frequently asked questions shown on the site.</p>
        </div>

        {canAdd("web_policies") && <FAQForm onSave={handleSave} />}
      </div>

      <hr className="opacity-50" />

      {faqs.length === 0 ? (
        <Card className="border-dashed border-2 bg-muted/10">
          <CardContent className="flex flex-col items-center justify-center py-20">
            <MessageSquare className="h-12 w-12 text-muted-foreground/20 mb-4" />
            <div className="text-muted-foreground">No FAQs yet. Click &quot;Add FAQ&quot; to create one.</div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {faqs.map((faq) => (
            <Card key={faq.id} className="flex flex-col hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-lg line-clamp-2">{faq.title}</CardTitle>
                  <Badge variant={faq.isActive ? "default" : "secondary"} className="shrink-0">
                    {faq.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <CardDescription>{faq.contents.length} question(s)</CardDescription>
              </CardHeader>

              <CardContent className="flex-1">
                <div className="space-y-2">
                  {faq.contents.slice(0, 3).map((c, index) => (
                    <div key={`${faq.id}-${index}`} className="border-l-2 border-primary/20 pl-3 py-1">
                      <p className="text-sm font-medium line-clamp-1">{c.title || "Untitled"}</p>
                      <p className="text-xs text-muted-foreground line-clamp-2">{c.description || "No description"}</p>
                    </div>
                  ))}
                  {faq.contents.length > 3 && (
                    <p className="text-xs text-muted-foreground italic pt-1">
                      +{faq.contents.length - 3} more question(s)
                    </p>
                  )}
                </div>
              </CardContent>

              <CardFooter className="flex gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => setViewFaq(faq)}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  View
                </Button>
                {canEdit("web_policies") && <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => setEditFaq(faq)}
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>}
                {canDelete("web_policies") && <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDeleteId(faq.id)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* View Dialog */}
      <Dialog open={!!viewFaq} onOpenChange={(open) => !open && setViewFaq(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              {viewFaq?.title}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            {viewFaq?.contents.map((c, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-2">
                <h4 className="font-semibold text-sm">{c.title || "Untitled"}</h4>
                <p className="text-sm text-muted-foreground">{c.description || "No description"}</p>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      {editFaq && (
        <FAQForm
          onSave={handleUpdate}
          initialData={editFaq}
          isEdit
          onClose={() => setEditFaq(null)}
        />
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete FAQ?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this FAQ and all its questions. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
