import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { AnnouncementBar } from "@/components/AnnouncementBar";

export default function ReturnPolicy() {
  return (
    <div className="min-h-screen flex flex-col">
      <AnnouncementBar />
      <Header />
      <main className="flex-1 container mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-8">Return and Refund Policy</h1>
        
        <div className="prose max-w-none space-y-6">
          <section>
            <h2 className="text-2xl font-semibold mb-4">3 Days Easy Replacement</h2>
            <p>We offer a hassle-free 3-day replacement policy from the date of delivery. If you're not satisfied with your purchase, you can request a replacement within 3 days.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Eligibility for Returns</h2>
            <p>To be eligible for a return, your item must be:</p>
            <ul className="list-disc pl-6 mt-2">
              <li>Unused and in the same condition that you received it</li>
              <li>In the original packaging with all tags intact</li>
              <li>Accompanied by the original invoice</li>
              <li>Not damaged or worn</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Non-Returnable Items</h2>
            <p>The following items cannot be returned:</p>
            <ul className="list-disc pl-6 mt-2">
              <li>Items marked as "Final Sale"</li>
              <li>Items that show signs of wear or damage</li>
              <li>Items without original packaging or tags</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Return Process</h2>
            <ol className="list-decimal pl-6 mt-2">
              <li>Contact us at support@7kicks.in within 3 days of delivery</li>
              <li>Provide your order number and reason for return</li>
              <li>Our team will arrange a pickup from your location</li>
              <li>Once received and inspected, we'll process your replacement</li>
            </ol>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Refunds</h2>
            <p>Refunds will be processed within 7-10 business days after we receive and inspect the returned item. The refund will be credited to your original payment method.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Exchanges</h2>
            <p>We offer size exchanges for the same product. If you need a different size, please contact us immediately after receiving your order.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Contact Us</h2>
            <p>For any return or refund queries, please contact us at support@7kicks.in or call +91-XXXXXXXXXX</p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
