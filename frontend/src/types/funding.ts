/**
 * Funding-related types
 */

export interface FundingInstructions {
  bankName: string;
  bankAddress?: string;
  accountName: string;
  accountNumber: string;
  iban?: string;
  swiftCode?: string;
  swiftBic?: string;
  routingNumber?: string;
  currency?: string;
  referenceFormat?: string;
  referenceInstructions?: string;
  supportedCurrencies?: string[];
  processingTime?: string;
  notes?: string;
}
