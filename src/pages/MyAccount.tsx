// Combined mobile + web UI in ONE component
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ChevronRight,
  User,
  ArrowLeft,
  MoreVertical,
  Edit2,
  Save,
} from "lucide-react";
import { Link, Navigate, useNavigate } from "react-router-dom";

export default function MyAccount() {
  // Expecting useAuth to provide { user, signOut, supabase }
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const [menuOpen, setMenuOpen] = useState(false);
  const [profile, setProfile] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openReviewModal, setOpenReviewModal] = useState(false);

  // Inline phone editing state
  const [editingPhone, setEditingPhone] = useState(false);
  const [phoneInput, setPhoneInput] = useState("");
  const [savingPhone, setSavingPhone] = useState(false);

  if (!user) return <Navigate to="/auth" replace />;

  useEffect(() => {
    if (!supabase || !user) return;

    let isMounted = true;

    const load = async () => {
      setLoading(true);
      try {
        // profiles
        const { data: profileData, error: pErr } = await supabase
          .from("profiles")
          .select("id,full_name,phone,address,avatar_url,created_at,updated_at")
          .eq("id", user.id)
          .single();

        if (pErr && pErr.code !== "PGRST116") {
          // PGRST116 = no rows? different providers differ; ignore if no row
          console.error("profiles fetch error", pErr);
        }

        // user addresses
        const { data: addressData, error: aErr } = await supabase
          .from("user_addresses")
          .select(
            "id,user_id,full_name,phone,street,city,state,pincode,is_default,created_at,updated_at"
          )
          .eq("user_id", user.id);

        if (aErr) console.error("addresses fetch error", aErr);

        // user reviews
        const { data: reviewData, error: rErr } = await supabase
          .from("reviews")
          .select(
            "id,product_id,user_id,rating,comment,created_at,updated_at,status,moderated_at,moderated_by"
          )
          .eq("user_id", user.id);

        if (rErr) console.error("reviews fetch error", rErr);

        if (!isMounted) return;
        setProfile(profileData || null);
        setAddresses(addressData || []);
        setReviews(reviewData || []);

        // prefill phone input
        setPhoneInput((profileData && profileData.phone) || user.phone || "");
      } catch (err) {
        console.error(err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    load();

    return () => {
      isMounted = false;
    };
  }, [supabase, user]);

  const whatsappShare = `https://wa.me/?text=Check%20out%20this%20awesome%20store:%20${encodeURIComponent(
    "https://yourwebsite.com"
  )}`;

  const handleSavePhone = async () => {
    if (!supabase || !user) return;
    setSavingPhone(true);
    try {
      // Try update first; if no row exists, upsert will create
      const payload = { id: user.id, phone: phoneInput };

      // upsert in current types expects an array of rows and doesn't accept 'returning'
      const { error } = await supabase.from("profiles").upsert([payload]);
      if (error) throw error;

      // refresh local profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      setProfile(profileData || null);
      setEditingPhone(false);
    } catch (err) {
      console.error("failed to save phone", err);
      // TODO: show toast / UI error
    } finally {
      setSavingPhone(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <main className="flex-1 w-full max-w-lg md:max-w-5xl mx-auto relative px-4 md:px-10">
        {/* TOP BAR */}
        <div className="flex items-center justify-between px-4 py-3 bg-white border-b md:rounded-lg md:shadow-sm md:mt-6">
          <Button onClick={() => navigate(-1)} className="hidden md:flex">
            <ArrowLeft className="h-5 w-5" />
          </Button>

          <h2 className="font-medium text-gray-900 text-base md:text-xl">
            My Account
          </h2>

          <div className="relative">
            <Button onClick={() => setMenuOpen(!menuOpen)}>
              <MoreVertical className="h-5 w-5" />
            </Button>

            {menuOpen && (
              <div className="absolute right-0 mt-2 w-36 md:w-40 bg-white shadow-md border rounded-md z-50">
                <button
                  onClick={() => {
                    signOut();
                    setMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>

        {/* USER CARD (mobile + web responsive) */}
        <div className="bg-white px-4 md:px-6 py-4 md:py-6 border-b md:border rounded-none md:rounded-lg md:shadow-sm mt-0 md:mt-4 flex items-center justify-between">
          <div className="flex items-center gap-3 md:gap-4">
            <div className="h-12 w-12 md:h-14 md:w-14 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
              {profile?.avatar_url ? (
                // eslint-disable-next-line
                <img
                  src={profile.avatar_url}
                  alt="avatar"
                  className="h-full w-full object-cover"
                />
              ) : (
                <User className="h-6 w-6 md:h-7 md:w-7 text-gray-600" />
              )}
            </div>

            <div>
              <p className="font-semibold text-gray-800 text-sm md:text-base">
                Hi, {profile?.full_name || user?.email?.split("@")[0]}
              </p>

              <div className="flex items-center gap-2 mt-1">
                {editingPhone ? (
                  <>
                    <input
                      value={phoneInput}
                      onChange={(e) => setPhoneInput(e.target.value)}
                      className="border px-2 py-1 rounded text-sm"
                      placeholder="Phone number"
                    />
                    <Button onClick={handleSavePhone} disabled={savingPhone}>
                      <Save className="h-4 w-4" />
                    </Button>
                    <Button
                      onClick={() => {
                        setEditingPhone(false);
                        setPhoneInput(profile?.phone || "");
                      }}
                    >
                      Cancel
                    </Button>
                  </>
                ) : (
                  <>
                    <p className="text-gray-600 text-xs md:text-sm">
                      {profile?.phone || "No phone added"}
                    </p>
                    <Button
                      variant="ghost"
                      onClick={() => setEditingPhone(true)}
                      className="ml-2"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* <ChevronRight className="h-5 w-5 text-gray-500" /> */}
        </div>

        {/* MENU CARD */}
        <Card className="mt-3 md:mt-6 rounded-none md:rounded-lg border-t border-b md:border shadow-sm">
          <MenuItem title="Orders" to="/my-orders" />
          <MenuItem title="Addresses" to="/my-addresses" />
          <div
            onClick={() => setOpenReviewModal(!openReviewModal)}
            className="flex items-center justify-between px-4 md:px-6 py-4 border-b last:border-none text-sm hover:bg-gray-50"
          >
            <span className="text-gray-800 text-sm">Your Reviews</span>
            <ChevronRight
              className={`h-5 w-5 text-gray-500 transition-transform ${
                openReviewModal ? "rotate-90" : ""
              }`}
            />
          </div>
          <a
            href={whatsappShare}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between px-4 md:px-6 py-4 border-b last:border-none text-sm hover:bg-gray-50"
          >
            <span className="text-gray-800">Share Store with Friends</span>
            <ChevronRight className="h-5 w-5 text-gray-500" />
          </a>
        </Card>

        {/* QUICK DATA PREVIEW: Addresses & Reviews */}
        <div className="max-w-lg md:max-w-5xl mx-auto mt-6 px-0 md:px-2">
          <Card className="mb-4">
            <div className="px-4 py-3">
              <h3 className="font-semibold">Saved Addresses</h3>
              {loading ? (
                <p className="text-sm text-gray-500">Loading...</p>
              ) : addresses.length === 0 ? (
                <p className="text-sm text-gray-500">
                  No addresses found. Add one from Addresses page.
                </p>
              ) : (
                <ul className="mt-2 space-y-2">
                  {addresses.map((a) => (
                    <li key={a.id} className="text-sm border p-2 rounded">
                      <div className="flex justify-between">
                        <div>
                          <div className="font-medium">{a.full_name}</div>
                          <div className="text-xs text-gray-600">{a.phone}</div>
                          <div className="text-xs text-gray-600">
                            {a.street}, {a.city}, {a.state} - {a.pincode}
                          </div>
                        </div>
                        <div className="text-xs text-gray-500">
                          {a.is_default ? "Default" : ""}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </Card>

          {openReviewModal && (
            <Card className="transition-all duration-300 max-h-80 overflow-y-auto">
              <div className="px-4 py-3">
                <h3 className="font-semibold flex items-center justify-between">
                  Your Reviews
                  <ChevronRight
                    className={
                      openReviewModal
                        ? "h-5 w-5 text-gray-500 transform rotate-90 transition-transform duration-300"
                        : "h-5 w-5 text-gray-500 transform transition-transform duration-300"
                    }
                    onClick={() => setOpenReviewModal(false)}
                  />
                </h3>

                {loading ? (
                  <p className="text-sm text-gray-500">Loading...</p>
                ) : reviews.length === 0 ? (
                  <p className="text-sm text-gray-500">No reviews yet.</p>
                ) : (
                  <ul className="mt-2 space-y-2">
                    {reviews.map((r) => (
                      <li key={r.id} className="text-sm border p-2 rounded">
                        <div className="flex justify-between items-start gap-3">
                          <div>
                            <div className="font-medium">
                              Rating: {r.rating} / 5
                            </div>
                            <div className="text-xs text-gray-600">
                              {r.comment}
                            </div>
                            <div className="text-xs text-gray-400">
                              Status: {r.status}
                            </div>
                          </div>
                          <div className="text-xs text-gray-400">
                            {new Date(r.created_at).toLocaleString()}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </Card>
          )}
        </div>

        <div className="h-24" />
      </main>

      <Footer />
    </div>
  );
}

function MenuItem({ title, to }) {
  return (
    <Link
      to={to}
      className="flex items-center justify-between px-4 md:px-6 py-4 border-b last:border-none hover:bg-gray-50 text-sm"
    >
      <span className="text-gray-800">{title}</span>
      <ChevronRight className="h-5 w-5 text-gray-500" />
    </Link>
  );
}
