import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

export default function AdminSettings() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const [settings, setSettings] = useState({
    gst_percentage: "",
    cgst_percentage: "",
    site_name: "",
    support_email: "",
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    const { data } = await supabase.from("settings").select("*");

    if (data) {
      const settingsObj: any = {};
      data.forEach((item) => {
        settingsObj[item.key] = item.value;
      });
      setSettings({
        gst_percentage: settingsObj.gst_percentage || "",
        cgst_percentage: settingsObj.cgst_percentage || "",
        site_name: settingsObj.site_name || "",
        support_email: settingsObj.support_email || "",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const updates = Object.entries(settings).map(([key, value]) => ({
        key,
        value,
      }));

      for (const update of updates) {
        const { error } = await supabase
          .from("settings")
          .upsert({ key: update.key, value: update.value }, { onConflict: "key" });

        if (error) throw error;
      }

      toast({ title: "Settings updated successfully" });
    } catch (error: any) {
      toast({ title: "Error updating settings", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">Site Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle>General Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Site Name</Label>
              <Input
                value={settings.site_name}
                onChange={(e) => setSettings({ ...settings, site_name: e.target.value })}
              />
            </div>

            <div>
              <Label>Support Email</Label>
              <Input
                type="email"
                value={settings.support_email}
                onChange={(e) => setSettings({ ...settings, support_email: e.target.value })}
              />
            </div>

            <div>
              <Label>GST Percentage (%)</Label>
              <Input
                type="number"
                step="0.01"
                value={settings.gst_percentage}
                onChange={(e) => setSettings({ ...settings, gst_percentage: e.target.value })}
              />
            </div>

            <div>
              <Label>CGST Percentage (%)</Label>
              <Input
                type="number"
                step="0.01"
                value={settings.cgst_percentage}
                onChange={(e) => setSettings({ ...settings, cgst_percentage: e.target.value })}
              />
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Saving..." : "Save Settings"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
