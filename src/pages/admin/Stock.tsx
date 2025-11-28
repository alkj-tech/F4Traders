import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

// Types for our variant structure
type VariantStock = {
  size: string;
  color: string;
  stock: number;
};

export default function Stock() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    const { data } = await supabase
      .from("products")
      .select("*, category:categories(*)")
      .order("created_at", { ascending: false });

    setProducts(data || []);
    setLoading(false);
  };

  // Logic to handle saving granular stock
  const handleVariantUpdate = async (
    productId: string,
    variants: VariantStock[]
  ) => {
    // 1. Calculate total stock from all variants
    const totalStock = variants.reduce((sum, v) => sum + (v.stock || 0), 0);

    // 2. Update both the JSON column (details) and the integer column (total)
    const { error } = await supabase
      .from("products")
      .update({
        variant_stock: variants,
        stock: totalStock,
      })
      .eq("id", productId);

    if (error) {
      toast.error("Failed to update stock");
    } else {
      toast.success("Stock updated successfully");
      fetchProducts(); // Refresh UI
    }
  };

  if (loading) {
    return <div className="p-8">Loading products...</div>;
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Stock Management</h1>
        <p className="text-muted-foreground">
          Manage inventory levels by Size and Color
        </p>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Image</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Variations</TableHead>
              <TableHead>Total Stock</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => {
              const images = product.images || [];
              return (
                <TableRow key={product.id}>
                  <TableCell>
                    <img
                      src={images[0] || "/placeholder.svg"}
                      alt={product.title}
                      className="w-16 h-16 object-cover rounded"
                    />
                  </TableCell>
                  <TableCell className="font-medium">
                    <div>{product.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {product.prod_id}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <div className="text-xs">
                        Sizes: {product.sizes?.join(", ") || "N/A"}
                      </div>
                      <div className="text-xs">
                        Colors: {product.colors?.join(", ") || "N/A"}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={product.stock <= 5 ? "destructive" : "secondary"}
                    >
                      {product.stock} Units
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {/* Replaced simple input with a Manager Dialog */}
                    <StockManagerDialog
                      product={product}
                      onSave={handleVariantUpdate}
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

// --- Sub-Component for the Modal Dialog ---

function StockManagerDialog({
  product,
  onSave,
}: {
  product: any;
  onSave: (id: string, v: VariantStock[]) => Promise<void>;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [variants, setVariants] = useState<VariantStock[]>([]);
  const [saving, setSaving] = useState(false);

  // Initialize variants when dialog opens
  useEffect(() => {
    if (isOpen) {
      initializeVariants();
    }
  }, [isOpen]);

  const initializeVariants = () => {
    const existingStock: VariantStock[] = product.variant_stock || [];
    const sizes = product.sizes || [];
    const colors = product.colors || [];

    // If no sizes/colors defined, treat as single generic item
    if (sizes.length === 0 && colors.length === 0) {
      setVariants([
        { size: "Standard", color: "Standard", stock: product.stock || 0 },
      ]);
      return;
    }

    const combinations: VariantStock[] = [];

    // Create Cartesian Product (All sizes x All colors)
    sizes.forEach((size: string) => {
      colors.forEach((color: string) => {
        // Check if we already have saved stock for this combo
        const existing = existingStock.find(
          (v) => v.size === size && v.color === color
        );
        combinations.push({
          size,
          color,
          stock: existing ? existing.stock : 0,
        });
      });
    });

    setVariants(combinations);
  };

  const handleStockChange = (idx: number, val: string) => {
    const newStock = parseInt(val) || 0;
    const updated = [...variants];
    updated[idx].stock = newStock;
    setVariants(updated);
  };

  const handleSave = async () => {
    setSaving(true);
    await onSave(product.id, variants);
    setSaving(false);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Manage Stock
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Stock: {product.title}</DialogTitle>
        </DialogHeader>

        <div className="py-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Size</TableHead>
                <TableHead>Color</TableHead>
                <TableHead>Stock Level</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {variants.map((variant, idx) => (
                <TableRow key={`${variant.size}-${variant.color}`}>
                  <TableCell className="font-medium">{variant.size}</TableCell>
                  <TableCell>{variant.color}</TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min="0"
                      value={variant.stock}
                      onChange={(e) => handleStockChange(idx, e.target.value)}
                      className="w-32"
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
