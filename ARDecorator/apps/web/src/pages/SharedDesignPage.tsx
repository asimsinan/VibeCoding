import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Loading } from '../components/Loading';
import { sharedApi, type SharedDesign } from '../lib/api';

export default function SharedDesignPage() {
  const { token } = useParams<{ token: string }>();
  const [sharedDesign, setSharedDesign] = useState<SharedDesign | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (token) {
      loadSharedDesign(token);
    }
  }, [token]);

  const loadSharedDesign = async (shareToken: string) => {
    try {
      setLoading(true);
      const data = await sharedApi.getByToken(shareToken);
      setSharedDesign(data);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Design not found or expired');
    } finally {
      setLoading(false);
    }
  };

  const totalCost = sharedDesign?.design?.placedFurniture?.reduce(
    (sum, pf) => sum + pf.furnitureItem.price,
    0
  ) || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <Link to="/" className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              AR Home Decorator
            </Link>
            <div className="flex gap-4">
              <Link to="/login">
                <Button variant="outline">Login</Button>
              </Link>
              <Link to="/register">
                <Button>Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {loading && (
          <div className="flex justify-center items-center py-12">
            <Loading size="lg" />
          </div>
        )}

        {error && (
          <Card className="p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Design Not Found</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <Link to="/">
              <Button>Go to Homepage</Button>
            </Link>
          </Card>
        )}

        {sharedDesign && !loading && !error && (
          <div className="space-y-6">
            {/* Header */}
            <Card className="p-8 text-center">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {sharedDesign.design.name}
              </h1>
              <p className="text-gray-600">Shared design • Viewed {sharedDesign.viewCount} times</p>
            </Card>

            {/* Room Photo */}
            <Card className="overflow-hidden">
              <div className="aspect-video bg-gray-100">
                <img
                  src={sharedDesign.design.roomPhoto.url}
                  alt="Room"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/1200x675?text=Room+Photo';
                  }}
                />
              </div>
            </Card>

            {/* Design Details */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Stats */}
              <Card className="p-6">
                <h2 className="text-xl font-bold mb-4">Design Details</h2>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Furniture Items:</span>
                    <span className="font-bold">{sharedDesign.design.placedFurniture.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Cost:</span>
                    <span className="font-bold">${totalCost.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Views:</span>
                    <span className="font-bold">{sharedDesign.viewCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Expires:</span>
                    <span className="font-bold">
                      {new Date(sharedDesign.expiresAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </Card>

              {/* Actions */}
              <Card className="p-6">
                <h2 className="text-xl font-bold mb-4">Want to create your own?</h2>
                <p className="text-gray-600 mb-4">
                  Sign up for free to create and share your own room designs with AR technology.
                </p>
                <div className="flex gap-3">
                  <Link to="/register" className="flex-1">
                    <Button className="w-full">Get Started</Button>
                  </Link>
                  <Link to="/catalog" className="flex-1">
                    <Button variant="outline" className="w-full">View Catalog</Button>
                  </Link>
                </div>
              </Card>
            </div>

            {/* Furniture List */}
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4">Furniture in This Design</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {sharedDesign.design.placedFurniture.map((pf, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <img
                      src={pf.furnitureItem.thumbnailUrl}
                      alt={pf.furnitureItem.name}
                      className="w-16 h-16 object-cover rounded"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/64';
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{pf.furnitureItem.name}</p>
                      <p className="text-sm text-gray-600">{pf.furnitureItem.category}</p>
                      <p className="text-sm font-bold">${pf.furnitureItem.price.toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
