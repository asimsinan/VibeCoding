import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Loading } from '../components/Loading';
import { Modal } from '../components/Modal';
import { Badge } from '../components/Badge';
import { useAuth } from '../contexts/AuthContext';
import { designsApi, roomPhotosApi } from '../lib/api';

interface Design {
  id: string;
  name: string;
  furnitureCount?: number;
  createdAt: string;
  updatedAt: string;
}

interface RoomPhoto {
  id: string;
  filename: string;
  url: string;
  status: string;
  dimensions?: { width: number; height: number };
  surfaces?: any;
  createdAt: string;
}

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [designs, setDesigns] = useState<Design[]>([]);
  const [roomPhotos, setRoomPhotos] = useState<RoomPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ id: string; type: 'design' | 'photo' } | null>(null);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<RoomPhoto | null>(null);

  useEffect(() => {
    if (user) {
      loadData();
    } else {
      navigate('/login');
    }
  }, [user, navigate]);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [designsData, photosData] = await Promise.all([
        designsApi.list(),
        roomPhotosApi.list(),
      ]);
      setDesigns(designsData);
      setRoomPhotos(photosData);
    } catch (err: any) {
      setError('Failed to load dashboard data: ' + (err.response?.data?.error?.message || err.message));
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;

    try {
      if (itemToDelete.type === 'design') {
        await designsApi.delete(itemToDelete.id);
      } else if (itemToDelete.id === 'all') {
        // Bulk delete all room photos
        const result = await roomPhotosApi.deleteAll();
        console.log(`Successfully deleted ${result.deletedCount} room photos`);
      } else {
        await roomPhotosApi.delete(itemToDelete.id);
      }
      loadData(); // Reload data after deletion
      setShowDeleteModal(false);
      setItemToDelete(null);
    } catch (err: any) {
      setError('Failed to delete item: ' + (err.response?.data?.error?.message || err.message));
      console.error(err);
    }
  };

  if (!user) {
    return null; // Should be redirected by useEffect
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse"></div>
      </div>

      {/* Navigation */}
      <nav className="bg-white/10 backdrop-blur-lg border-b border-white/20 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <Link to="/" className="flex items-center">
              <div className="inline-flex items-center justify-center w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl mr-3 shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v2H8V5z" />
                </svg>
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
                AR Home Decorator
              </span>
            </Link>
            <div className="flex gap-4 items-center">
              <span className="text-slate-300">Welcome, {user?.name}!</span>
              <Link to="/catalog">
                <Button variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-sm">Browse Catalog</Button>
              </Link>
              {user?.role === 'admin' && (
                <Link to="/admin">
                  <Button variant="secondary" className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800">Admin Panel</Button>
                </Link>
              )}
              <Button variant="ghost" onClick={handleLogout} className="text-slate-300 hover:text-white hover:bg-white/10">Logout</Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent mb-2">My Dashboard</h1>
          <p className="text-slate-300">Manage your designs and room photos</p>
        </div>

        {loading && (
          <div className="flex justify-center items-center py-12">
            <Loading size="lg" />
          </div>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-200 px-4 py-3 rounded-xl mb-8 backdrop-blur-sm">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          </div>
        )}

        {!loading && !error && (
          <div className="space-y-8">
            {/* Quick Actions */}
            <Card className="p-6 bg-gradient-to-r from-blue-500/10 to-purple-500/10 backdrop-blur-lg border border-white/20 shadow-2xl">
              <h2 className="text-2xl font-bold mb-4 text-white">Quick Actions</h2>
              <div className="flex flex-wrap gap-4">
                <Link to="/editor">
                  <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Create New Design
                  </Button>
                </Link>
                <Link to="/catalog">
                  <Button variant="outline" size="lg" className="bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-sm">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                    Browse Furniture
                  </Button>
                </Link>
              </div>
            </Card>

            {/* Designs Section */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-white">My Designs ({designs.length})</h2>
                <Link to="/editor">
                  <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">+ New Design</Button>
                </Link>
              </div>
              {designs.length === 0 ? (
                <Card className="p-8 text-center bg-white/10 backdrop-blur-lg border border-white/20 shadow-2xl">
                  <p className="text-slate-300 mb-4">You haven't created any designs yet</p>
                  <Link to="/editor">
                    <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">Create Your First Design</Button>
                  </Link>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {designs.map((design) => (
                    <Card key={design.id} className="overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:scale-105 bg-white/10 backdrop-blur-lg border border-white/20 shadow-xl">
                      <div className="p-6">
                        <h3 className="text-xl font-semibold mb-2 text-white">{design.name}</h3>
                        <p className="text-sm text-slate-300 mb-2">
                          {design.furnitureCount} furniture items
                        </p>
                        <p className="text-xs text-slate-400">
                          Last updated: {new Date(design.updatedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="px-6 pb-6 flex gap-2">
                        <Link to={`/editor/${design.id}`} className="flex-1">
                          <Button size="sm" className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">Edit</Button>
                        </Link>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => {
                            setItemToDelete({ id: design.id, type: 'design' });
                            setShowDeleteModal(true);
                          }}
                        >
                          Delete
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Room Photos Section */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-white">My Room Photos ({roomPhotos.length})</h2>
                <div className="flex gap-2">
                  {roomPhotos.length > 0 && (
                    <Button 
                      variant="danger" 
                      onClick={() => {
                        setItemToDelete({ id: 'all', type: 'photo' });
                        setShowDeleteModal(true);
                      }}
                    >
                      🗑️ Delete All ({roomPhotos.length})
                    </Button>
                  )}
                  <Link to="/editor">
                    <Button variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-sm">+ Upload Photo</Button>
                  </Link>
                </div>
              </div>
              {roomPhotos.length === 0 ? (
                <Card className="p-8 text-center bg-white/10 backdrop-blur-lg border border-white/20 shadow-2xl">
                  <p className="text-slate-300 mb-4">No room photos uploaded yet</p>
                  <Link to="/editor">
                    <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">Upload Room Photo</Button>
                  </Link>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {roomPhotos.map((photo) => (
                    <Card 
                      key={photo.id} 
                      className="overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:scale-105 cursor-pointer bg-white/10 backdrop-blur-lg border border-white/20 shadow-xl"
                      onClick={() => {
                        setSelectedPhoto(photo);
                        setShowPhotoModal(true);
                      }}
                    >
                      <div className="aspect-video bg-slate-800 relative">
                        <img
                          src={photo.url}
                          alt={photo.filename}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            console.error('Image load error for photo:', photo.id, 'URL:', photo.url);
                            (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%231e293b" width="400" height="300"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="16" fill="%2394a3b8"%3ERoom Photo%3C/text%3E%3C/svg%3E';
                          }}
                          onLoad={() => {
                            console.log('Image loaded successfully for photo:', photo.id, 'URL length:', photo.url?.length);
                          }}
                        />
                        {/* Status Badge */}
                        <div className="absolute top-2 right-2">
                          {photo.status === 'completed' && (
                            <Badge variant="success">
                              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                              Ready
                            </Badge>
                          )}
                          {photo.status === 'processing' && (
                            <Badge variant="warning">
                              <svg className="animate-spin w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Processing
                            </Badge>
                          )}
                          {photo.status === 'failed' && (
                            <Badge variant="danger">
                              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                              </svg>
                              Failed
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="p-4">
                        <p className="text-sm font-medium truncate mb-1 text-white">{photo.filename}</p>
                        <p className="text-xs text-slate-400">
                          {new Date(photo.createdAt).toLocaleDateString()}
                        </p>
                        {photo.dimensions && (
                          <p className="text-xs text-slate-400 mt-1">
                            {photo.dimensions.width} × {photo.dimensions.height}px
                          </p>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Confirm Deletion"
      >
        <p className="text-slate-300">
          {itemToDelete?.id === 'all' 
            ? `Are you sure you want to delete ALL ${roomPhotos.length} room photos? This action cannot be undone.`
            : `Are you sure you want to delete this ${itemToDelete?.type}? This action cannot be undone.`
          }
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setShowDeleteModal(false)} className="bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-sm">
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDeleteConfirm}>
            Delete
          </Button>
        </div>
      </Modal>

      {/* Room Photo Details Modal */}
      <Modal
        isOpen={showPhotoModal}
        onClose={() => {
          setShowPhotoModal(false);
          setSelectedPhoto(null);
        }}
        title="Room Photo Details"
      >
        {selectedPhoto && (
          <div className="space-y-4">
            <div className="aspect-video bg-slate-800 rounded-lg overflow-hidden">
              <img
                src={selectedPhoto.url}
                alt={selectedPhoto.filename}
                className="w-full h-full object-contain"
                onError={(e) => {
                  console.error('Modal image load error for photo:', selectedPhoto.id, 'URL:', selectedPhoto.url);
                  (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%231e293b" width="400" height="300"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="16" fill="%2394a3b8"%3EBroken Image%3C/text%3E%3C/svg%3E';
                }}
                onLoad={() => {
                  console.log('Modal image loaded successfully for photo:', selectedPhoto.id, 'URL length:', selectedPhoto.url?.length);
                }}
              />
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-white/20">
                <span className="text-sm font-medium text-slate-300">Filename:</span>
                <span className="text-sm text-white">{selectedPhoto.filename}</span>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b border-white/20">
                <span className="text-sm font-medium text-slate-300">Status:</span>
                <Badge variant={
                  selectedPhoto.status === 'completed' ? 'success' :
                  selectedPhoto.status === 'processing' ? 'warning' :
                  'danger'
                }>
                  {selectedPhoto.status.charAt(0).toUpperCase() + selectedPhoto.status.slice(1)}
                </Badge>
              </div>
              
              {selectedPhoto.dimensions && (
                <div className="flex justify-between items-center py-2 border-b border-white/20">
                  <span className="text-sm font-medium text-slate-300">Dimensions:</span>
                  <span className="text-sm text-white">
                    {selectedPhoto.dimensions.width} × {selectedPhoto.dimensions.height}px
                  </span>
                </div>
              )}
              
              <div className="flex justify-between items-center py-2 border-b border-white/20">
                <span className="text-sm font-medium text-slate-300">Uploaded:</span>
                <span className="text-sm text-white">
                  {new Date(selectedPhoto.createdAt).toLocaleString()}
                </span>
              </div>
              
              {selectedPhoto.surfaces && (
                <div className="pt-2">
                  <p className="text-sm font-medium text-slate-300 mb-2">Surface Analysis:</p>
                  <div className="bg-white/10 backdrop-blur-sm p-3 rounded text-sm space-y-2">
                    {selectedPhoto.surfaces.floor && (
                      <div className="flex justify-between">
                        <span className="text-slate-300">Floor:</span>
                        <span className="font-medium text-white">{selectedPhoto.surfaces.floor.area}m² ({selectedPhoto.surfaces.floor.material})</span>
                      </div>
                    )}
                    {selectedPhoto.surfaces.walls && selectedPhoto.surfaces.walls.length > 0 && (
                      <div className="flex justify-between">
                        <span className="text-slate-300">Walls:</span>
                        <span className="font-medium text-white">{selectedPhoto.surfaces.walls.length} detected</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex gap-2 pt-4 border-t border-white/20">
              <Link to={`/editor?roomPhotoId=${selectedPhoto.id}`} className="flex-1">
                <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">Use in Design</Button>
              </Link>
              <Button
                variant="outline"
                onClick={() => {
                  setShowPhotoModal(false);
                  setSelectedPhoto(null);
                }}
                className="bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-sm"
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
