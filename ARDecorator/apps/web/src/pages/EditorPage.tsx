import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Loading } from '../components/Loading';
import { Modal } from '../components/Modal';
import { RoomPhotoUploadWithProcessing } from '../components/RoomPhotoUploadWithProcessing';
import { Real3DScene } from '../components/Real3DScene';
import { useAuth } from '../contexts/AuthContext';
import { designsApi, furnitureApi, roomPhotosApi } from '../lib/api';

interface FurnitureItem {
  id: string;
  name: string;
  category: string;
  price: number;
  thumbnailUrl: string;
  modelUrl: string;
}

export default function EditorPage() {
  const navigate = useNavigate();
  const { designId } = useParams();
  const { user, logout } = useAuth();

  const [designName, setDesignName] = useState('Untitled Design');
  const [furniture, setFurniture] = useState<FurnitureItem[]>([]);
  const [selectedFurniture, setSelectedFurniture] = useState<string[]>([]);
  const [roomPhotoUrl, setRoomPhotoUrl] = useState<string | null>(null);
  const [roomPhotoId, setRoomPhotoId] = useState<string | null>(null);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [tempDesignName, setTempDesignName] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [pendingRoomPhotoData, setPendingRoomPhotoData] = useState<any>(null);
  const [roomTextureData, setRoomTextureData] = useState<any>(null);
  const [roomDimensions, setRoomDimensions] = useState<{ width: number; height: number; depth: number } | null>(null);
  const [furniturePositions, setFurniturePositions] = useState<Record<string, { x: number; y: number; z: number }>>({});
  const [furnitureRotations, setFurnitureRotations] = useState<Record<string, { x: number; y: number; z: number }>>({});
  const [furnitureScales, setFurnitureScales] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadingRoomPhoto, setLoadingRoomPhoto] = useState(false);
  const [error, setError] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Function to constrain furniture position within room boundaries
  // Memoize the furniture array to prevent unnecessary re-renders
  const placedFurniture = useMemo(() => {
    return furniture
      .filter(item => selectedFurniture.includes(item.id))
      .map(item => ({
        id: item.id,
        name: item.name,
        category: item.category,
        thumbnailUrl: item.thumbnailUrl,
        modelUrl: item.modelUrl,
        position: furniturePositions[item.id] || { x: 0, y: 0, z: 0 },
        rotation: furnitureRotations[item.id] || { x: 0, y: 0, z: 0 },
        scale: furnitureScales[item.id] || 1,
      }));
  }, [furniture, selectedFurniture, furniturePositions, furnitureRotations, furnitureScales]);

  const constrainPositionToRoom = (position: { x: number; y: number; z: number }, furnitureScale: number = 1, furnitureName?: string) => {
    console.log(`🔧 constrainPositionToRoom:`, { position, furnitureScale, furnitureName, roomDimensions });
    
    if (!roomDimensions) {
      return {
        x: Math.max(-1.2, Math.min(1.2, position.x)),
        y: Math.max(0, Math.min(2, position.y)),
        z: Math.max(-1.2, Math.min(1.2, position.z))
      };
    }

    const { width, height, depth } = roomDimensions;
    const roomWidth = width || 4; // Default room width
    const roomHeight = height || 3; // Default room height  
    const roomDepth = depth || 4; // Default room depth
    
    console.log(`📐 Room dimensions:`, { roomWidth, roomHeight, roomDepth });
    
    // Use more aggressive margin calculation based on furniture scale
    const baseMargin = 0.3; // Base margin
    const scaleMargin = furnitureScale * 0.4; // Additional margin based on scale
    const totalMargin = baseMargin + scaleMargin;
    
    // Check if this is a floor item (rug, carpet, etc.)
    const isFloorItem = furnitureName && (
      furnitureName.toLowerCase().includes('rug') || 
      furnitureName.toLowerCase().includes('carpet') ||
      furnitureName.toLowerCase().includes('mat')
    );
    
    // Use more aggressive constraints to ensure furniture stays inside room
    const maxX = roomWidth/2 - totalMargin;
    const minX = -roomWidth/2 + totalMargin;
    const maxZ = roomDepth/2 - totalMargin;
    const minZ = -roomDepth/2 + totalMargin;
    
    const constrainedPosition = {
      x: Math.max(minX, Math.min(maxX, position.x)),
      y: isFloorItem ? 0 : Math.max(0, Math.min(roomHeight - totalMargin, position.y)), // Floor items always at Y=0
      z: Math.max(minZ, Math.min(maxZ, position.z))
    };
    
    console.log(`📏 Room bounds:`, { minX, maxX, minZ, maxZ, totalMargin });
    
    console.log(`✅ Constrained position:`, { original: position, constrained: constrainedPosition, isFloorItem });
    
    return constrainedPosition;
  };

  useEffect(() => {
    loadData();
  }, [designId]);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const allFurniture = await furnitureApi.list();
      setFurniture(allFurniture);

      if (designId) {
     
        const design = await designsApi.getById(designId);
    
        
        setDesignName(design.name);
        setSelectedFurniture(design.placedFurniture?.map((pf: any) => pf.furnitureId) || []);
        
        // Load room photo
        if (design.roomPhotoId && design.roomPhoto) {
          console.log('🎨 EditorPage: Loading existing room photo:', design.roomPhoto.id);
          setRoomPhotoUrl(design.roomPhoto.url);
          setRoomPhotoId(design.roomPhoto.id);
          
          // EDIT MODE: Clear texture data to force fresh analysis
          console.log('🔄 EditorPage: EDIT MODE - Will trigger fresh analysis via photo upload component');
          setRoomTextureData(null); // Clear existing texture data
        } else if (design.roomPhotoId) {
       
          setLoadingRoomPhoto(true);
          try {
            // Add retry mechanism for room photo loading
            let roomPhoto;
            let retries = 3;
            while (retries > 0) {
              try {
                roomPhoto = await roomPhotosApi.getById(design.roomPhotoId);
                break;
              } catch (retryErr: any) {
                retries--;
                if (retries === 0) throw retryErr;
                console.warn(`Room photo load failed, retrying... (${3 - retries}/3)`, retryErr.message);
                await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
              }
            }
            
      
            if (roomPhoto) {
              setRoomPhotoUrl(roomPhoto.url);
              setRoomPhotoId(roomPhoto.id);
            }
            
            // Parse textureData if available
            if (roomPhoto && (roomPhoto as any).textureData) {
              try {
                const textureData = JSON.parse((roomPhoto as any).textureData);
                setRoomTextureData(textureData);
          
              } catch (error) {
                console.error('Error parsing texture data:', error);
              }
            }
            
            // Parse dimensions if available
            if (roomPhoto && (roomPhoto as any).dimensions) {
              try {
                const dimensions = typeof (roomPhoto as any).dimensions === 'string' 
                  ? JSON.parse((roomPhoto as any).dimensions) 
                  : (roomPhoto as any).dimensions;
            
                setRoomDimensions(dimensions);
             
              } catch (error) {
                console.error('Error parsing room dimensions:', error);
              }
            }
          } catch (photoErr) {
            console.error('Failed to load room photo after retries:', photoErr);
            // Don't throw here, just log the error and continue
          } finally {
            setLoadingRoomPhoto(false);
          }
        }

        // Load existing furniture positions
        const initialPositions: Record<string, { x: number; y: number; z: number }> = {};
        const initialRotations: Record<string, { x: number; y: number; z: number }> = {};
        const initialScales: Record<string, number> = {};
        
        design.placedFurniture?.forEach((pf: any) => {
          try {
            const position = typeof pf.position === 'string' ? JSON.parse(pf.position) : pf.position;
            initialPositions[pf.furnitureId] = position;
            
            // Load rotation if available
            if (pf.rotation) {
              const rotation = typeof pf.rotation === 'string' ? JSON.parse(pf.rotation) : pf.rotation;
              initialRotations[pf.furnitureId] = rotation;
            }
            
            // Load scale if available
            if (pf.scale !== undefined) {
              initialScales[pf.furnitureId] = pf.scale;
            }
          } catch (parseErr) {
            console.error('Failed to parse position for furniture:', pf.furnitureId, parseErr);
            initialPositions[pf.furnitureId] = { x: 0, y: 0, z: 0 };
          }
        });
     
        setFurniturePositions(initialPositions);
        setFurnitureRotations(initialRotations);
        setFurnitureScales(initialScales);
      }
    } catch (err: any) {
      console.error('Load error:', err);
      
      // Provide more specific error messages
      if (err.code === 'ECONNABORTED') {
        setError('Request timed out. The server may be slow or overloaded. Please try again.');
      } else if (err.response?.status === 404) {
        setError('Design not found. It may have been deleted.');
      } else if (err.response?.status >= 500) {
        setError('Server error. Please try again later.');
      } else if (err.message?.includes('Network Error')) {
        setError('Network error. Please check your connection and try again.');
      } else {
        setError('Failed to load data: ' + (err.response?.data?.error?.message || err.message));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    if (selectedFurniture.length === 0) {
      setError('Please select at least one furniture item to save');
      return;
    }
    
    // Set default name if editing existing design
    if (designId) {
      setTempDesignName(designName);
    } else {
      setTempDesignName('Untitled Design');
    }
    
    setShowSaveModal(true);
  };

  const handleConfirmSave = async () => {
    if (!tempDesignName.trim()) {
      setError('Please enter a design name');
      return;
    }

    try {
      setSaving(true);
      setError('');
      
      // Create furniture placements with actual positions from canvas
      const placedFurniture = selectedFurniture.map((furnitureId) => {
        const position = furniturePositions[furnitureId] || { x: 0, y: 0, z: 0 };
        const rotation = furnitureRotations[furnitureId] || { x: 0, y: 0, z: 0 };
        const scale = furnitureScales[furnitureId] || 1.0;
        return {
          furnitureId,
          position,
          rotation,
          scale,
        };
      });

      if (designId) {
        // Update existing design - preserve furniture data
        await designsApi.update(designId, {
          name: tempDesignName.trim(),
          furniture: placedFurniture,
        });

      } else {
        // Create new design - use pending room photo data or create default
        let currentRoomPhotoId = roomPhotoId;
        
        console.log('Design save - roomPhotoId:', roomPhotoId, 'pendingRoomPhotoData:', !!pendingRoomPhotoData, 'currentRoomPhotoId:', currentRoomPhotoId);
        
        if (!currentRoomPhotoId && pendingRoomPhotoData) {
          // Save the pending room photo data to database with texture data
          const roomPhotoData = {
            ...pendingRoomPhotoData,
            textureData: roomTextureData ? JSON.stringify(roomTextureData) : null
          };
          console.log('Creating room photo with URL length:', roomPhotoData.url?.length, 'URL starts with:', roomPhotoData.url?.substring(0, 50));
          const roomPhoto = await roomPhotosApi.create(roomPhotoData);
          console.log('Room photo created with URL length:', roomPhoto.url?.length, 'URL starts with:', roomPhoto.url?.substring(0, 50));
          setRoomPhotoId(roomPhoto.id);
          
          // Update status to 'completed' after successful analysis
          await roomPhotosApi.update(roomPhoto.id, { status: 'completed' });
          
          // Use the room photo ID directly for design creation
          currentRoomPhotoId = roomPhoto.id;
        } else if (!currentRoomPhotoId) {
          console.log('Creating default room photo');
          // Create default room photo if no photo was uploaded
          const roomPhoto = await roomPhotosApi.create({
            filename: 'default-room.jpg',
            url: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&h=600&fit=crop',
            dimensions: { width: 800, height: 600 },
            surfaces: {
              floor: { area: 20, material: 'hardwood' },
              walls: [
                { area: 15, material: 'painted' },
                { area: 15, material: 'painted' },
              ],
            },
          });
          setRoomPhotoId(roomPhoto.id);
          
          // Use the room photo ID directly for design creation
          currentRoomPhotoId = roomPhoto.id;
        } else {
          console.log('Using existing room photo:', currentRoomPhotoId);
        }

        console.log('Creating design with:', {
          name: tempDesignName.trim(),
          roomPhotoId: currentRoomPhotoId,
          furnitureCount: placedFurniture.length
        });

        if (!currentRoomPhotoId) {
          throw new Error('Room photo ID is required but not available');
        }

        const newDesign = await designsApi.create({
          name: tempDesignName.trim(),
          roomPhotoId: currentRoomPhotoId,
          furniture: placedFurniture,
        });
        
        console.log('Design created:', newDesign);
      }

      setShowSaveModal(false);
      setDesignName(tempDesignName.trim()); // Update the design name
      setShowSuccessModal(true);
      setHasUnsavedChanges(false); // Clear unsaved changes flag
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (err: any) {
      const errorMessage = err.response?.data?.error?.message || err.response?.data?.message || err.message;
      setError('Failed to save design: ' + errorMessage);
      console.error('Save error:', err.response?.data || err);
      
      // Update room photo status to 'failed' if it was created but design creation failed
      if (roomPhotoId && !designId) {
        try {
          await roomPhotosApi.update(roomPhotoId, { status: 'failed' });
        } catch (updateErr) {
          console.error('Failed to update room photo status:', updateErr);
        }
      }
    } finally {
      setSaving(false);
    }
  };

  const handleClearDesign = () => {
    setSelectedFurniture([]);
    setFurniturePositions({});
    setFurnitureRotations({});
    setFurnitureScales({});
    setHasUnsavedChanges(true);
  };

  const toggleFurniture = (id: string) => {
    setSelectedFurniture(prev => {
      const newSelection = prev.includes(id) ? prev.filter(fid => fid !== id) : [...prev, id];
      
      // Initialize position and rotation for newly added furniture
      if (!prev.includes(id)) {
        // Place new furniture in the center of the room with a fixed offset
        const centerOffset = 0; // Always place in center - no dynamic offset
        const initialPosition = { 
          x: centerOffset, 
          y: 0, // Place directly on floor
          z: centerOffset // No diagonal offset
        };
        
        console.log(`🎯 Adding new furniture ${id}:`, { centerOffset, initialPosition, prevLength: prev.length });
        
        // Get the furniture name for floor item detection
        const furnitureItem = furniture.find(f => f.id === id);
        const furnitureName = furnitureItem?.name || '';
        
        console.log(`📝 Furniture item:`, { name: furnitureName, id });
        
        // Apply room boundary constraints to initial placement
        const constrainedPosition = constrainPositionToRoom(initialPosition, 1, furnitureName);
        
        console.log(`🏠 Final position for ${furnitureName}:`, constrainedPosition);
        
        setFurniturePositions(positions => ({
          ...positions,
          [id]: constrainedPosition
        }));
        
        // Set default rotation - mirrors should face front
        let defaultRotation = { x: 0, y: 0, z: 0 };
        if (furnitureName.toLowerCase().includes('mirror')) {
          defaultRotation = { x: 0, y: -Math.PI / 2, z: 0 }; // -90 degrees around Y axis
        }
        
        setFurnitureRotations(rotations => ({
          ...rotations,
          [id]: defaultRotation
        }));
        setHasUnsavedChanges(true);
      }
      
      return newSelection;
    });
  };

  const handleFurnitureMove = (id: string, position: { x: number; y: number; z: number }) => {
    // Get the current scale for this furniture item
    const currentScale = furnitureScales[id] || 1;
    
    // Get the furniture name for floor item detection
    const furnitureItem = furniture.find(f => f.id === id);
    const furnitureName = furnitureItem?.name || '';
    
    // Apply room boundary constraints
    const constrainedPosition = constrainPositionToRoom(position, currentScale, furnitureName);
    
    setFurniturePositions(prev => ({
      ...prev,
      [id]: constrainedPosition
    }));
    setHasUnsavedChanges(true);
  };

  const handleFurnitureRotate = (id: string, rotation: { x: number; y: number; z: number }) => {
    console.log(`🔄 EditorPage: Rotating ${id} to:`, rotation);
    setFurnitureRotations(prev => ({
      ...prev,
      [id]: rotation
    }));
    setHasUnsavedChanges(true);
  };

  const handleFurnitureScale = (id: string, scale: number) => {
    setFurnitureScales(prev => ({
      ...prev,
      [id]: scale
    }));
    setHasUnsavedChanges(true);
  };

  const handleFurnitureDelete = (id: string) => {
    // Remove from selected furniture
    setSelectedFurniture(prev => prev.filter(fid => fid !== id));
    
    // Clean up position, rotation, and scale data
    setFurniturePositions(prev => {
      const newPositions = { ...prev };
      delete newPositions[id];
      return newPositions;
    });
    
    setFurnitureRotations(prev => {
      const newRotations = { ...prev };
      delete newRotations[id];
      return newRotations;
    });
    
    setFurnitureScales(prev => {
      const newScales = { ...prev };
      delete newScales[id];
      return newScales;
    });
    
    setHasUnsavedChanges(true);
  };

  const handlePhotoUploaded = (photoUrl: string, photoId: string | null, analysisData?: any) => {
    setRoomPhotoUrl(photoUrl);
    setRoomPhotoId(photoId);
    
    // Store pending room photo data for later saving
    if (analysisData?.pendingRoomPhotoData) {
      setPendingRoomPhotoData(analysisData.pendingRoomPhotoData);
      setHasUnsavedChanges(true);
    }
    
    // Store texture data if available
    if (analysisData?.textureData) {
      setRoomTextureData(analysisData.textureData);
    }
    
    // Store dimensions if available
    if (analysisData?.dimensions) {
      setRoomDimensions(analysisData.dimensions);
    }
  };

  const totalCost = furniture
    .filter(item => selectedFurniture.includes(item.id))
    .reduce((sum, item) => sum + item.price, 0);

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
              <span className="text-slate-300">{user?.name}</span>
              <Link to="/dashboard">
                <Button variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-sm">Dashboard</Button>
              </Link>
              <Button variant="ghost" onClick={() => { logout(); navigate('/'); }} className="text-slate-300 hover:text-white hover:bg-white/10">Logout</Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent mb-6">
          {designId ? 'Edit Design' : 'Create New Design'}
        </h1>

        {loading && (
          <div className="flex justify-center items-center py-12">
            <Loading size="lg" />
          </div>
        )}

        {loadingRoomPhoto && (
          <div className="flex justify-center items-center py-4">
            <div className="flex items-center space-x-2 text-blue-400">
              <Loading size="sm" />
              <span>Loading room photo...</span>
            </div>
          </div>
        )}

        {/* Texture Analysis Loading Indicator */}
        {designId && !roomTextureData && roomPhotoId && (
          <div className="flex justify-center items-center py-4">
            <div className="flex items-center space-x-2 text-blue-400 bg-blue-500/10 px-4 py-2 rounded-lg border border-blue-500/20">
              <Loading size="sm" />
              <span>Analyzing room textures for better accuracy...</span>
            </div>
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
          <div className="space-y-6">
            {/* Room Photo Upload */}
            <RoomPhotoUploadWithProcessing 
              onPhotoUploaded={handlePhotoUploaded} 
              initialPhotoUrl={roomPhotoUrl}
            />

            {/* Main Content Area */}
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
              {/* Left Sidebar - Furniture Catalog (Narrower) */}
              <Card className="p-4 xl:col-span-1 bg-white/10 backdrop-blur-lg border border-white/20 shadow-2xl h-fit max-h-[calc(100vh-200px)]">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-white">Furniture</h2>
                  <div className="flex items-center gap-2 text-sm text-slate-300">
                    <span>{selectedFurniture.length}</span>
                    <span className="text-blue-400">${totalCost.toFixed(2)}</span>
                  </div>
                </div>
                
                <div className="space-y-2 max-h-[calc(100vh-300px)] overflow-y-auto pr-2" style={{
                  scrollbarWidth: 'thin',
                  scrollbarColor: 'rgba(255, 255, 255, 0.2) transparent'
                }}>
                  {furniture.map((item) => (
                    <div
                      key={item.id}
                      className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all duration-200 border backdrop-blur-sm
                        ${selectedFurniture.includes(item.id) 
                          ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 border-blue-500/50 shadow-md' 
                          : 'bg-white/10 hover:bg-white/20 border-white/20'}`}
                      onClick={() => toggleFurniture(item.id)}
                    >
                      <img
                        src={item.thumbnailUrl}
                        alt={item.name}
                        className="w-10 h-10 object-cover rounded-lg flex-shrink-0"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="40" height="40"%3E%3Crect fill="%231e293b" width="40" height="40"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="10" fill="%2394a3b8"%3E?%3C/text%3E%3C/svg%3E';
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-xs truncate text-white">{item.name}</p>
                        <p className="text-xs text-slate-400">{item.category}</p>
                        <p className="text-xs font-semibold text-blue-400">${item.price.toFixed(2)}</p>
                      </div>
                      {selectedFurniture.includes(item.id) && (
                        <svg className="w-4 h-4 text-blue-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  ))}
                </div>
                
                {/* Action Buttons */}
                <div className="mt-8 pt-4 border-t border-white/20">
                  <div className="space-y-3">
                    <Button
                      onClick={handleSave}
                      loading={saving}
                      disabled={selectedFurniture.length === 0}
                      size="lg"
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                    >
                      {designId ? 'Update Design' : 'Save Design'}
                    </Button>
                    
                    <Button
                      onClick={handleClearDesign}
                      disabled={selectedFurniture.length === 0}
                      size="lg"
                      className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                    >
                      Clear Design
                    </Button>
                    
                    <Link to="/dashboard" className="block">
                      <Button 
                        variant="outline" 
                        size="lg" 
                        className="w-full bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-sm"
                      >
                        Cancel
                      </Button>
                    </Link>
                    
                    {hasUnsavedChanges && (
                      <div className="flex items-center gap-2 text-amber-400 text-sm justify-center">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        Unsaved changes
                      </div>
                    )}
                  </div>
                </div>
              </Card>

              {/* Main 3D Canvas Area (Much Larger) */}
              <div className="xl:col-span-3 space-y-6">
                {/* 3D Canvas Area */}
                <Card className="p-6 bg-white/10 backdrop-blur-lg border border-white/20 shadow-2xl">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-white">3D Room Designer</h2>
                    <div className="flex items-center gap-4 text-sm text-slate-300">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                        <span>Ready</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span>{placedFurniture.length} items placed</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Much Larger 3D Canvas */}
                  <div className="aspect-[4/3] rounded-xl overflow-hidden bg-slate-900 shadow-2xl border border-white/20">
                    <Real3DScene
                      roomPhotoUrl={roomPhotoUrl}
                      roomTextureData={roomTextureData}
                      roomDimensions={roomDimensions || undefined}
                      roomPhotoId={roomPhotoId || undefined}
                      furniture={placedFurniture}
                      onFurnitureMove={handleFurnitureMove}
                      onFurnitureRotate={handleFurnitureRotate}
                      onFurnitureScale={handleFurnitureScale}
                      onFurnitureDelete={handleFurnitureDelete}
                      onTextureDataUpdate={setRoomTextureData}
                    />
                  </div>
                  
                  {/* Instructions */}
                  <div className="mt-4 p-4 bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-500/30 rounded-xl backdrop-blur-sm">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-300">
                      <div>
                        <strong className="text-green-400">🎨 Controls:</strong>
                        <ul className="mt-1 space-y-1 text-xs">
                          <li>• Click furniture to add to room</li>
                          <li>• Drag to move objects</li>
                          <li>• Use rotation buttons</li>
                        </ul>
                      </div>
                      <div>
                        <strong className="text-blue-400">📷 Camera:</strong>
                        <ul className="mt-1 space-y-1 text-xs">
                          <li>• Right-click + drag to rotate</li>
                          <li>• Scroll to zoom in/out</li>
                          <li>• Middle-click to pan</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Save Design Modal */}
      <Modal
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        title={designId ? "Update Design" : "Save Design"}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Design Name
            </label>
            <input
              type="text"
              value={tempDesignName}
              onChange={(e) => setTempDesignName(e.target.value)}
              placeholder="Enter design name"
              className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              autoFocus
            />
          </div>
          
          <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">Selected Items:</span>
              <span className="text-sm font-bold text-blue-600">{selectedFurniture.length}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">Total Cost:</span>
              <span className="text-lg font-bold text-blue-600">${totalCost.toFixed(2)}</span>
            </div>
          </div>
        </div>
        
        <div className="mt-6 flex gap-3 justify-end">
          <Button 
            variant="outline" 
            onClick={() => setShowSaveModal(false)}
            className="bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200 hover:border-gray-400"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleConfirmSave}
            loading={saving}
            disabled={!tempDesignName.trim()}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
          >
            {designId ? 'Update Design' : 'Save Design'}
          </Button>
        </div>
      </Modal>

      {/* Success Modal */}
      <Modal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title="Design Saved!"
      >
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-gray-700">Your design "{designName}" has been successfully saved.</p>
          <p className="text-sm text-gray-500">Redirecting to dashboard...</p>
        </div>
      </Modal>

    </div>
  );
}
