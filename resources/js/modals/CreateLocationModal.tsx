import { useState } from 'react';
import axios from 'axios';
import { X, MapPin } from 'lucide-react';

type CreateLocationModalProps = {
    show: boolean;
    onClose: () => void;
    onSuccess: () => void;
};

export default function CreateLocationModal({ show, onClose, onSuccess }: CreateLocationModalProps) {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        address: '',
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!show) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.name.trim()) {
            newErrors.name = 'Location name is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);

        axios.post('/api/locations', formData)
            .then(response => {
                console.log('Location created:', response.data);
                onSuccess();
                setFormData({ name: '', description: '', address: '' });
                onClose();
            })
            .catch(error => {
                console.error('Error creating location:', error);

                if (error.response?.data?.errors) {
                    setErrors(error.response.data.errors);
                } else {
                    setErrors({ general: 'Failed to create location. Please try again.' });
                }
            })
            .finally(() => {
                setIsSubmitting(false);
            });
    };

    return (
        <div
            className="fixed inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm z-50"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md m-4"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center gap-3 mb-6">
                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl p-3 shadow-lg">
                        <MapPin className="h-5 w-5" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">Add New Location</h2>
                    <button
                        onClick={onClose}
                        className="ml-auto text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-xl transition-all duration-200"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
                            Location Name *
                        </label>
                        <input
                            id="name"
                            name="name"
                            type="text"
                            required
                            value={formData.name}
                            onChange={handleChange}
                            className="w-full py-3 px-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                            disabled={isSubmitting}
                            placeholder="Enter location name"
                        />
                        {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                    </div>

                    <div>
                        <label htmlFor="description" className="block text-sm font-semibold text-gray-700 mb-2">
                            Description (Optional)
                        </label>
                        <textarea
                            id="description"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            rows={3}
                            className="w-full py-3 px-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                            disabled={isSubmitting}
                            placeholder="Brief description of this location"
                        />
                    </div>

                    <div>
                        <label htmlFor="address" className="block text-sm font-semibold text-gray-700 mb-2">
                            Address (Optional)
                        </label>
                        <textarea
                            id="address"
                            name="address"
                            value={formData.address}
                            onChange={handleChange}
                            rows={2}
                            className="w-full py-3 px-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                            disabled={isSubmitting}
                            placeholder="Full address of this location"
                        />
                    </div>

                    {errors.general && (
                        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-sm">
                            {errors.general}
                        </div>
                    )}

                    <div className="flex justify-end gap-4 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-all duration-200"
                            disabled={isSubmitting}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <span className="flex items-center gap-2">
                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                                    Processing...
                                </span>
                            ) : 'Add Location'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
