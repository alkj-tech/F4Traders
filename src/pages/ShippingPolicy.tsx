import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { AnnouncementBar } from "@/components/AnnouncementBar";

export default function ShippingPolicy() {
  return (
    <div className="min-h-screen flex flex-col">
      <AnnouncementBar />
      <Header />
      <main className="flex-1 container mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-8">Shipping Policy</h1>
        
        <div className="prose max-w-none space-y-6">
          <section>
            <h2 className="text-2xl font-semibold mb-4">Free Shipping</h2>
            <p>We offer free shipping on all prepaid orders across India. No minimum order value required!</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Delivery Timeline</h2>
            <p>Orders are typically delivered within 5-7 business days for most locations in India.</p>
            <ul className="list-disc pl-6 mt-2">
              <li>Metro cities: 3-5 business days</li>
              <li>Other cities: 5-7 business days</li>
              <li>Remote areas: 7-10 business days</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Order Tracking</h2>
            <p>Once your order is shipped, you will receive a tracking number via email and SMS. You can track your order using our order tracking page.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Cash on Delivery</h2>
            <p>We accept Cash on Delivery (COD) for orders. COD charges may apply depending on the order value.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Shipping Partners</h2>
            <p>We partner with leading courier services to ensure safe and timely delivery of your orders.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Contact Us</h2>
            <p>For any shipping-related queries, please contact us at support@7kicks.in or call +91-XXXXXXXXXX</p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
