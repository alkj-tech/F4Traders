import { Navigate, Outlet, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { LogOut, Home } from 'lucide-react';
import { AdminSidebar } from '@/components/AdminSidebar';

export default function AdminLayout() {
  const { user, isAdmin, loading, signOut } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!user || !isAdmin) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen flex w-full bg-muted/10">
      
      {/* ⬇️ Admin Sidebar (Now Mobile Sheet Menu) */}
      <div className="lg:hidden">
        <AdminSidebar />
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col w-full">

        {/* HEADER */}
        <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex h-14 lg:h-16 items-center gap-4 px-4 lg:px-6">

            {/* ⬇️ Mobile Sidebar Trigger (Already included inside AdminSidebar) */}
            {/* No SidebarTrigger needed anymore */}

            <div className="flex-1 flex items-center justify-between">
              <h1 className="text-lg lg:text-xl font-bold">Admin Panel</h1>

              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" asChild className="hidden sm:flex">
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
          </div>
        </header>

        {/* MAIN CONTENT */}
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto p-4 lg:p-8 max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
