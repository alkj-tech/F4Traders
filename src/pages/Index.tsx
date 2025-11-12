import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { AnnouncementBar } from "@/components/AnnouncementBar";
import { FeaturedCategories } from "@/components/FeaturedCategories";
import { FeaturedProducts } from "@/components/FeaturedProducts";
import { WhyChooseUs } from "@/components/WhyChooseUs";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <AnnouncementBar />
      <Header />
      <main className="flex-1">
        <FeaturedCategories />
        <FeaturedProducts />
        <WhyChooseUs />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
