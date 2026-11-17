'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Shield,
  UserCheck,
  Edit,
  Trash2,
  Key,
  X,
  RefreshCw,
  Building2,
  CheckCircle2,
} from 'lucide-react';

export default function UserManagementPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [formData, setFormData] = useState({
    username: '',
    name: '',
    password: '',
    email: '',
    phone: '',
    role: 'staff',
    businessProfileId: '',
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [uRes, pRes] = await Promise.all([
        fetch('/api/users').then((r) => r.json()),
        fetch('/api/business-profiles').then((r) => r.json()),
      ]);

      if (uRes.success) setUsers(uRes.data || []);
      if (pRes.success) setProfiles(pRes.data || []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openAddModal = () => {
    setEditingUser(null);
    setFormData({
      username: '',
      name: '',
      password: '',
      email: '',
      phone: '',
      role: 'staff',
      businessProfileId: profiles[0]?.id || '',
    });
    setErrorMsg('');
    setShowModal(true);
  };

  const openEditModal = (u: any) => {
    setEditingUser(u);
    setFormData({
      username: u.username,
      name: u.name,
      password: '', // leave empty unless changing
      email: u.email || '',
      phone: u.phone || '',
      role: u.role || 'staff',
      businessProfileId: u.businessProfileId || '',
    });
    setErrorMsg('');
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const url = editingUser ? `/api/users/${editingUser.id}` : '/api/users';
      const method = editingUser ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const json = await res.json();
      if (json.success) {
        setSuccessMsg(editingUser ? 'User account updated successfully!' : 'New user created successfully!');
        setShowModal(false);
        fetchData();
      } else {
        setErrorMsg(json.error || 'Failed to save user');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error saving user');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (u: any) => {
    if (!confirm(`Are you sure you want to delete user account "${u.name}" (${u.username})?`)) return;
    try {
      const res = await fetch(`/api/users/${u.id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        fetchData();
      } else {
        alert(json.error || 'Failed to delete user');
      }
    } catch (err: any) {
      alert(err.message || 'Error deleting user');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>User Accounts</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Store operators, billing clerks, and administrators with role-based access control.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl shadow-xs transition self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add User</span>
        </button>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-2xl flex items-center gap-2 font-medium">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] font-bold border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">User</th>
                <th className="py-3.5 px-4">Role</th>
                <th className="py-3.5 px-4">Assigned Business Profile</th>
                <th className="py-3.5 px-4">Contact</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">Loading user accounts...</td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">No users found.</td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                          {u.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900">{u.name}</div>
                          <div className="text-[11px] font-mono text-slate-500">@{u.username}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      {u.role === 'admin' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                          <Shield className="w-3 h-3 text-amber-600" />
                          Administrator
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          <UserCheck className="w-3 h-3 text-blue-600" />
                          Staff Member
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        <span>{u.businessProfile?.name || 'All Profiles (Unrestricted)'}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      <div>{u.email || '-'}</div>
                      <div className="text-[10px] font-mono">{u.phone || ''}</div>
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap space-x-1.5">
                      <button
                        onClick={() => openEditModal(u)}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition"
                        title="Edit User"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(u)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                        title="Delete User"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl p-6 border border-slate-200 my-8 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900">
                {editingUser ? 'Edit User Account' : 'Add New User Account'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Username *</label>
                  <input
                    type="text"
                    required
                    disabled={Boolean(editingUser)}
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase().trim() })}
                    placeholder="e.g. rahul_staff"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono disabled:bg-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Display Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {editingUser ? 'New Password (leave blank to keep current)' : 'Password *'}
                </label>
                <input
                  type="password"
                  required={!editingUser}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder={editingUser ? '••••••••' : 'Enter login password'}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">User Role</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs"
                  >
                    <option value="admin">Administrator (Full Access)</option>
                    <option value="staff">Staff Member (Billing & Inventory)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Assigned Business Branch</label>
                  <select
                    value={formData.businessProfileId}
                    onChange={(e) => setFormData({ ...formData, businessProfileId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs"
                  >
                    <option value="">All Branches / Unrestricted</option>
                    {profiles.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="user@example.com"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Phone</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="Phone number"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition"
                >
                  {saving ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    editingUser ? 'Update User' : 'Create Account'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
