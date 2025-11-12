import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { AnnouncementBar } from "@/components/AnnouncementBar";

export default function About() {
  return (
    <div className="min-h-screen flex flex-col">
      <AnnouncementBar />
      <Header />
      <main className="flex-1 container mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-8">About F4traders</h1>
        
        <div className="prose max-w-none space-y-6">
          <section>
            <h2 className="text-2xl font-semibold mb-4">Our Story</h2>
            <p>Welcome to F4traders - your ultimate destination for premium branded sneakers in India. We started with a simple mission: to bring authentic, high-quality footwear to sneaker enthusiasts across the country.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">What We Offer</h2>
            <p>At F4traders, we specialize in:</p>
            <ul className="list-disc pl-6 mt-2">
              <li>100% Authentic branded sneakers</li>
              <li>Latest releases from top brands</li>
              <li>Wide range of sizes and styles</li>
              <li>Competitive pricing</li>
              <li>Free shipping on prepaid orders</li>
              <li>3-day easy replacement policy</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Why Choose Us</h2>
            <p>We understand the passion sneakerheads have for their kicks. That's why we ensure:</p>
            <ul className="list-disc pl-6 mt-2">
              <li>Authenticity guarantee on all products</li>
              <li>Secure and fast delivery</li>
              <li>Hassle-free returns and exchanges</li>
              <li>Excellent customer service</li>
              <li>Regular updates on new releases</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Our Collection</h2>
            <p>Browse through our extensive collection featuring popular categories like Travis Scott, Low Dunks, Retro 4, Air Jordan's, Air Force's, and more. We constantly update our inventory with the latest drops and exclusive releases.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Customer Satisfaction</h2>
            <p>Your satisfaction is our priority. We offer cash on delivery, 3-day easy replacement, and free shipping on all prepaid orders. Our customer support team is always ready to assist you with any queries.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Connect With Us</h2>
            <p>Follow us on Instagram @F4traders for the latest updates, exclusive releases, and sneaker content. Join our community of sneaker enthusiasts!</p>
            <p className="mt-4">For any questions, reach us at support@F4traders.in or call +91-XXXXXXXXXX</p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
