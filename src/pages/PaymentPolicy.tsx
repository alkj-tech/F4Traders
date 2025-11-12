import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { AnnouncementBar } from "@/components/AnnouncementBar";

export default function PaymentPolicy() {
  return (
    <div className="min-h-screen flex flex-col">
      <AnnouncementBar />
      <Header />
      <main className="flex-1 container mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-8">Payment Policy</h1>
        
        <div className="prose max-w-none space-y-6">
          <section>
            <h2 className="text-2xl font-semibold mb-4">Accepted Payment Methods</h2>
            <p>We accept the following payment methods for a seamless shopping experience:</p>
            <ul className="list-disc pl-6 mt-2">
              <li>Credit Cards (Visa, MasterCard, American Express)</li>
              <li>Debit Cards</li>
              <li>Net Banking</li>
              <li>UPI (Google Pay, PhonePe, Paytm, etc.)</li>
              <li>Wallets (Paytm, PhonePe, Amazon Pay)</li>
              <li>Cash on Delivery (COD)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Secure Payments</h2>
            <p>All online payments are processed through Razorpay, India's leading payment gateway. Your payment information is encrypted and secure.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Prepaid Benefits</h2>
            <p>Get free shipping on all prepaid orders! Pay online and save on delivery charges.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Cash on Delivery</h2>
            <p>COD is available for most pin codes. Additional charges may apply for COD orders.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Payment Confirmation</h2>
            <p>You will receive a payment confirmation email immediately after successful payment. If you don't receive it within 30 minutes, please contact us.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Refund Policy</h2>
            <p>Refunds for returned items will be processed within 7-10 business days to the original payment method.</p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
