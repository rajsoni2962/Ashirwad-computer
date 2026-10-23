/**
 * Invoice Draft Management Engine
 * Provides persistent saving, auto-saving, resuming, and management of half-filled bills.
 * Uses localStorage for instantaneous zero-latency access with server-sync fallback.
 */

export interface InvoiceDraftItem {
  productId: string;
  product?: any;
  isService?: boolean;
  serialNumber?: string;
  description: string;
  hsn: string;
  quantity: number;
  unit: string;
  rate: number;
  discount: number;
  gstPercent: number;
  taxableAmount: number;
  gstAmount: number;
  total: number;
  availableSerials?: string[];
}

export interface InvoiceDraft {
  id: string;
  title: string;
  updatedAt: string;
  createdAt: string;
  invoiceType: string;
  taxConfiguration: string;
  customerId: string;
  customerName?: string;
  customerPhone?: string;
  date: string;
  dueDate: string;
  paymentMode: string;
  paidAmount: string;
  paymentReference: string;
  notes: string;
  terms: string;
  overallDiscountPercent: string;
  items: InvoiceDraftItem[];
  grandTotal: number;
  itemCount: number;
}

const STORAGE_KEY_SAVED_DRAFTS = 'apna_vyaapar_saved_drafts';
const STORAGE_KEY_ACTIVE_DRAFT_ID = 'apna_vyaapar_active_draft_id';

export function getLocalDrafts(): InvoiceDraft[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SAVED_DRAFTS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error('Failed to read invoice drafts from localStorage:', e);
    return [];
  }
}

export function saveLocalDraft(draft: Partial<InvoiceDraft> & { id?: string }): InvoiceDraft {
  if (typeof window === 'undefined') {
    return draft as InvoiceDraft;
  }

  const existing = getLocalDrafts();
  const draftId = draft.id || `draft_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();

  const customerName = draft.customerName || (draft as any).selectedCustomer?.name || 'Walk-in Customer';
  const itemCount = draft.items?.filter((it) => it.description || it.productId)?.length || 0;
  const grandTotal = Number(draft.grandTotal) || 0;

  const title =
    customerName !== 'Walk-in Customer'
      ? `Draft for ${customerName}`
      : itemCount > 0
      ? `Draft (${itemCount} item${itemCount > 1 ? 's' : ''})`
      : 'Untitled Draft Bill';

  const completeDraft: InvoiceDraft = {
    id: draftId,
    title: draft.title || title,
    createdAt: draft.createdAt || now,
    updatedAt: now,
    invoiceType: draft.invoiceType || 'NON_GST',
    taxConfiguration: draft.taxConfiguration || 'NONE',
    customerId: draft.customerId || '',
    customerName,
    customerPhone: draft.customerPhone || '',
    date: draft.date || new Date().toISOString().split('T')[0],
    dueDate: draft.dueDate || '',
    paymentMode: draft.paymentMode || 'Cash',
    paidAmount: draft.paidAmount !== undefined ? String(draft.paidAmount) : '',
    paymentReference: draft.paymentReference || '',
    notes: draft.notes !== undefined ? draft.notes : 'Professionally refurbished, fully tested, and ready to use. Clean, reliable, and backed by quality service.',
    terms: draft.terms || '',
    overallDiscountPercent: draft.overallDiscountPercent || '0',
    items: Array.isArray(draft.items) ? draft.items : [],
    grandTotal,
    itemCount,
  };

  const filtered = existing.filter((d) => d.id !== draftId);
  const updated = [completeDraft, ...filtered];

  try {
    localStorage.setItem(STORAGE_KEY_SAVED_DRAFTS, JSON.stringify(updated));
    localStorage.setItem(STORAGE_KEY_ACTIVE_DRAFT_ID, draftId);
  } catch (e) {
    console.warn('Storage quota exceeded for drafts:', e);
  }

  // Background server sync (non-blocking)
  fetch('/api/invoices/drafts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(completeDraft),
  }).catch(() => {});

  return completeDraft;
}

export function getActiveDraft(): InvoiceDraft | null {
  if (typeof window === 'undefined') return null;
  const drafts = getLocalDrafts();
  if (drafts.length === 0) return null;

  const activeId = localStorage.getItem(STORAGE_KEY_ACTIVE_DRAFT_ID);
  if (activeId) {
    const found = drafts.find((d) => d.id === activeId);
    if (found) return found;
  }

  // Fallback to most recently updated draft
  drafts.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  return drafts[0] || null;
}

export function deleteLocalDraft(id: string) {
  if (typeof window === 'undefined') return;
  const drafts = getLocalDrafts();
  const updated = drafts.filter((d) => d.id !== id);
  try {
    localStorage.setItem(STORAGE_KEY_SAVED_DRAFTS, JSON.stringify(updated));
    if (localStorage.getItem(STORAGE_KEY_ACTIVE_DRAFT_ID) === id) {
      localStorage.removeItem(STORAGE_KEY_ACTIVE_DRAFT_ID);
    }
  } catch (e) {}

  // Background sync
  fetch(`/api/invoices/drafts?id=${encodeURIComponent(id)}`, {
    method: 'DELETE',
  }).catch(() => {});
}

export function clearActiveDraftId() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY_ACTIVE_DRAFT_ID);
}
