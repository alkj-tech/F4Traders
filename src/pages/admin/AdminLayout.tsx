import { Navigate, Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { LayoutDashboard, Package, ShoppingCart, Settings, FolderTree, LogOut, Star, Package2 } from 'lucide-react';

export default function AdminLayout() {
  const { user, isAdmin, loading, signOut } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!user || !isAdmin) {
    return <Navigate to="/auth" replace />;
  }

  const navItems = [
    { path: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/admin/products', icon: Package, label: 'Products' },
    { path: '/admin/categories', icon: FolderTree, label: 'Categories' },
    { path: '/admin/orders', icon: ShoppingCart, label: 'Orders' },
    { path: '/admin/reviews', icon: Star, label: 'Reviews' },
    { path: '/admin/stock', icon: Package2, label: 'Stock Management' },
    { path: '/admin/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <div className="min-h-screen bg-muted/10">
      <div className="flex h-screen">
        <aside className="w-64 bg-card border-r">
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gradient">Admin Panel</h2>
          </div>
          <nav className="space-y-1 px-3">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link key={item.path} to={item.path}>
                  <Button
                    variant={isActive ? 'secondary' : 'ghost'}
                    className="w-full justify-start"
                  >
                    <Icon className="mr-2 h-4 w-4" />
                    {item.label}
                  </Button>
                </Link>
              );
            })}
          </nav>
          <div className="absolute bottom-4 left-4 right-4">
            <Button variant="outline" className="w-full" onClick={signOut}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </aside>
        
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto p-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
