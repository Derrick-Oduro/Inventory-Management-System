import { useState, useEffect } from 'react';
import axios from 'axios';
import { X, MapPin, Edit, Plus, Trash2, RefreshCw, Search, Package, Tag } from 'lucide-react';
import CreateLocationModal from './CreateLocationModal';
import CreateCategoryModal from './CreateCategoryModal';
import CreateUnitModal from './CreateUnitModal';

type Location = {
  id: number;
  name: string;
  description: string | null;
  address: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

type Category = {
  id: number;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
};

type UnitOfMeasure = {
  id: number;
  name: string;
  abbreviation: string;
  created_at: string;
  updated_at: string;
};

type ManageInventoryOptionsModalProps = {
  show: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

export default function ManageInventoryOptionsModal({ show, onClose, onSuccess }: ManageInventoryOptionsModalProps) {
  const [activeTab, setActiveTab] = useState<'locations' | 'categories' | 'units'>('locations');
  const [locations, setLocations] = useState<Location[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [units, setUnits] = useState<UnitOfMeasure[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal states
  const [showCreateLocationModal, setShowCreateLocationModal] = useState(false);
  const [showCreateCategoryModal, setShowCreateCategoryModal] = useState(false);
  const [showCreateUnitModal, setShowCreateUnitModal] = useState(false);

  useEffect(() => {
    if (show) {
      fetchAllData();
    }
  }, [show]);

  const fetchAllData = async () => {
    setIsLoading(true);
    try {
      const [locationsRes, categoriesRes, unitsRes] = await Promise.all([
        axios.get('/api/locations'),
        axios.get('/api/inventory/categories'),
        axios.get('/api/inventory/units')
      ]);

      setLocations(locationsRes.data);
      setCategories(categoriesRes.data);
      setUnits(unitsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteLocation = async (id: number) => {
    if (confirm('Are you sure you want to delete this location? This action cannot be undone.')) {
      try {
        await axios.delete(`/api/locations/${id}`);
        fetchAllData();
        onSuccess();
      } catch (error) {
        console.error('Error deleting location:', error);
        alert('Error deleting location. It may be in use by inventory items.');
      }
    }
  };

  const handleDeleteCategory = async (id: number) => {
    if (confirm('Are you sure you want to delete this category? This action cannot be undone.')) {
      try {
        await axios.delete(`/api/inventory/categories/${id}`);
        fetchAllData();
        onSuccess();
      } catch (error) {
        console.error('Error deleting category:', error);
        alert('Error deleting category. It may be in use by inventory items.');
      }
    }
  };

  const handleDeleteUnit = async (id: number) => {
    if (confirm('Are you sure you want to delete this unit? This action cannot be undone.')) {
      try {
        await axios.delete(`/api/inventory/units/${id}`);
        fetchAllData();
        onSuccess();
      } catch (error) {
        console.error('Error deleting unit:', error);
        alert('Error deleting unit. It may be in use by inventory items.');
      }
    }
  };

  const handleToggleLocationStatus = async (id: number) => {
    try {
      await axios.post(`/api/locations/${id}/toggle-status`);
      fetchAllData();
      onSuccess();
    } catch (error) {
      console.error('Error toggling location status:', error);
    }
  };

  const filterData = (data: any[], searchFields: string[]) => {
    if (!searchQuery) return data;
    const query = searchQuery.toLowerCase();
    return data.filter(item =>
      searchFields.some(field => {
        const value = item[field];
        return value && value.toString().toLowerCase().includes(query);
      })
    );
  };

  const filteredLocations = filterData(locations, ['name', 'description', 'address']);
  const filteredCategories = filterData(categories, ['name', 'description']);
  const filteredUnits = filterData(units, ['name', 'abbreviation']);

  if (!show) return null;

  return (
    <>
      <div
        className="fixed inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm z-50"
        onClick={onClose}
      >
        <div
          className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden m-4"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900">Manage Inventory Options</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('locations')}
              className={`flex-1 py-4 px-6 text-sm font-medium transition-colors ${
                activeTab === 'locations'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <MapPin className="h-4 w-4" />
                Locations ({locations.length})
              </div>
            </button>
            <button
              onClick={() => setActiveTab('categories')}
              className={`flex-1 py-4 px-6 text-sm font-medium transition-colors ${
                activeTab === 'categories'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Tag className="h-4 w-4" />
                Categories ({categories.length})
              </div>
            </button>
            <button
              onClick={() => setActiveTab('units')}
              className={`flex-1 py-4 px-6 text-sm font-medium transition-colors ${
                activeTab === 'units'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Package className="h-4 w-4" />
                Units ({units.length})
              </div>
            </button>
          </div>

          {/* Content */}
          <div className="p-6 max-h-[60vh] overflow-y-auto">
            {/* Search and Add Button */}
            <div className="flex gap-4 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder={`Search ${activeTab}...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <button
                onClick={() => {
                  if (activeTab === 'locations') setShowCreateLocationModal(true);
                  else if (activeTab === 'categories') setShowCreateCategoryModal(true);
                  else if (activeTab === 'units') setShowCreateUnitModal(true);
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Add {activeTab.slice(0, -1)}
              </button>
            </div>

            {isLoading ? (
              <div className="flex justify-center items-center h-32">
                <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
              </div>
            ) : (
              <div className="space-y-2">
                {/* Locations Tab */}
                {activeTab === 'locations' && (
                  <>
                    {filteredLocations.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        {searchQuery ? 'No locations found matching your search' : 'No locations available'}
                      </div>
                    ) : (
                      filteredLocations.map((location) => (
                        <div
                          key={location.id}
                          className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                        >
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-900">{location.name}</h3>
                            {location.description && (
                              <p className="text-sm text-gray-500">{location.description}</p>
                            )}
                            {location.address && (
                              <p className="text-sm text-gray-500">{location.address}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2 py-1 text-xs font-medium rounded-full ${
                                location.is_active
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {location.is_active ? 'Active' : 'Inactive'}
                            </span>
                            <button
                              onClick={() => handleToggleLocationStatus(location.id)}
                              className="p-1 text-blue-600 hover:text-blue-800"
                              title={location.is_active ? 'Deactivate' : 'Activate'}
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteLocation(location.id)}
                              className="p-1 text-red-600 hover:text-red-800"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </>
                )}

                {/* Categories Tab */}
                {activeTab === 'categories' && (
                  <>
                    {filteredCategories.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        {searchQuery ? 'No categories found matching your search' : 'No categories available'}
                      </div>
                    ) : (
                      filteredCategories.map((category) => (
                        <div
                          key={category.id}
                          className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                        >
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-900">{category.name}</h3>
                            {category.description && (
                              <p className="text-sm text-gray-500">{category.description}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleDeleteCategory(category.id)}
                              className="p-1 text-red-600 hover:text-red-800"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </>
                )}

                {/* Units Tab */}
                {activeTab === 'units' && (
                  <>
                    {filteredUnits.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        {searchQuery ? 'No units found matching your search' : 'No units available'}
                      </div>
                    ) : (
                      filteredUnits.map((unit) => (
                        <div
                          key={unit.id}
                          className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                        >
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-900">
                              {unit.name} ({unit.abbreviation})
                            </h3>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleDeleteUnit(unit.id)}
                              className="p-1 text-red-600 hover:text-red-800"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sub-modals */}
      <CreateLocationModal
        show={showCreateLocationModal}
        onClose={() => setShowCreateLocationModal(false)}
        onSuccess={() => {
          setShowCreateLocationModal(false);
          fetchAllData();
          onSuccess();
        }}
      />

      <CreateCategoryModal
        show={showCreateCategoryModal}
        onClose={() => setShowCreateCategoryModal(false)}
        onSuccess={() => {
          setShowCreateCategoryModal(false);
          fetchAllData();
          onSuccess();
        }}
      />

      <CreateUnitModal
        show={showCreateUnitModal}
        onClose={() => setShowCreateUnitModal(false)}
        onSuccess={() => {
          setShowCreateUnitModal(false);
          fetchAllData();
          onSuccess();
        }}
      />
    </>
  );
}
