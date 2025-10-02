// Products Page
// Browse all products with filtering and search

import { ProductList } from '../../components/product/ProductList';

interface ProductsPageProps {
  searchParams: {
    category?: string;
    search?: string;
    limit?: string;
  };
}

export default function ProductsPage({ searchParams }: ProductsPageProps) {
  const categoryName = searchParams.category || 'All Products';

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <section className="bg-white border-b">
        <div className="container-main py-8">
          <div className="text-center">
            <h1 className="text-responsive-2xl font-bold text-gray-900 mb-4">
              {categoryName}
            </h1>
            <p className="text-responsive text-gray-600 max-w-2xl mx-auto">
              {searchParams.category 
                ? `Discover ${categoryName.toLowerCase()} from sellers around the world`
                : 'Discover amazing products from sellers around the world'
              }
            </p>
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section className="py-8">
        <div className="container-main">
          <ProductList 
            searchParams={{
              ...(searchParams.category && { category: searchParams.category }),
              ...(searchParams.search && { query: searchParams.search }),
              limit: parseInt(searchParams.limit || '20')
            }}
          />
        </div>
      </section>
    </main>
  );
}