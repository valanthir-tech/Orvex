import { create } from 'zustand';
import { UserRole } from '../rbac';

interface CompanySettings {
  companyName: string;
  panNumber: string;
  fiscalYear: string;
  currency: string;
  phone: string;
  address: string;
}

interface PrintTemplateSettings {
  paperFormat: 'A4' | 'A5' | '80mm';
  showLogo: boolean;
  showPAN: boolean;
  showBSDate: boolean;
  showAmountInWords: boolean;
  showSignatureLine: boolean;
  showQRCode: boolean;
}

interface ERPState {
  currentRole: UserRole;
  setRole: (role: UserRole) => void;
  company: CompanySettings;
  updateCompany: (settings: Partial<CompanySettings>) => void;
  printTemplate: PrintTemplateSettings;
  updatePrintTemplate: (settings: Partial<PrintTemplateSettings>) => void;
  language: 'en' | 'ne';
  setLanguage: (lang: 'en' | 'ne') => void;
}

export const useERPStore = create<ERPState>((set) => ({
  currentRole: 'Owner',
  setRole: (currentRole) => set({ currentRole }),

  company: {
    companyName: 'Onedexo Retail & Trading Pvt. Ltd.',
    panNumber: '609876543',
    fiscalYear: '2081/82',
    currency: 'NPR',
    phone: '+977-1-5912345',
    address: 'New Road, Ward No. 22, Kathmandu, Nepal',
  },
  updateCompany: (settings) =>
    set((state) => ({ company: { ...state.company, ...settings } })),

  printTemplate: {
    paperFormat: 'A4',
    showLogo: true,
    showPAN: true,
    showBSDate: true,
    showAmountInWords: true,
    showSignatureLine: true,
    showQRCode: true,
  },
  updatePrintTemplate: (settings) =>
    set((state) => ({ printTemplate: { ...state.printTemplate, ...settings } })),

  language: 'en',
  setLanguage: (language) => set({ language }),
}));
