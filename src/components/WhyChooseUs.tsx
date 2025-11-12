import { Shield, Truck, CreditCard, HeadphonesIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const features = [
  {
    icon: Shield,
    title: "100% Authentic",
    description: "All products are genuine and sourced from authorized distributors",
  },
  {
    icon: Truck,
    title: "Free Delivery",
    description: "Complimentary shipping on all orders across India",
  },
  {
    icon: CreditCard,
    title: "Secure Payments",
    description: "Safe and encrypted payment processing via Razorpay",
  },
  {
    icon: HeadphonesIcon,
    title: "24/7 Support",
    description: "Dedicated customer service to assist you anytime",
  },
];

export function WhyChooseUs() {
  return (
    <section className="py-16 md:py-24">
      <div className="container">
        <div className="text-center mb-12 space-y-4">
          <h2 className="text-3xl md:text-4xl font-bold">Why Choose F4traders?</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Your trusted partner for premium footwear
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <Card 
              key={index} 
              className="text-center border-0 bg-card hover:shadow-lg transition-all duration-300 animate-fade-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <CardContent className="pt-8 pb-6 space-y-4">
                <div className="mx-auto w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center">
                  <feature.icon className="h-8 w-8 text-accent" />
                </div>
                <h3 className="text-xl font-semibold">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
