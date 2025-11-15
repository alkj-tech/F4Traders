import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export default function Stock() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    const { data } = await supabase
      .from('products')
      .select('*, category:categories(*)')
      .order('created_at', { ascending: false });

    setProducts(data || []);
    setLoading(false);
  };

  const updateStock = async (productId: string, newStock: number) => {
    setUpdating(productId);
    
    const { error } = await supabase
      .from('products')
      .update({ stock: newStock })
      .eq('id', productId);

    if (error) {
      toast.error('Failed to update stock');
    } else {
      toast.success('Stock updated successfully');
      fetchProducts();
    }
    
    setUpdating(null);
  };

  const handleStockChange = (productId: string, value: string) => {
    const stock = parseInt(value) || 0;
    if (stock < 0) return;
    
    setProducts(products.map(p => 
      p.id === productId ? { ...p, stock } : p
    ));
  };

  if (loading) {
    return <div className="p-8">Loading products...</div>;
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Stock Management</h1>
        <p className="text-muted-foreground">Manage inventory levels for all products</p>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Image</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Current Stock</TableHead>
              <TableHead>Update Stock</TableHead>
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
                      src={images[0] || '/placeholder.svg'}
                      alt={product.title}
                      className="w-16 h-16 object-cover rounded"
                    />
                  </TableCell>
                  <TableCell className="font-medium">{product.title}</TableCell>
                  <TableCell>{product.category?.name || 'N/A'}</TableCell>
                  <TableCell>
                    <span className={product.stock <= 10 ? 'text-red-600 font-semibold' : ''}>
                      {product.stock} units
                    </span>
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min="0"
                      value={product.stock}
                      onChange={(e) => handleStockChange(product.id, e.target.value)}
                      className="w-24"
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      onClick={() => updateStock(product.id, product.stock)}
                      disabled={updating === product.id}
                      size="sm"
                    >
                      {updating === product.id ? 'Updating...' : 'Update'}
                    </Button>
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
