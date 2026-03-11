export type DocumentType = 'invoice' | 'payment' | 'goods' | 'letter';

export type InvoiceItem = {
  id: string;
  description: string;
  total: number;
};

export type GoodsItem = {
  id: string;
  description: string;
  quantity: number;
  unit: string;
};

export type AppDocument = {
  id: string;
  type: DocumentType;
  date: string;
  createdAt: number;
  title: string;
  
  // Invoice specific
  to?: string;
  name?: string;
  items?: InvoiceItem[];
  totalAmount?: number;
  walletTether?: string;
  
  // Payment specific
  payer?: string;
  payee?: string;
  amount?: number;
  amountInWords?: string;
  paymentFor?: string;
  paymentMethod?: string;
  referenceNo?: string;
  
  // Goods specific
  sender?: string;
  receiver?: string;
  goodsItems?: GoodsItem[];
  deliveryDate?: string;
  driverName?: string;
  
  // Letter specific
  recipient?: string;
  subject?: string;
  body?: string;
  senderName?: string;
  senderTitle?: string;
};

const STORAGE_KEY = "dej_tv_documents";
const LEGACY_STORAGE_KEY = "dej_tv_invoices";

export const getDocuments = (): AppDocument[] => {
  if (typeof window === "undefined") return [];
  
  // Migrate legacy invoices if they exist
  const legacyData = localStorage.getItem(LEGACY_STORAGE_KEY);
  if (legacyData) {
    try {
      const legacyInvoices = JSON.parse(legacyData);
      const migrated: AppDocument[] = legacyInvoices.map((inv: any) => ({
        ...inv,
        type: 'invoice',
        title: inv.name || 'Invoice',
      }));
      
      const existingDocs = localStorage.getItem(STORAGE_KEY);
      const docs = existingDocs ? JSON.parse(existingDocs) : [];
      
      const combined = [...docs, ...migrated];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(combined));
      localStorage.removeItem(LEGACY_STORAGE_KEY);
      return combined;
    } catch (e) {
      console.error("Migration failed", e);
    }
  }

  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
};

export const getDocument = (id: string): AppDocument | undefined => {
  const docs = getDocuments();
  return docs.find((doc) => doc.id === id);
};

export const saveDocument = (doc: AppDocument) => {
  const docs = getDocuments();
  const index = docs.findIndex(d => d.id === doc.id);
  if (index >= 0) {
    docs[index] = doc;
  } else {
    docs.push(doc);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(docs));
};

export const deleteDocument = (id: string) => {
  const docs = getDocuments();
  const filtered = docs.filter((doc) => doc.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
};
