/**
 * Funding-related types
 */

export interface FundingInstructions {
  bank_name: string;
  account_name: string;
  account_number: string;
  iban?: string;
  swift_code?: string;
  routing_number?: string;
  currency: string;
  reference_format: string;
  notes?: string;
}
