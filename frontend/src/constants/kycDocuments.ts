import { Building2, User, Leaf } from 'lucide-react';
import type { KYCDocumentType } from '../types';

// Document definitions matching backend REQUIRED_DOCUMENTS
export const documentDefinitions: {
  type: KYCDocumentType;
  name: string;
  description: string;
  required: boolean;
  category: 'company' | 'representative' | 'optional';
}[] = [
  // Company Documents (4 required)
  {
    type: 'REGISTRATION',
    name: 'Business Registration Certificate',
    description: 'Official document from company registry showing company name and registration number',
    required: true,
    category: 'company',
  },
  {
    type: 'TAX_CERTIFICATE',
    name: 'Tax Registration Certificate',
    description: 'Proof of tax registration and compliance with tax authorities',
    required: true,
    category: 'company',
  },
  {
    type: 'ARTICLES',
    name: 'Articles of Association',
    description: 'Corporate bylaws showing ownership structure and decision-making authority',
    required: true,
    category: 'company',
  },
  {
    type: 'FINANCIAL_STATEMENTS',
    name: 'Latest Financial Statements',
    description: 'Recent audited financial statements (balance sheet, income statement)',
    required: true,
    category: 'company',
  },
  // Representative Documents (3 required)
  {
    type: 'ID',
    name: 'Government-Issued ID',
    description: 'Valid passport or national ID card of authorized representative',
    required: true,
    category: 'representative',
  },
  {
    type: 'PROOF_AUTHORITY',
    name: 'Proof of Authority',
    description: 'Power of Attorney or board resolution authorizing representative',
    required: true,
    category: 'representative',
  },
  {
    type: 'CONTACT_INFO',
    name: 'Representative Contact Information',
    description: 'Official contact details and verification of representative',
    required: true,
    category: 'representative',
  },
  // Optional Document
  {
    type: 'GHG_PERMIT',
    name: 'GHG Emissions Permit',
    description: 'Required only for EU ETS installation operators',
    required: false,
    category: 'optional',
  },
];

export const documentCategories = [
  {
    id: 'company' as const,
    name: 'Company Documents',
    icon: Building2,
    color: '#3b82f6',
  },
  {
    id: 'representative' as const,
    name: 'Representative Documents',
    icon: User,
    color: '#8b5cf6',
  },
  {
    id: 'optional' as const,
    name: 'Optional Documents',
    icon: Leaf,
    color: '#10b981',
  },
];

export const REQUIRED_DOCUMENT_COUNT = documentDefinitions.filter(d => d.required).length; // 7

export function getDocumentDefinition(type: KYCDocumentType) {
  return documentDefinitions.find(d => d.type === type);
}

export function getDocumentsByCategory(category: 'company' | 'representative' | 'optional') {
  return documentDefinitions.filter(d => d.category === category);
}
