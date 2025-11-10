import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import heroBanner from "@/assets/hero-banner.jpg";

export function HeroSection() {
  return (
    <section className="relative h-[600px] md:h-[700px] overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url(${heroBanner})`,
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-transparent" />
      </div>

      {/* Content */}
      <div className="container relative h-full flex items-center">
        <div className="max-w-2xl space-y-6 animate-slide-up">
          <h1 className="text-5xl md:text-7xl font-bold text-white leading-tight">
            Step Into
            <span className="block text-gradient bg-gradient-to-r from-accent to-orange-400 bg-clip-text text-transparent">
              Premium Style
            </span>
          </h1>
          <p className="text-lg md:text-xl text-gray-200 max-w-lg">
            Discover the finest collection of branded shoes. From sports to casual, find your perfect fit.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link to="/products">
              <Button variant="hero" size="xl" className="group">
                Shop Now
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link to="/categories">
              <Button variant="outline" size="xl" className="bg-white/10 backdrop-blur-sm text-white border-white hover:bg-white hover:text-primary">
                Browse Categories
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-white/50 rounded-full flex items-start justify-center p-2">
          <div className="w-1 h-3 bg-white/50 rounded-full" />
        </div>
      </div>
    </section>
  );
}
