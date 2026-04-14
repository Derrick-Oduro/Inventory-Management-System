import { useState, useEffect } from 'react';
import { X, Package, Clock, AlertTriangle, CheckCircle, User, MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Requisition } from '@/types/requisition';

type ViewRequisitionModalProps = {
    show: boolean;
    onClose: () => void;
    requisition: Requisition | null;
};

export default function ViewRequisitionModal({ show, onClose, requisition }: ViewRequisitionModalProps) {
    if (!show || !requisition) return null;

    // Add a console log to debug what's being received
    useEffect(() => {
        if (requisition) {
            console.log('Requisition data received:', requisition);
        }
    }, [requisition]);

    const formatDate = (dateString?: string) => {
        if (!dateString) return 'N/A';

        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending':
                return <Badge className="bg-blue-100 text-blue-800">Pending Review</Badge>;
            case 'approved':
                return <Badge className="bg-green-100 text-green-800">Approved</Badge>;
            case 'declined':
                return <Badge className="bg-red-100 text-red-800">Declined</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    return (
        <div
            className="fixed inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm z-50"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">Requisition Details</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-xl transition-all duration-200"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="bg-blue-50 p-4 rounded-md mb-6">
                    <div className="flex flex-col sm:flex-row sm:justify-between gap-4">
                        <div>
                            <div className="text-lg font-bold text-blue-900">
                                Item: {requisition.item?.name || 'Unknown Item'}
                            </div>
                            <div className="mt-1 text-sm text-gray-600">
                                Requested by: <span className="font-medium">{requisition.created_by?.name || 'Unknown User'}</span>
                            </div>
                            <div className="mt-1 text-sm text-gray-600">
                                Date: {formatDate(requisition.created_at)}
                            </div>
                        </div>
                        <div className="flex flex-col gap-2 items-start sm:items-end">
                            {getStatusBadge(requisition.status)}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">
                            Item Details
                        </h3>
                        <div className="bg-gray-50 p-3 rounded-md">
                            <div className="flex items-center mb-3">
                                <Package className="h-5 w-5 text-gray-400 mr-2" />
                                <div>
                                    <div className="text-sm font-medium text-gray-900">
                                        {requisition.item?.name || 'Unknown Item'}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        SKU: {requisition.item?.sku || 'N/A'}
                                    </div>
                                </div>
                            </div>

                            <div className="mt-2">
                                <div className="text-xs font-medium text-gray-500 uppercase">Quantity Requested</div>
                                <div className="text-sm text-gray-900">
                                    {requisition.quantity} {requisition.item?.unit_of_measure?.abbreviation || 'units'}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">
                            Location
                        </h3>
                        <div className="bg-gray-50 p-3 rounded-md">
                            <div className="flex items-center">
                                <MapPin className="h-5 w-5 text-gray-400 mr-2" />
                                <div className="text-sm text-gray-900">
                                    {requisition.location?.name || 'Unknown Location'}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {requisition.status !== 'pending' && (
                    <div className="mb-6">
                        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">
                            Review Information
                        </h3>
                        <div className="bg-gray-50 p-3 rounded-md">
                            <div>
                                <div className="text-xs font-medium text-gray-500 uppercase">Status</div>
                                <div className="text-sm text-gray-900 mt-1">
                                    {requisition.status === 'approved' ? (
                                        <span className="text-green-600 font-medium flex items-center">
                                            <CheckCircle className="h-4 w-4 mr-1" /> Approved
                                        </span>
                                    ) : (
                                        <span className="text-red-600 font-medium flex items-center">
                                            <X className="h-4 w-4 mr-1" /> Declined
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* More robust check for admin_notes */}
                            {requisition.admin_notes && typeof requisition.admin_notes === 'string' && requisition.admin_notes.trim() !== '' && (
                                <div className="mt-3">
                                    <div className="text-xs font-medium text-gray-500 uppercase">Admin Notes</div>
                                    <div className="text-sm text-gray-900 mt-1 bg-gray-100 p-2 rounded">
                                        {requisition.admin_notes}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                <div className="flex justify-end">
                    <button
                        onClick={onClose}
                        className="bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded-md"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
