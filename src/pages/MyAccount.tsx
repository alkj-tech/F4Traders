import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronRight, User, ArrowLeft, MoreVertical } from "lucide-react";
import { Link, Navigate, useNavigate } from "react-router-dom";

export default function MyAccount() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Whatsapp share link
  const whatsappShare = `https://wa.me/?text=Check%20out%20this%20awesome%20store:%20${encodeURIComponent(
    "https://yourwebsite.com"
  )}`;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <main className="flex-1 max-w-lg mx-auto w-full relative">
        {/* TOP BAR */}
        <div className="flex items-center justify-between px-4 py-3 bg-white border-b relative">
          <Button onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>

          <h2 className="font-medium text-gray-900">My Account</h2>

          {/* 3 DOT MENU BUTTON */}
          <div className="relative">
            <Button onClick={() => setMenuOpen(!menuOpen)}>
              <MoreVertical className="h-5 w-5" />
            </Button>

            {/* DROPDOWN MENU */}
            {menuOpen && (
              <div className="absolute right-0 mt-2 w-36 bg-white shadow-md border rounded-md z-50">
                <button
                  onClick={() => {
                    signOut();
                    setMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                >
                  signOut
                </button>
              </div>
            )}
          </div>
        </div>

        {/* USER CARD */}
        <div className="bg-white px-4 py-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 bg-gray-200 rounded-full flex items-center justify-center">
              <User className="h-6 w-6 text-gray-600" />
            </div>

            <div>
              <p className="font-semibold text-gray-800 text-sm">
                Hi,{" "}
                {user?.user_metadata?.full_name || user?.email?.split("@")[0]}
              </p>
              <p className="text-gray-600 text-xs">
                {user?.phone || "No phone added"}
              </p>
            </div>
          </div>

          <ChevronRight className="h-5 w-5 text-gray-500" />
        </div>

        {/* MENU CARD */}
        <Card className="mt-3 rounded-none border-t border-b">
          <MenuItem title="Orders" to="/my-orders" />
          <MenuItem title="Addresses" to="/my-addresses" />
          <MenuItem title="Reviews & Ratings" to="/reviews" />

          {/* 🔥 WHATSAPP SHARE DIRECT LINK */}
          <a
            href={whatsappShare}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between px-4 py-4 border-b text-sm"
          >
            <span className="text-gray-800">Share Store with Friends</span>
            <ChevronRight className="h-5 w-5 text-gray-500" />
          </a>
        </Card>

        <div className="h-24" />
      </main>

      <Footer />
    </div>
  );
}

interface MenuItemProps {
  title: string;
  to: string;
}

function MenuItem({ title, to }: MenuItemProps) {
  return (
    <Link
      to={to}
      className="flex items-center justify-between px-4 py-4 border-b last:border-none"
    >
      <span className="text-gray-800 text-sm">{title}</span>
      <ChevronRight className="h-5 w-5 text-gray-500" />
    </Link>
  );
}
