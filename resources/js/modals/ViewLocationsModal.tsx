import { useState, useEffect } from 'react';
import axios from 'axios';
import { X, MapPin, Edit, Plus, Trash2, RefreshCw, Search } from 'lucide-react';
import CreateLocationModal from './CreateLocationModal';

type Location = {
  id: number;
  name: string;
  description: string | null;
  address: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

type ViewLocationsModalProps = {
  show: boolean;
  onClose: () => void;
};

export default function ViewLocationsModal({ show, onClose }: ViewLocationsModalProps) {
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);

  useEffect(() => {
    if (show) {
      fetchLocations();
    }
  }, [show]);

  const fetchLocations = () => {
    setIsLoading(true);
    axios.get('/locations')
      .then(response => {
        setLocations(response.data);
      })
      .catch(error => {
        console.error('Error fetching locations:', error);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  const handleEditLocation = (location: Location) => {
    // You could implement an edit modal or inline editing here
    setSelectedLocation(location);
  };

  const handleDeleteLocation = (id: number) => {
    // Implement deletion or deactivation
    if (confirm('Are you sure you want to delete this location?')) {
      axios.post(`/locations/${id}/toggle-status`)
        .then(() => {
          fetchLocations();
        })
        .catch(error => {
          console.error('Error deleting location:', error);
        });
    }
  };

  const filteredLocations = locations.filter(location => {
    if (!searchQuery) return true;

    const query = searchQuery.toLowerCase();
    return (
      location.name.toLowerCase().includes(query) ||
      (location.description && location.description.toLowerCase().includes(query)) ||
      (location.address && location.address.toLowerCase().includes(query))
    );
  });

  if (!show) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto m-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Locations</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-xl transition-all duration-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex justify-between mb-4">
          <div className="relative flex-grow mr-4">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              className="pl-10 py-2 pr-3 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder="Search locations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={fetchLocations}
              className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              title="Refresh"
            >
              <RefreshCw className="h-4 w-4" />
            </button>

            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Location
            </button>
          </div>
        </div>

        <div className="overflow-y-auto flex-grow">
          {isLoading ? (
            <div className="flex justify-center items-center h-48">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
              <span className="ml-2 text-gray-600">Loading locations...</span>
            </div>
          ) : filteredLocations.length === 0 ? (
            <div className="flex flex-col justify-center items-center h-48">
              <MapPin className="h-12 w-12 text-gray-300 mb-4" />
              <p className="text-gray-500">No locations found</p>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="mt-2 text-blue-500 hover:text-blue-700"
                >
                  Clear search
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredLocations.map(location => (
                <div key={location.id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex justify-between">
                    <div className="flex items-start">
                      <MapPin className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
                      <div>
                        <h3 className="text-md font-medium text-gray-900">{location.name}</h3>
                        {location.description && (
                          <p className="text-sm text-gray-500 mt-1">{location.description}</p>
                        )}
                        {location.address && (
                          <p className="text-sm text-gray-500 mt-1">{location.address}</p>
                        )}
                        <div className="mt-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            location.is_active
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {location.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEditLocation(location)}
                        className="text-indigo-600 hover:text-indigo-900"
                        title="Edit"
                      >
                        <Edit className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteLocation(location.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <CreateLocationModal
          show={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            fetchLocations();
          }}
        />
      </div>
    </div>
  );
}
