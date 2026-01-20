import type { CertificateType } from './index';

// Liquidity Creation Types
export interface LiquidityPlan {
  certificate_type: CertificateType;
  bid_eur: number;
  ask_eur: number;
}

export interface LiquidityPreviewAllocation {
  market_maker_id: string;
  market_maker_name: string;
  bid_quantity: number;
  ask_quantity: number;
  bid_value_eur: number;
  ask_value_eur: number;
}

export interface LiquidityPreviewPriceLevels {
  bid_price_range: {
    min: number;
    max: number;
    count: number;
  };
  ask_price_range: {
    min: number;
    max: number;
    count: number;
  };
}

export interface LiquidityPreviewResponse {
  certificate_type: CertificateType;
  bid_eur: number;
  ask_eur: number;
  allocations: LiquidityPreviewAllocation[];
  price_levels: LiquidityPreviewPriceLevels;
  total_bid_quantity: number;
  total_ask_quantity: number;
  market_makers_count: number;
  can_create: boolean;
  message: string;
}

export interface LiquidityCreationRequest {
  certificate_type: CertificateType;
  bid_eur: number;
  ask_eur: number;
}

export interface LiquidityCreationResponse {
  success: boolean;
  message: string;
  certificate_type: CertificateType;
  bid_eur: number;
  ask_eur: number;
  orders_created: number;
  market_makers_used: number;
  ticket_id?: string;
}
