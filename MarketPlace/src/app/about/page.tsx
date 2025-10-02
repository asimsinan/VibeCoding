// About Page
// Information about the marketplace

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <section className="bg-white border-b">
        <div className="container-main py-8">
          <div className="text-center">
            <h1 className="text-responsive-2xl font-bold text-gray-900 mb-4">
              About MarketPlace
            </h1>
            <p className="text-responsive text-gray-600 max-w-2xl mx-auto">
              Learn more about our mission to connect buyers and sellers worldwide
            </p>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-16">
        <div className="container-main">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow-md p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Our Mission
              </h2>
              <p className="text-gray-600 mb-8 leading-relaxed">
                MarketPlace is dedicated to creating a safe, secure, and user-friendly platform 
                where people can buy and sell products with confidence. We believe in connecting 
                communities through commerce while maintaining the highest standards of security 
                and customer service.
              </p>
              
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                How It Works
              </h2>
              <div className="grid md:grid-cols-3 gap-8 mb-8">
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-blue-600">1</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Browse & Search</h3>
                  <p className="text-gray-600 text-sm">
                    Discover products from verified sellers with our advanced search and filtering tools.
                  </p>
                </div>
                
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-blue-600">2</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Secure Payment</h3>
                  <p className="text-gray-600 text-sm">
                    Complete transactions safely with our encrypted payment processing system.
                  </p>
                </div>
                
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-blue-600">3</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Fast Delivery</h3>
                  <p className="text-gray-600 text-sm">
                    Receive your purchases quickly with our integrated shipping and tracking system.
                  </p>
                </div>
              </div>
              
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Why Choose MarketPlace?
              </h2>
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">For Buyers</h3>
                  <ul className="space-y-3 text-gray-600">
                    <li className="flex items-start">
                      <span className="text-green-500 mr-2">✓</span>
                      Verified sellers and authentic products
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-500 mr-2">✓</span>
                      Secure payment with buyer protection
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-500 mr-2">✓</span>
                      Easy returns and refunds
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-500 mr-2">✓</span>
                      24/7 customer support
                    </li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">For Sellers</h3>
                  <ul className="space-y-3 text-gray-600">
                    <li className="flex items-start">
                      <span className="text-green-500 mr-2">✓</span>
                      Reach thousands of potential customers
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-500 mr-2">✓</span>
                      Easy product listing and management
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-500 mr-2">✓</span>
                      Competitive fees and fast payouts
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-500 mr-2">✓</span>
                      Marketing tools and analytics
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}