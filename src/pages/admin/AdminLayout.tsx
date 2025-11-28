import { useState } from "react";
import { Navigate, Outlet, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { LogOut, Home, Menu } from "lucide-react";
import { AdminSidebar } from "@/components/AdminSidebar";

export default function AdminLayout() {
  const { user, isAdmin, loading, signOut } = useAuth();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  if (!user || !isAdmin) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="flex h-screen w-full bg-muted/10 overflow-hidden">
      {/* ---------------- DESKTOP SIDEBAR ---------------- */}
      {/* Hidden on mobile, visible on large screens (lg) */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 bg-background border-r shrink-0">
        <div className="h-16 flex items-center px-6 border-b">
          <h2 className="text-xl font-bold tracking-tight">Admin Panel</h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          <AdminSidebar />
        </div>
      </aside>

      {/* ---------------- MAIN CONTENT AREA ---------------- */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* HEADER */}
        <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 h-16 shrink-0">
          <div className="flex h-full items-center px-4 lg:px-6 gap-4">
            {/* ---------------- MOBILE MENU TRIGGER ---------------- */}
            {/* Visible on mobile, hidden on large screens */}
            <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden -ml-2">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>

              <SheetContent side="left" className="w-[280px] p-0">
                <SheetHeader className="p-6 border-b text-left">
                  <SheetTitle>Admin Panel</SheetTitle>
                </SheetHeader>
                <div className="py-2">
                  {/* Pass setIsMobileOpen(false) so menu closes when a link is clicked */}
                  <AdminSidebar onNavigate={() => setIsMobileOpen(false)} />
                </div>
              </SheetContent>
            </Sheet>

            {/* HEADER ACTIONS */}
            <div className="flex-1 flex items-center justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="hidden sm:flex"
              >
                <Link to="/">
                  <Home className="h-4 w-4 mr-2" />
                  <span className="hidden md:inline">View Store</span>
                </Link>
              </Button>

              <Button variant="outline" size="sm" onClick={signOut}>
                <LogOut className="h-4 w-4 mr-2" />
                <span className="hidden md:inline">Sign Out</span>
              </Button>
            </div>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto p-4 lg:p-8 max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
