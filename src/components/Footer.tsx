import { Mail, Phone, MapPin } from "lucide-react";
import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="bg-gray-100 border-t">
      <div className="container mx-auto px-6 py-10">
        {/* GRID LAYOUT */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* QUICK LINKS */}
          <div>
            <h3 className="font-semibold text-gray-800 mb-4">Quick Links</h3>
            <ul className="space-y-3 text-sm text-gray-700">
              <li>
                <Link to="/" className="hover:text-black">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/my-addresses" className="hover:text-black">
                  My Account
                </Link>
              </li>
              <li>
                <Link to="/my-orders" className="hover:text-black">
                  My Orders
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-black">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/payment-policy" className="hover:text-black">
                  Payment Policy
                </Link>
              </li>
              <li>
                <Link to="/return-policy" className="hover:text-black">
                  Return & Refund Policy
                </Link>
              </li>
              <li>
                <Link to="/shipping-policy" className="hover:text-black">
                  Shipping Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-black">
                  Terms & Conditions
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-black">
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>

          {/* CONTACT INFO */}
          <div>
            <h3 className="font-semibold text-gray-800 mb-4">Get In Touch</h3>
            <ul className="space-y-4 text-sm text-gray-700">
              <li className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-gray-600" />
                +91 1234567890
              </li>
              <li className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-gray-600" />
                <a
                  href="mailto:contact@f4traders.com"
                  className="hover:text-black"
                >
                  contact@f4traders.com
                </a>
              </li>
              <li className="flex items-center gap-3">
                <MapPin className="h-4 w-4 text-gray-600" />
                Chennai, Tamil Nadu, India
              </li>
            </ul>
          </div>

          {/* PAYMENT METHODS */}
          <div>
            <h3 className="font-semibold text-gray-800 mb-4">We Accept</h3>
            <div className="flex items-center gap-3">
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/4/41/Visa_Logo.png"
                className="h-6 bg-white p-1 rounded shadow"
                alt="Visa"
              />
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/0/04/Mastercard-logo.png"
                className="h-6 bg-white p-1 rounded shadow"
                alt="Mastercard"
              />
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/6/6f/UPI_logo.svg"
                className="h-6 bg-white p-1 rounded shadow"
                alt="UPI"
              />
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/c/cb/Rupay-Logo.png"
                className="h-6 bg-white p-1 rounded shadow"
                alt="Rupay"
              />
            </div>
          </div>

          {/* SOCIAL */}
          <div>
            <h3 className="font-semibold text-gray-800 mb-4">Social</h3>
            <a
              href="#"
              className="flex items-center gap-2 text-sm text-gray-700 hover:text-black"
            >
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/a/a5/Instagram_icon.png"
                className="h-5 w-5"
                alt="Instagram"
              />
              Instagram
            </a>
          </div>
        </div>

        {/* COPYRIGHT */}
        <div className="text-center py-5 mt-10 border-t text-sm text-gray-500">
          © {new Date().getFullYear()} F4traders. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
