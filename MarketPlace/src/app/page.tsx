// Home Page
// Main landing page for the marketplace

import { ProductList } from '../components/product/ProductList';
import { HeroSection } from '../components/sections/HeroSection';
import { CTASection } from '../components/sections/CTASection';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <HeroSection />

      {/* Featured Products Section */}
      <section className="py-16">
        <div className="container-main">
          <div className="text-center mb-12">
            <h2 className="text-responsive-xl font-bold text-gray-900 mb-4">
              Featured Products
            </h2>
            <p className="text-responsive text-gray-600 max-w-2xl mx-auto">
              Discover the most popular and trending products on our marketplace
            </p>
          </div>
          
          <ProductList 
            searchParams={{ 
              limit: 8 
            }}
          />
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 bg-gray-50">
        <div className="container-main">
          <div className="text-center mb-12">
            <h2 className="text-responsive-xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-responsive text-gray-600 max-w-2xl mx-auto">
              Simple steps to buy and sell on our marketplace
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-600">1</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Create Account</h3>
              <p className="text-gray-600">
                Sign up for free and verify your account to start buying and selling
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-600">2</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Browse or List</h3>
              <p className="text-gray-600">
                Browse products from sellers or list your own items for sale
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-600">3</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Secure Transaction</h3>
              <p className="text-gray-600">
                Complete secure transactions with buyer and seller protection
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <CTASection />
    </main>
  );
}