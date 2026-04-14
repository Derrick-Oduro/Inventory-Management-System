import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { ArrowRightLeft, LoaderCircle, X } from 'lucide-react';

type MovementType = 'stock_in' | 'stock_out' | 'transfer' | 'adjustment' | 'return';
type AdjustmentMode = 'increase' | 'decrease' | 'set';

type InventoryItemOption = {
    id: number;
    name: string;
    sku: string;
    is_active: boolean;
};

type LocationOption = {
    id: number;
    name: string;
};

type RecordStockMovementModalProps = {
    show: boolean;
    onClose: () => void;
    onSuccess: () => void;
    items: InventoryItemOption[];
    locations: LocationOption[];
    initialItemId?: number | null;
};

const movementOptions: Array<{ value: MovementType; label: string }> = [
    { value: 'stock_in', label: 'Stock In (Receive goods)' },
    { value: 'stock_out', label: 'Stock Out (Dispatch/Sale)' },
    { value: 'transfer', label: 'Transfer (Between locations)' },
    { value: 'adjustment', label: 'Adjustment (Manual correction)' },
    { value: 'return', label: 'Return (Customer return)' },
];

export default function RecordStockMovementModal({
    show,
    onClose,
    onSuccess,
    items,
    locations,
    initialItemId,
}: RecordStockMovementModalProps) {
    const [itemId, setItemId] = useState('');
    const [movementType, setMovementType] = useState<MovementType>('stock_in');
    const [adjustmentMode, setAdjustmentMode] = useState<AdjustmentMode>('increase');
    const [quantity, setQuantity] = useState('');
    const [fromLocationId, setFromLocationId] = useState('');
    const [toLocationId, setToLocationId] = useState('');
    const [notes, setNotes] = useState('');
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const selectedItem = useMemo(
        () => items.find((item) => item.id === Number(itemId)),
        [items, itemId],
    );

    const requiresFromLocation = movementType === 'stock_out' || movementType === 'transfer' || movementType === 'adjustment';
    const requiresToLocation = movementType === 'stock_in' || movementType === 'transfer' || movementType === 'return';

    useEffect(() => {
        if (!show) {
            return;
        }

        const defaultItemId = initialItemId ? String(initialItemId) : '';
        const defaultFromLocation = locations.length > 0 ? String(locations[0].id) : '';

        setItemId(defaultItemId);
        setMovementType('stock_in');
        setAdjustmentMode('increase');
        setQuantity('');
        setFromLocationId(defaultFromLocation);
        setToLocationId(defaultFromLocation);
        setNotes('');
        setErrors({});
    }, [show, initialItemId, locations]);

    if (!show) {
        return null;
    }

    const validate = () => {
        const newErrors: Record<string, string> = {};

        if (!itemId) {
            newErrors.item_id = 'Select a product';
        }

        const parsedQuantity = Number(quantity);
        if (!quantity || !Number.isFinite(parsedQuantity) || parsedQuantity <= 0) {
            newErrors.quantity = 'Enter a valid quantity greater than zero';
        }

        if (requiresFromLocation && !fromLocationId) {
            newErrors.from_location_id = 'Select source location';
        }

        if (requiresToLocation && !toLocationId) {
            newErrors.to_location_id = 'Select destination location';
        }

        if (movementType === 'transfer' && fromLocationId && toLocationId && fromLocationId === toLocationId) {
            newErrors.to_location_id = 'Destination must be different from source for transfers';
        }

        if (selectedItem && !selectedItem.is_active) {
            newErrors.item_id = 'Stock movement is blocked for inactive products';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validate()) {
            return;
        }

        setIsSubmitting(true);
        setErrors({});

        try {
            const payload: Record<string, unknown> = {
                item_id: Number(itemId),
                movement_type: movementType,
                quantity: Number(quantity),
                notes: notes.trim() || null,
            };

            if (requiresFromLocation) {
                payload.from_location_id = Number(fromLocationId);
            }

            if (requiresToLocation) {
                payload.to_location_id = Number(toLocationId);
            }

            if (movementType === 'adjustment') {
                payload.adjustment_mode = adjustmentMode;
            }

            await axios.post('/api/stock-movements', payload);
            onSuccess();
            onClose();
        } catch (error: unknown) {
            console.error('Failed to record stock movement:', error);

            if (axios.isAxiosError(error) && error.response?.data?.errors) {
                const apiErrors = error.response.data.errors as Record<string, string[] | string>;
                const flattened: Record<string, string> = {};
                Object.entries(apiErrors).forEach(([key, value]) => {
                    flattened[key] = Array.isArray(value) ? value[0] : value;
                });
                setErrors(flattened);
            } else if (axios.isAxiosError(error) && error.response?.data?.message) {
                setErrors({ general: error.response.data.message as string });
            } else {
                setErrors({ general: 'Failed to record movement. Please try again.' });
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="m-4 w-full max-w-2xl rounded-xl bg-white p-6 shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="mb-5 flex items-center gap-3">
                    <div className="rounded-lg bg-slate-900 p-2 text-white">
                        <ArrowRightLeft className="h-5 w-5" />
                    </div>
                    <h2 className="text-xl font-semibold text-slate-900">Record Stock Movement</h2>
                    <button
                        onClick={onClose}
                        className="ml-auto rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                        <div>
                            <label className="mb-1 block text-xs font-medium text-slate-700">Product *</label>
                            <select
                                value={itemId}
                                onChange={(e) => setItemId(e.target.value)}
                                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                                disabled={isSubmitting}
                            >
                                <option value="">Select product</option>
                                {items.map((item) => (
                                    <option key={item.id} value={item.id}>
                                        {item.name} ({item.sku}){item.is_active ? '' : ' - Inactive'}
                                    </option>
                                ))}
                            </select>
                            {errors.item_id && <p className="mt-1 text-xs text-red-600">{errors.item_id}</p>}
                        </div>

                        <div>
                            <label className="mb-1 block text-xs font-medium text-slate-700">Movement Type *</label>
                            <select
                                value={movementType}
                                onChange={(e) => setMovementType(e.target.value as MovementType)}
                                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                                disabled={isSubmitting}
                            >
                                {movementOptions.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="mb-1 block text-xs font-medium text-slate-700">Quantity *</label>
                            <input
                                type="number"
                                min="0.01"
                                step="0.01"
                                value={quantity}
                                onChange={(e) => setQuantity(e.target.value)}
                                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                                disabled={isSubmitting}
                                placeholder="0.00"
                            />
                            {errors.quantity && <p className="mt-1 text-xs text-red-600">{errors.quantity}</p>}
                        </div>

                        {movementType === 'adjustment' && (
                            <div>
                                <label className="mb-1 block text-xs font-medium text-slate-700">Adjustment Mode *</label>
                                <select
                                    value={adjustmentMode}
                                    onChange={(e) => setAdjustmentMode(e.target.value as AdjustmentMode)}
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                                    disabled={isSubmitting}
                                >
                                    <option value="increase">Increase</option>
                                    <option value="decrease">Decrease</option>
                                    <option value="set">Set Exact Quantity</option>
                                </select>
                            </div>
                        )}

                        {requiresFromLocation && (
                            <div>
                                <label className="mb-1 block text-xs font-medium text-slate-700">From Location *</label>
                                <select
                                    value={fromLocationId}
                                    onChange={(e) => setFromLocationId(e.target.value)}
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                                    disabled={isSubmitting}
                                >
                                    <option value="">Select source location</option>
                                    {locations.map((location) => (
                                        <option key={location.id} value={location.id}>
                                            {location.name}
                                        </option>
                                    ))}
                                </select>
                                {errors.from_location_id && <p className="mt-1 text-xs text-red-600">{errors.from_location_id}</p>}
                            </div>
                        )}

                        {requiresToLocation && (
                            <div>
                                <label className="mb-1 block text-xs font-medium text-slate-700">To Location *</label>
                                <select
                                    value={toLocationId}
                                    onChange={(e) => setToLocationId(e.target.value)}
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                                    disabled={isSubmitting}
                                >
                                    <option value="">Select destination location</option>
                                    {locations.map((location) => (
                                        <option key={location.id} value={location.id}>
                                            {location.name}
                                        </option>
                                    ))}
                                </select>
                                {errors.to_location_id && <p className="mt-1 text-xs text-red-600">{errors.to_location_id}</p>}
                            </div>
                        )}
                    </div>

                    <div>
                        <label className="mb-1 block text-xs font-medium text-slate-700">Notes</label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                            rows={3}
                            disabled={isSubmitting}
                            placeholder="Optional notes or reference"
                        />
                    </div>

                    {errors.general && (
                        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                            {errors.general}
                        </div>
                    )}

                    <div className="flex justify-end gap-2 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                            disabled={isSubmitting}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
                            disabled={isSubmitting}
                        >
                            {isSubmitting && <LoaderCircle className="h-4 w-4 animate-spin" />}
                            Save Movement
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
