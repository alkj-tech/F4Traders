import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Edit, Trash2, MapPin, ArrowLeft } from "lucide-react";
import { Navigate, useNavigate } from "react-router-dom";
import { toast } from "sonner";

export default function MyAddresses() {
  const [addresses, setAddresses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<any>(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    street: "",
    city: "",
    state: "",
    pincode: "",
    is_default: false,
  });

  useEffect(() => {
    if (user) {
      fetchAddresses();
    }
  }, [user]);

  const fetchAddresses = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("user_addresses")
        .select("*")
        .eq("user_id", user.id)
        .order("is_default", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAddresses(data || []);
    } catch (error) {
      console.error("Error fetching addresses:", error);
      toast.error("Failed to load addresses");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // LOGIC FIX: If user is setting this address as default,
      // we must first unset any existing default address for this user.
      if (formData.is_default) {
        const { error: resetError } = await supabase
          .from("user_addresses")
          .update({ is_default: false })
          .eq("user_id", user!.id);

        if (resetError) throw resetError;
      }

      if (editingAddress) {
        const { error } = await supabase
          .from("user_addresses")
          .update(formData)
          .eq("id", editingAddress.id);

        if (error) throw error;
        toast.success("Address updated successfully");
      } else {
        const { error } = await supabase
          .from("user_addresses")
          .insert({ ...formData, user_id: user!.id });

        if (error) throw error;
        toast.success("Address added successfully");
      }

      setIsDialogOpen(false);
      resetForm();
      fetchAddresses();
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Failed to save address");
    }
  };

  const deleteAddress = async (id: string) => {
    if (!confirm("Are you sure you want to delete this address?")) return;

    try {
      const { error } = await supabase
        .from("user_addresses")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Address deleted");
      fetchAddresses();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete address");
    }
  };

  const resetForm = () => {
    setFormData({
      full_name: "",
      phone: "",
      street: "",
      city: "",
      state: "",
      pincode: "",
      is_default: false,
    });
    setEditingAddress(null);
  };

  const openEditDialog = (address: any) => {
    setEditingAddress(address);
    setFormData({
      full_name: address.full_name,
      phone: address.phone,
      street: address.street,
      city: address.city,
      state: address.state,
      pincode: address.pincode,
      is_default: address.is_default,
    });
    setIsDialogOpen(true);
  };

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-5xl">
        {/* Back Button & Header */}
        <div className="flex flex-col gap-6 mb-8">
          <Button
            variant="ghost"
            className="w-fit -ml-2 hover:bg-transparent hover:underline px-2 font-medium"
            onClick={() => navigate("/account")}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Account
          </Button>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              My Addresses
            </h1>
            <Button
              onClick={() => {
                resetForm();
                setIsDialogOpen(true);
              }}
              className="w-full sm:w-auto"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Address
            </Button>
          </div>
        </div>

        {/* Address List */}
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">
            Loading addresses...
          </div>
        ) : addresses.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-16 text-center">
              <div className="bg-muted/50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No addresses found</h3>
              <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                Add an address to speed up your checkout process.
              </p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Address
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {addresses.map((address) => (
              <Card key={address.id} className="relative group overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base font-semibold truncate pr-6">
                      {address.full_name}
                    </CardTitle>
                    {address.is_default && (
                      <Badge
                        variant="secondary"
                        className="shrink-0 bg-primary/10 text-primary hover:bg-primary/20"
                      >
                        Default
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1.5 text-sm text-muted-foreground mb-4">
                    <p className="line-clamp-2 min-h-[2.5rem]">
                      {address.street}
                    </p>
                    <p>
                      {address.city}, {address.state} - {address.pincode}
                    </p>
                    <p className="pt-2 font-medium text-foreground">
                      Phone: {address.phone}
                    </p>
                  </div>
                  <div className="flex gap-3 pt-2 border-t mt-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex-1 h-9"
                      onClick={() => openEditDialog(address)}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex-1 h-9 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => deleteAddress(address.id)}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Modal Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="text-xl">
                {editingAddress ? "Edit Address" : "Add New Address"}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-5 pt-4">
              {/* Full Name & Phone - Stacks on Mobile, Grid on Desktop */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="full_name">Full Name *</Label>
                  <Input
                    id="full_name"
                    value={formData.full_name}
                    onChange={(e) =>
                      setFormData({ ...formData, full_name: e.target.value })
                    }
                    placeholder="e.g. John Doe"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    placeholder="e.g. 9876543210"
                    required
                  />
                </div>
              </div>

              {/* Street Address */}
              <div className="space-y-2">
                <Label htmlFor="street">Street Address *</Label>
                <Input
                  id="street"
                  value={formData.street}
                  onChange={(e) =>
                    setFormData({ ...formData, street: e.target.value })
                  }
                  placeholder="House No, Building, Street Area"
                  required
                />
              </div>

              {/* City, State, Pincode - Responsive Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="space-y-2 col-span-1">
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) =>
                      setFormData({ ...formData, city: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2 col-span-1">
                  <Label htmlFor="state">State *</Label>
                  <Input
                    id="state"
                    value={formData.state}
                    onChange={(e) =>
                      setFormData({ ...formData, state: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2 col-span-2 sm:col-span-1">
                  <Label htmlFor="pincode">Pincode *</Label>
                  <Input
                    id="pincode"
                    value={formData.pincode}
                    onChange={(e) =>
                      setFormData({ ...formData, pincode: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              {/* Switch for Default Address */}
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label
                    htmlFor="is_default"
                    className="text-base font-medium cursor-pointer"
                  >
                    Set as Default
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Use this address for checkout automatically
                  </p>
                </div>
                <Switch
                  id="is_default"
                  checked={formData.is_default}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, is_default: checked })
                  }
                />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  className="sm:w-1/2"
                >
                  Cancel
                </Button>
                <Button type="submit" className="sm:w-1/2">
                  {editingAddress ? "Update Address" : "Save Address"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </main>
      <Footer />
    </div>
  );
}
