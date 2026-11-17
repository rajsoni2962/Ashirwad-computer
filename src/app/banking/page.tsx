'use client';

import React, { useState, useEffect } from 'react';
import {
  Landmark,
  Wallet,
  ArrowRightLeft,
  Plus,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertCircle,
  Building2,
  QrCode,
  DollarSign,
  ArrowUpRight,
  ArrowDownLeft,
  X,
  CreditCard,
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';

interface BankAccount {
  id: string;
  accountName: string;
  accountType: 'BANK' | 'CASH';
  bankName?: string | null;
  accountNumber?: string | null;
  ifscCode?: string | null;
  upiId?: string | null;
  openingBalance: number;
  currentBalance: number;
  isDefault: boolean;
  isActive: boolean;
  _count?: {
    payments: number;
    contraFrom: number;
    contraTo: number;
  };
}

interface ContraTransfer {
  id: string;
  transferNumber: string;
  date: string;
  amount: number;
  referenceNumber?: string | null;
  notes?: string | null;
  fromAccount: {
    id: string;
    accountName: string;
    accountType: string;
    bankName?: string | null;
  };
  toAccount: {
    id: string;
    accountName: string;
    accountType: string;
    bankName?: string | null;
  };
}

export default function BankingPage() {
  const [activeTab, setActiveTab] = useState<'ACCOUNTS' | 'CONTRA'>('ACCOUNTS');
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [contraTransfers, setContraTransfers] = useState<ContraTransfer[]>([]);
  const [summary, setSummary] = useState({
    totalCash: 0,
    totalBank: 0,
    totalLiquidity: 0,
    totalAccounts: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showContraModal, setShowContraModal] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Add Account Form
  const [accountName, setAccountName] = useState('');
  const [accountType, setAccountType] = useState<'BANK' | 'CASH'>('BANK');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [upiId, setUpiId] = useState('');
  const [openingBalance, setOpeningBalance] = useState('0');
  const [isDefault, setIsDefault] = useState(false);

  // Contra Transfer Form
  const [fromAccountId, setFromAccountId] = useState('');
  const [toAccountId, setToAccountId] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferDate, setTransferDate] = useState(new Date().toISOString().split('T')[0]);
  const [transferRef, setTransferRef] = useState('');
  const [transferNotes, setTransferNotes] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [accRes, contraRes] = await Promise.all([
        fetch('/api/banking/accounts'),
        fetch('/api/banking/contra'),
      ]);

      const accData = await accRes.json();
      const contraData = await contraRes.json();

      if (accData.success) {
        setAccounts(accData.data || []);
        if (accData.summary) setSummary(accData.summary);
      }

      if (contraData.success) {
        setContraTransfers(contraData.data || []);
      }
    } catch (err) {
      console.error('Failed to load banking data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountName.trim()) {
      setModalError('Account name is required');
      return;
    }

    setModalLoading(true);
    setModalError(null);

    try {
      const res = await fetch('/api/banking/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountName: accountName.trim(),
          accountType,
          bankName: bankName.trim() || undefined,
          accountNumber: accountNumber.trim() || undefined,
          ifscCode: ifscCode.trim() || undefined,
          upiId: upiId.trim() || undefined,
          openingBalance: parseFloat(openingBalance) || 0,
          isDefault,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to create account');
      }

      setShowAddModal(false);
      resetAddForm();
      setSuccessToast(`Account "${accountName}" added successfully.`);
      fetchData();
    } catch (err: any) {
      setModalError(err.message || 'Error creating account');
    } finally {
      setModalLoading(false);
    }
  };

  const handleCreateContra = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fromAccountId || !toAccountId) {
      setModalError('Select both source and destination accounts');
      return;
    }

    if (fromAccountId === toAccountId) {
      setModalError('Source and destination accounts must be different');
      return;
    }

    const amt = parseFloat(transferAmount);
    if (!amt || amt <= 0) {
      setModalError('Enter a valid transfer amount greater than 0');
      return;
    }

    setModalLoading(true);
    setModalError(null);

    try {
      const res = await fetch('/api/banking/contra', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromAccountId,
          toAccountId,
          amount: amt,
          date: transferDate,
          referenceNumber: transferRef.trim() || undefined,
          notes: transferNotes.trim() || undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to record contra transfer');
      }

      setShowContraModal(false);
      resetContraForm();
      setSuccessToast('Contra transfer completed successfully.');
      fetchData();
    } catch (err: any) {
      setModalError(err.message || 'Error recording contra transfer');
    } finally {
      setModalLoading(false);
    }
  };

  const resetAddForm = () => {
    setAccountName('');
    setAccountType('BANK');
    setBankName('');
    setAccountNumber('');
    setIfscCode('');
    setUpiId('');
    setOpeningBalance('0');
    setIsDefault(false);
    setModalError(null);
  };

  const resetContraForm = () => {
    setFromAccountId('');
    setToAccountId('');
    setTransferAmount('');
    setTransferDate(new Date().toISOString().split('T')[0]);
    setTransferRef('');
    setTransferNotes('');
    setModalError(null);
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Landmark className="w-5 h-5 text-slate-700" />
            Cash & Bank Accounts
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitor bank accounts, register cash in hand, and record contra transfers
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              resetContraForm();
              setShowContraModal(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 shadow-xs transition"
          >
            <ArrowRightLeft className="w-4 h-4 text-slate-500" />
            <span>Contra Transfer</span>
          </button>

          <button
            onClick={() => {
              resetAddForm();
              setShowAddModal(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add Bank Account</span>
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {successToast && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successToast}</span>
          </div>
          <button onClick={() => setSuccessToast(null)} className="text-emerald-700 hover:text-emerald-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Liquidity KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total Available Liquidity</span>
            <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-2 tabular-nums">
            {formatCurrency(summary.totalLiquidity)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
            <span>Across all active bank and cash registers</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total Bank Balance</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center">
              <Landmark className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-blue-900 mt-2 tabular-nums">
            {formatCurrency(summary.totalBank)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            In {accounts.filter((a) => a.accountType === 'BANK').length} bank accounts
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Cash in Hand</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-900 mt-2 tabular-nums">
            {formatCurrency(summary.totalCash)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Physical counter cash register
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('ACCOUNTS')}
          className={`pb-2.5 px-3 border-b-2 transition ${
            activeTab === 'ACCOUNTS'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Accounts Overview ({accounts.length})
        </button>
        <button
          onClick={() => setActiveTab('CONTRA')}
          className={`pb-2.5 px-3 border-b-2 transition ${
            activeTab === 'CONTRA'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Contra Transfers History ({contraTransfers.length})
        </button>
      </div>

      {/* Tab 1: Accounts Grid */}
      {activeTab === 'ACCOUNTS' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? (
            <div className="col-span-full py-12 text-center text-slate-400">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-slate-500" />
              <span>Loading bank registers...</span>
            </div>
          ) : accounts.length === 0 ? (
            <div className="col-span-full py-12 text-center bg-white rounded-xl border border-slate-200 p-8">
              <Building2 className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700">No bank accounts configured</p>
              <button
                onClick={() => setShowAddModal(true)}
                className="mt-3 px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold"
              >
                Add Primary Bank Account
              </button>
            </div>
          ) : (
            accounts.map((acc) => (
              <div
                key={acc.id}
                className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                          acc.accountType === 'CASH'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-100 text-slate-800 border border-slate-200'
                        }`}
                      >
                        {acc.accountType === 'CASH' ? (
                          <Wallet className="w-4 h-4" />
                        ) : (
                          <Landmark className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900 text-sm flex items-center gap-1.5">
                          <span>{acc.accountName}</span>
                          {acc.isDefault && (
                            <span className="text-[10px] font-medium px-1.5 py-0.2 bg-slate-100 text-slate-700 rounded border border-slate-200">
                              Default
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {acc.bankName || (acc.accountType === 'CASH' ? 'Cash Register' : 'Bank Account')}
                        </div>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        acc.accountType === 'CASH'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-blue-50 text-blue-700 border border-blue-200'
                      }`}
                    >
                      {acc.accountType}
                    </span>
                  </div>

                  {acc.accountType === 'BANK' && (
                    <div className="mt-4 p-2.5 bg-slate-50/70 rounded-lg border border-slate-200/60 text-[11px] space-y-1 font-mono text-slate-600">
                      {acc.accountNumber && (
                        <div className="flex justify-between">
                          <span className="text-slate-400 font-sans">A/C:</span>
                          <span className="font-semibold text-slate-800">{acc.accountNumber}</span>
                        </div>
                      )}
                      {acc.ifscCode && (
                        <div className="flex justify-between">
                          <span className="text-slate-400 font-sans">IFSC:</span>
                          <span className="font-semibold text-slate-800">{acc.ifscCode}</span>
                        </div>
                      )}
                      {acc.upiId && (
                        <div className="flex justify-between">
                          <span className="text-slate-400 font-sans">UPI:</span>
                          <span className="font-semibold text-slate-800">{acc.upiId}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 flex items-end justify-between">
                  <div>
                    <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                      Current Balance
                    </div>
                    <div className="text-lg font-bold font-mono text-slate-900 mt-0.5 tabular-nums">
                      {formatCurrency(acc.currentBalance)}
                    </div>
                  </div>

                  <div className="text-right text-[11px] text-slate-400">
                    <span>
                      {(acc._count?.payments || 0) +
                        (acc._count?.contraFrom || 0) +
                        (acc._count?.contraTo || 0)}{' '}
                      txns
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 2: Contra Transfers Table */}
      {activeTab === 'CONTRA' && (
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-slate-400 flex items-center justify-center gap-2">
              <RefreshCw className="w-5 h-5 animate-spin" />
              <span>Loading contra ledger...</span>
            </div>
          ) : contraTransfers.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <ArrowRightLeft className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              <p className="font-medium">No contra transfers recorded</p>
              <p className="text-xs text-slate-400 mt-1">
                Record bank deposits, cash withdrawals, or bank-to-bank fund transfers.
              </p>
              <button
                onClick={() => {
                  resetContraForm();
                  setShowContraModal(true);
                }}
                className="mt-3 px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-semibold"
              >
                Record Contra Transfer
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200/80 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Transfer #</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">From (Source)</th>
                    <th className="py-3 px-4">To (Destination)</th>
                    <th className="py-3 px-4 text-right">Amount</th>
                    <th className="py-3 px-4">Reference / Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {contraTransfers.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-4 font-mono font-semibold text-slate-900 tabular-nums">
                        {c.transferNumber}
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-mono tabular-nums">
                        {formatDate(c.date)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-800 flex items-center gap-1.5">
                          <ArrowUpRight className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                          <span>{c.fromAccount?.accountName}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-800 flex items-center gap-1.5">
                          <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>{c.toAccount?.accountName}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 tabular-nums">
                        {formatCurrency(c.amount)}
                      </td>
                      <td className="py-3 px-4 text-slate-500 max-w-xs truncate">
                        {c.referenceNumber ? `Ref: ${c.referenceNumber}` : ''}
                        {c.notes ? ` • ${c.notes}` : ''}
                        {!c.referenceNumber && !c.notes ? '—' : ''}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modal 1: Add Bank Account */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6 border border-slate-200 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-white">
                  <Landmark className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Add Account Register</h3>
                  <p className="text-xs text-slate-500">Configure bank account or cash counter</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {modalError && (
              <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleCreateAccount} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Account Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAccountType('BANK')}
                    className={`py-2 px-3 rounded-lg border font-semibold text-center transition ${
                      accountType === 'BANK'
                        ? 'border-slate-900 bg-slate-900 text-white'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    Bank Account
                  </button>
                  <button
                    type="button"
                    onClick={() => setAccountType('CASH')}
                    className={`py-2 px-3 rounded-lg border font-semibold text-center transition ${
                      accountType === 'CASH'
                        ? 'border-slate-900 bg-slate-900 text-white'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    Cash Register
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Account Display Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  placeholder="e.g. Kotak Current A/C, Cash in Hand"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-slate-900"
                />
              </div>

              {accountType === 'BANK' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-600 font-medium mb-1">Bank Name</label>
                      <input
                        type="text"
                        value={bankName}
                        onChange={(e) => setBankName(e.target.value)}
                        placeholder="e.g. Kotak Mahindra Bank"
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 font-medium mb-1">Account Number</label>
                      <input
                        type="text"
                        value={accountNumber}
                        onChange={(e) => setAccountNumber(e.target.value)}
                        placeholder="e.g. 5947557983"
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono text-slate-900 focus:outline-none focus:border-slate-900"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-600 font-medium mb-1">IFSC Code</label>
                      <input
                        type="text"
                        value={ifscCode}
                        onChange={(e) => setIfscCode(e.target.value)}
                        placeholder="e.g. KKBK0000879"
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono uppercase text-slate-900 focus:outline-none focus:border-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 font-medium mb-1">UPI ID</label>
                      <input
                        type="text"
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                        placeholder="e.g. name@okaxis"
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono text-slate-900 focus:outline-none focus:border-slate-900"
                      />
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="block text-slate-600 font-medium mb-1">Opening Balance (₹)</label>
                <input
                  type="number"
                  step="any"
                  value={openingBalance}
                  onChange={(e) => setOpeningBalance(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono tabular-nums text-slate-900 focus:outline-none focus:border-slate-900"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer pt-1 text-slate-700">
                <input
                  type="checkbox"
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                  className="rounded text-slate-900 focus:ring-slate-900"
                />
                <span>Set as default account for receipts</span>
              </label>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg shadow-xs transition disabled:opacity-50"
                >
                  {modalLoading ? 'Saving...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Contra Transfer */}
      {showContraModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6 border border-slate-200 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-white">
                  <ArrowRightLeft className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Record Contra Transfer</h3>
                  <p className="text-xs text-slate-500">Deposit, withdraw, or transfer funds between registers</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowContraModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {modalError && (
              <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleCreateContra} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  From Account (Source) <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={fromAccountId}
                  onChange={(e) => setFromAccountId(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-slate-900"
                >
                  <option value="">Select source account...</option>
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.accountName} ({formatCurrency(acc.currentBalance)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  To Account (Destination) <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={toAccountId}
                  onChange={(e) => setToAccountId(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-slate-900"
                >
                  <option value="">Select destination account...</option>
                  {accounts
                    .filter((a) => a.id !== fromAccountId)
                    .map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.accountName} ({formatCurrency(acc.currentBalance)})
                      </option>
                    ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Amount (₹) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={transferAmount}
                    onChange={(e) => setTransferAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono tabular-nums font-bold text-slate-900 focus:outline-none focus:border-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={transferDate}
                    onChange={(e) => setTransferDate(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono text-slate-900 focus:outline-none focus:border-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Reference / Cheque #</label>
                <input
                  type="text"
                  value={transferRef}
                  onChange={(e) => setTransferRef(e.target.value)}
                  placeholder="e.g. UTR12345678, Cheque #000123"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono text-slate-900 focus:outline-none focus:border-slate-900"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Notes / Narration</label>
                <input
                  type="text"
                  value={transferNotes}
                  onChange={(e) => setTransferNotes(e.target.value)}
                  placeholder="e.g. Cash deposit to current account"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-slate-900"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowContraModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg shadow-xs transition disabled:opacity-50"
                >
                  {modalLoading ? 'Processing...' : 'Transfer Funds'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
