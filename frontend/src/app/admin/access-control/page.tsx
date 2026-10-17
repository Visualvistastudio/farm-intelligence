'use client';

import React, { useEffect, useState } from 'react';
import { Key, Shield, UserPlus, Check, RefreshCw, AlertCircle, Plus, Lock } from 'lucide-react';
import { api } from '@/lib/api';

export default function AdminAccessControlPage() {
  const [admins, setAdmins] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [permissions, setPermissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modals
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);

  // Invite Form
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState('platform_admin');

  // Custom Role Form
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDisplay, setNewRoleDisplay] = useState('');
  const [newRoleDesc, setNewRoleDesc] = useState('');
  const [selectedPerms, setSelectedPerms] = useState<string[]>([]);

  const loadData = async () => {
    try {
      const [adminsData, rbacData] = await Promise.all([
        api.getAdminStaff(),
        api.getRoles(),
      ]);
      setAdmins(adminsData || []);
      setRoles(rbacData?.roles || []);
      setPermissions(rbacData?.all_permissions || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load access control data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleInviteAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const res = await api.inviteAdminStaff({
        email: inviteEmail,
        full_name: inviteName,
        role_name: inviteRole
      });
      setSuccess(res.message);
      setShowInviteModal(false);
      setInviteEmail('');
      setInviteName('');
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to invite administrator.');
    }
  };

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      await api.createRole({
        name: newRoleName,
        display_name: newRoleDisplay,
        description: newRoleDesc,
        permission_codes: selectedPerms
      });
      setSuccess(`Custom role '${newRoleDisplay}' created.`);
      setShowRoleModal(false);
      setNewRoleName('');
      setNewRoleDisplay('');
      setNewRoleDesc('');
      setSelectedPerms([]);
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to create role.');
    }
  };

  const togglePerm = (code: string) => {
    if (selectedPerms.includes(code)) {
      setSelectedPerms(selectedPerms.filter(p => p !== code));
    } else {
      setSelectedPerms([...selectedPerms, code]);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Access Control & Role-Based Permissions</h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage administrative personnel, assign granular permissions, and prevent unauthorized privilege escalation.
          </p>
        </div>

        <div className="flex space-x-2">
          <button
            onClick={() => setShowInviteModal(true)}
            className="bg-forest-600 hover:bg-forest-500 text-white text-xs font-semibold px-3 py-2 rounded-lg flex items-center space-x-1.5 transition"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Invite Admin</span>
          </button>
          <button
            onClick={() => setShowRoleModal(true)}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold px-3 py-2 rounded-lg flex items-center space-x-1.5 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Custom Role</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-950/80 border border-red-500 text-red-200 p-4 rounded-xl text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="bg-emerald-950/80 border border-emerald-500 text-emerald-200 p-4 rounded-xl text-xs flex items-center space-x-2">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Staff Table */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-sm">
        <div className="px-5 py-3.5 border-b border-slate-800 font-bold text-xs uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
          <Shield className="w-4 h-4 text-forest-400" />
          <span>Active Administrative Personnel</span>
        </div>
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-850 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            <tr>
              <th className="px-5 py-3">Administrator</th>
              <th className="px-5 py-3">Assigned Roles</th>
              <th className="px-5 py-3">Credential Status</th>
              <th className="px-5 py-3">Created Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {admins.map((a) => (
              <tr key={a.id} className="hover:bg-slate-850/50 transition">
                <td className="px-5 py-3.5">
                  <div className="font-bold text-white">{a.full_name}</div>
                  <div className="text-slate-400 font-mono text-[11px]">{a.email}</div>
                </td>
                <td className="px-5 py-3.5">
                  <div className="flex flex-wrap gap-1">
                    {a.roles?.map((r: string, idx: number) => (
                      <span key={idx} className="bg-forest-950 border border-forest-800 text-forest-300 px-2 py-0.5 rounded text-[10px] font-bold">
                        {r}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-5 py-3.5">
                  {a.must_change_password ? (
                    <span className="text-amber-400 text-[10px] font-bold bg-amber-950 px-2 py-0.5 rounded border border-amber-800">
                      Temporary (Change Required)
                    </span>
                  ) : (
                    <span className="text-emerald-400 text-[10px] font-bold bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                      Permanent & Verified
                    </span>
                  )}
                </td>
                <td className="px-5 py-3.5 text-slate-400 text-[11px]">
                  {new Date(a.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Roles & Granular Permissions List */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider">
          System & Custom Roles (Granular RBAC)
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {roles.map((r) => (
            <div key={r.id} className="bg-slate-900 p-5 rounded-xl border border-slate-800 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-sm text-white">{r.display_name}</h3>
                  <span className="text-[10px] font-mono text-slate-400">{r.name}</span>
                </div>
                {r.is_system && (
                  <span className="text-[10px] font-bold bg-slate-800 text-slate-300 px-2 py-0.5 rounded uppercase">
                    System Role
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">{r.description}</p>
              
              <div className="pt-2 border-t border-slate-800">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Granted Permissions:</span>
                <div className="flex flex-wrap gap-1 mt-1.5 max-h-24 overflow-y-auto">
                  {r.permissions?.map((p: string, idx: number) => (
                    <span key={idx} className="bg-slate-800 text-slate-300 text-[9px] font-mono px-1.5 py-0.5 rounded">
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Invite Admin Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white">Invite Administrative Staff</h3>
            <form onSubmit={handleInviteAdmin} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300">Staff Full Name</label>
                <input
                  type="text"
                  required
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  placeholder="e.g. Amina Mohammed"
                  className="mt-1 w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300">Email Address</label>
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="admin@farmintelligence.africa"
                  className="mt-1 w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300">Assigned RBAC Role</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="mt-1 w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white"
                >
                  <option value="platform_admin">Platform Admin</option>
                  <option value="finance_admin">Finance Admin</option>
                  <option value="agronomy_admin">Agronomy Admin</option>
                  <option value="data_admin">Data Admin</option>
                  <option value="customer_support">Customer Support</option>
                </select>
              </div>

              <div className="flex justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-forest-600 hover:bg-forest-500 text-white rounded-lg text-xs font-bold"
                >
                  Dispatch Invitation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Custom Role Builder Modal */}
      {showRoleModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl max-h-[85vh] flex flex-col">
            <h3 className="text-base font-bold text-white">Create Custom Role</h3>
            <form onSubmit={handleCreateRole} className="space-y-3 flex-1 overflow-y-auto pr-1">
              <div>
                <label className="block text-xs font-semibold text-slate-300">Role Identifier (slug)</label>
                <input
                  type="text"
                  required
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  placeholder="e.g. regional_field_inspector"
                  className="mt-1 w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300">Display Name</label>
                <input
                  type="text"
                  required
                  value={newRoleDisplay}
                  onChange={(e) => setNewRoleDisplay(e.target.value)}
                  placeholder="e.g. Regional Field Inspector"
                  className="mt-1 w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300">Description</label>
                <textarea
                  value={newRoleDesc}
                  onChange={(e) => setNewRoleDesc(e.target.value)}
                  placeholder="Responsibilities and purpose of this custom role"
                  className="mt-1 w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white h-16"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Select Granular Permissions ({selectedPerms.length} chosen)
                </label>
                <div className="space-y-1 max-h-40 overflow-y-auto bg-slate-850 p-2 rounded-lg border border-slate-800 text-xs">
                  {permissions.map((p) => (
                    <label key={p.code} className="flex items-center space-x-2 py-1 px-1.5 hover:bg-slate-800 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedPerms.includes(p.code)}
                        onChange={() => togglePerm(p.code)}
                        className="rounded border-slate-700 text-forest-600 focus:ring-forest-500"
                      />
                      <span className="font-mono text-[11px] text-slate-200">{p.code}</span>
                      <span className="text-[10px] text-slate-500 truncate">— {p.description}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowRoleModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={selectedPerms.length === 0}
                  className="px-4 py-2 bg-forest-600 hover:bg-forest-500 text-white rounded-lg text-xs font-bold disabled:opacity-50"
                >
                  Save Custom Role
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
