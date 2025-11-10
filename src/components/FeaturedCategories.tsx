import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";

const categories = [
  {
    name: "Sports Shoes",
    slug: "sports",
    description: "Performance footwear for athletes",
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=300&fit=crop",
  },
  {
    name: "Casual Sneakers",
    slug: "casual",
    description: "Everyday comfort and style",
    image: "https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=400&h=300&fit=crop",
  },
  {
    name: "Formal Shoes",
    slug: "formal",
    description: "Elegance for every occasion",
    image: "https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?w=400&h=300&fit=crop",
  },
  {
    name: "Limited Edition",
    slug: "limited",
    description: "Exclusive releases",
    image: "https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb?w=400&h=300&fit=crop",
  },
];

export function FeaturedCategories() {
  return (
    <section className="py-16 md:py-24">
      <div className="container">
        <div className="text-center mb-12 space-y-4">
          <h2 className="text-3xl md:text-4xl font-bold">Shop by Category</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Find the perfect shoes for every occasion
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((category, index) => (
            <Link 
              key={category.slug} 
              to={`/categories/${category.slug}`}
              className="animate-fade-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <Card className="group overflow-hidden hover:shadow-xl transition-all duration-300 border-0 bg-card">
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={category.image}
                    alt={category.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-4 left-4 text-white">
                    <h3 className="text-xl font-bold">{category.name}</h3>
                    <p className="text-sm text-gray-200">{category.description}</p>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
