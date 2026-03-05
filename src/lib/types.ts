export interface BidParameter {
  id: string;
  name: string;
  options: string[];
}

export interface Bid {
  id: string;
  title: string;
  description: string;
  deadline: string;
  created_at: string;
  parameters: BidParameter[];
  files: { id: string; filename: string }[];
}

export interface VendorPrice {
  combination_key: string;
  price: number;
}

export interface VendorResponse {
  id: string;
  bid_id: string;
  vendor_name: string;
  submitted_at: string;
  prices: VendorPrice[];
}
