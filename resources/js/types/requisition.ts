export type RequisitionItem = {
  id: number;
  item_id: number;
  quantity: number;
  item: {
    id: number;
    name: string;
    sku: string;
    quantity: number;
    unit_of_measure?: {
      abbreviation: string;
    };
  };
};

export type Requisition = {
  id: number;
  reference_number?: string;
  requested_by: number;
  item_id: number;
  quantity: number;
  status: 'pending' | 'approved' | 'declined';
  location_id: number;
  created_at: string;
  updated_at: string;
  admin_notes?: string; // Make sure this is defined as optional
  reviewed_by?: number;
  reviewed_at?: string;
  created_by?: {
    id: number;
    name: string;
  };
  reviewed_by_user?: { // Add this to match your relationship name if needed
    id: number;
    name: string;
  };
  item?: {
    id: number;
    name: string;
    sku: string;
    quantity: number;
    unit_of_measure?: {
      abbreviation: string;
    };
  };
  location?: {
    id: number;
    name: string;
  };
};
