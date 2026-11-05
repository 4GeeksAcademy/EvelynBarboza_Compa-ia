export type SupplierCountry =
  | "USA"
  | "Spain";


export type SupplierCurrency =
  | "USD"
  | "EUR";


export type SupplierStatus =
  | "active"
  | "suspended";


export type SupplierCategory =
  | "carrier_last_mile"
  | "carrier_international"
  | "warehouse_supplies"
  | "packaging_materials"
  | "reverse_logistics"
  | "fleet_maintenance"
  | "it_and_wms_software"
  | "cleaning_and_facilities";


export interface Supplier {
  id: number;
  name: string;
  country: SupplierCountry;
  categories: SupplierCategory[];
  rate_per_shipment: number;
  currency: SupplierCurrency;
  updated_at: string;
  status: SupplierStatus;
  service_zone?: string | null;
  contact_email?: string | null;
  notes?: string | null;
}


export interface SupplierCreatePayload {
  name: string;
  country: SupplierCountry;
  categories: SupplierCategory[];
  rate_per_shipment: number;
  currency: SupplierCurrency;
  status: SupplierStatus;
  service_zone?: string;
  contact_email?: string;
  notes?: string;
}


export interface SupplierRateUpdatePayload {
  rate_per_shipment: number;
}


export interface SupplierStatusUpdatePayload {
  status: SupplierStatus;
}


export interface DeleteSupplierResponse {
  message: string;
}
