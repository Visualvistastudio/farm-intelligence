'use client';

import React, { useEffect, useState } from 'react';
import { Key, Shield, UserPlus, Check, RefreshCw, AlertCircle, Plus, Lock, UserCheck, UserX, Crown, ShieldCheck, Briefcase } from 'lucide-react';
import { api } from '@/lib/api';

const SUPER_ADMIN_EMAIL = 'ologunemmanuel2015@gmail.com';

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
  const [showReassignModal, setShowReassignModal] = useState(false);

  // Invite Form
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState('platform_admin');
  const [inviting, setInviting] = useState(false);

  // Custom Role Form
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDisplay, setNewRoleDisplay] = useState('');
  const [newRoleDesc, setNewRoleDesc] = useState('');
  const [selectedPerms, setSelectedPerms] = useState<string[]>([]);
  const [creatingRole, setCreatingRole] = useState(false);

  // Reassign Department / Role Form
  const [reassignAdmin, setReassignAdmin] = useState<any | null>(null);
  const [selectedTargetRole, setSelectedTargetRole] = useState('');
  const [reassigning, setReassigning] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
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
    setInviting(true);
    setError('');
    setSuccess('');
    try {
      const res = await api.inviteAdminStaff({
        email: inviteEmail.trim(),
        full_name: inviteName.trim(),
        role_name: inviteRole,
      });
      setSuccess(res.message);
      setShowInviteModal(false);
      setInviteEmail('');
      setInviteName('');
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to invite administrator.');
    } finally {
      setInviting(false);
    }
  };

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingRole(true);
    setError('');
    setSuccess('');
    try {
      await api.createRole({
        name: newRoleName.trim().toLowerCase(),
        display_name: newRoleDisplay.trim(),
        description: newRoleDesc.trim(),
        permission_codes: selectedPerms,
      });
      setSuccess(`Custom role '${newRoleDisplay}' created and published.`);
      setShowRoleModal(false);
      setNewRoleName('');
      setNewRoleDisplay('');
      setNewRoleDesc('');
      setSelectedPerms([]);
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to create role.');
    } finally {
      setCreatingRole(false);
    }
  };

  const openReassignRole = (admin: any) => {
    setReassignAdmin(admin);
    // Find current role code if possible
    const currentRoleMatch = roles.find((r) => admin.roles?.includes(r.display_name));
    setSelectedTargetRole(currentRoleMatch ? currentRoleMatch.name : (roles[0]?.name || 'platform_admin'));
    setShowReassignModal(true);
  };

  const handleReassignRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reassignAdmin || !selectedTargetRole) return;
    setReassigning(true);
    setError('');
    setSuccess('');
    try {
      const res = await api.updateAdminStaffRole(reassignAdmin.id, selectedTargetRole);
      setSuccess(res.message || `Role updated for ${reassignAdmin.email}.`);
      setShowReassignModal(false);
      setReassignAdmin(null);
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to reassign role.');
    } finally {
      setReassigning(false);
    }
  };

  const handleToggleStatus = async (admin: any) => {
    const isCurrentlySuspended = admin.account_status === 'suspended';
    const newStatus = isCurrentlySuspended ? 'active' : 'suspended';

    if (admin.email === SUPER_ADMIN_EMAIL) {
      alert('The primary Super Administrator account cannot be suspended.');
      return;
    }

    if (!confirm(`Are you sure you want to ${isCurrentlySuspended ? 'reactivate' : 'suspend'} administrative access for ${admin.full_name || admin.email}?`)) {
      return;
    }

    setError('');
    setSuccess('');
    try {
      const res = await api.updateAdminStaffStatus(admin.id, newStatus);
      setSuccess(res.message || `Administrator access set to ${newStatus}.`);
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to update administrative access status.');
    }
  };

  const togglePerm = (code: string) => {
    if (selectedPerms.includes(code)) {
      setSelectedPerms(selectedPerms.filter((p) => p !== code));
    } else {
      setSelectedPerms([...selectedPerms, code]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-extrabold text-white">Access Control & Department Permissions</h1>
            <span className="text-[11px] bg-amber-950/80 text-amber-300 border border-amber-700/60 px-2.5 py-0.5 rounded-full font-bold flex items-center space-x-1">
              <Crown className="w-3 h-3 text-amber-400" />
              <span>Super Admin Authority</span>
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Govern organizational hierarchy, reassign departmental duties (Finance, Agronomy, Operations, Support), and enforce strict least-privilege security.
          </p>
        </div>

        <div className="flex space-x-2">
          <button
            onClick={() => setShowInviteModal(true)}
            className="bg-forest-600 hover:bg-forest-500 text-white text-xs font-semibold px-3 py-2 rounded-lg flex items-center space-x-1.5 transition shadow-sm"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Invite Department Admin</span>
          </button>
          <button
            onClick={() => setShowRoleModal(true)}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold px-3 py-2 rounded-lg flex items-center space-x-1.5 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Custom Role</span>
          </button>
          <button
            onClick={loadData}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold px-3 py-2 rounded-lg flex items-center space-x-1.5 transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
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
        <div className="px-5 py-3.5 border-b border-slate-800 font-bold text-xs uppercase tracking-wider text-slate-400 flex items-center justify-between">
          <div className="flex items-center space-x-1.5">
            <Shield className="w-4 h-4 text-forest-400" />
            <span>Administrative Staff & Department Assignments ({admins.length})</span>
          </div>
          <span className="text-[11px] text-slate-500 font-normal">Super Admin control over all roles & suspensions</span>
        </div>

        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-850 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            <tr>
              <th className="px-5 py-3">Administrator</th>
              <th className="px-5 py-3">Department & Role</th>
              <th className="px-5 py-3">Account Status</th>
              <th className="px-5 py-3">Credential State</th>
              <th className="px-5 py-3 text-right">Super Admin Governance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {admins.map((a) => {
              const isSuperAdmin = a.email === SUPER_ADMIN_EMAIL || a.roles?.includes('Super Administrator');
              const isSuspended = a.account_status === 'suspended';

              return (
                <tr key={a.id} className="hover:bg-slate-850/50 transition">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center space-x-2">
                      <div className="font-bold text-white">{a.full_name}</div>
                      {isSuperAdmin && (
                        <span className="bg-amber-950 text-amber-300 border border-amber-800 text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center space-x-1">
                          <Crown className="w-3 h-3 text-amber-400" />
                          <span>Master Super Admin</span>
                        </span>
                      )}
                    </div>
                    <div className="text-slate-400 font-mono text-[11px]">{a.email}</div>
                  </td>

                  <td className="px-5 py-3.5">
                    <div className="flex flex-wrap gap-1.5">
                      {a.roles?.map((r: string, idx: number) => (
                        <span
                          key={idx}
                          className={`px-2.5 py-0.5 rounded text-[11px] font-bold border ${
                            r.toLowerCase().includes('super')
                              ? 'bg-amber-950/80 border-amber-800 text-amber-300'
                              : r.toLowerCase().includes('finance')
                              ? 'bg-emerald-950/80 border-emerald-800 text-emerald-300'
                              : r.toLowerCase().includes('agronomy')
                              ? 'bg-green-950/80 border-green-800 text-green-300'
                              : 'bg-forest-950 border-forest-800 text-forest-300'
                          }`}
                        >
                          {r}
                        </span>
                      ))}
                    </div>
                  </td>

                  <td className="px-5 py-3.5">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                        isSuspended
                          ? 'bg-red-950 text-red-400 border-red-800'
                          : 'bg-emerald-950 text-emerald-400 border-emerald-800'
                      }`}
                    >
                      {a.account_status || 'active'}
                    </span>
                  </td>

                  <td className="px-5 py-3.5">
                    {a.must_change_password ? (
                      <span className="text-amber-400 text-[10px] font-bold bg-amber-950 px-2 py-0.5 rounded border border-amber-800">
                        Temporary Password
                      </span>
                    ) : (
                      <span className="text-emerald-400 text-[10px] font-bold bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                        Permanent & Verified
                      </span>
                    )}
                  </td>

                  <td className="px-5 py-3.5 text-right">
                    {isSuperAdmin ? (
                      <span className="text-[11px] text-amber-400/80 font-mono italic">
                        Permanent Master (Immutable)
                      </span>
                    ) : (
                      <div className="inline-flex items-center space-x-2">
                        <button
                          onClick={() => openReassignRole(a)}
                          className="bg-slate-800 hover:bg-forest-600 hover:text-white text-slate-200 border border-slate-700 px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1 transition"
                        >
                          <Briefcase className="w-3 h-3 text-forest-400" />
                          <span>Reassign Dept</span>
                        </button>

                        <button
                          onClick={() => handleToggleStatus(a)}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition flex items-center space-x-1 ${
                            isSuspended
                              ? 'bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border-emerald-800'
                              : 'bg-red-950 hover:bg-red-900 text-red-300 border-red-800'
                          }`}
                        >
                          {isSuspended ? (
                            <>
                              <UserCheck className="w-3 h-3" />
                              <span>Reactivate</span>
                            </>
                          ) : (
                            <>
                              <UserX className="w-3 h-3" />
                              <span>Suspend</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Roles & Granular Permissions List */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
          <Key className="w-4 h-4 text-forest-400" />
          <span>Configured System & Custom Roles</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {roles.map((r) => (
            <div key={r.id} className="bg-slate-900 p-5 rounded-xl border border-slate-800 space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-sm text-white">{r.display_name}</h3>
                    <span className="text-[10px] font-mono text-slate-400">{r.name}</span>
                  </div>
                  {r.is_system ? (
                    <span className="text-[10px] font-bold bg-slate-800 text-slate-300 px-2 py-0.5 rounded uppercase">
                      System Role
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold bg-forest-950 text-forest-300 border border-forest-800 px-2 py-0.5 rounded uppercase">
                      Custom Role
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 leading-relaxed mt-2">{r.description || 'No description'}</p>
              </div>

              <div className="pt-2 border-t border-slate-800">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                  Granted Privileges ({r.permissions?.length || 0}):
                </span>
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

      {/* Reassign Role / Dept Modal */}
      {showReassignModal && reassignAdmin && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <Briefcase className="w-4 h-4 text-forest-400" />
                <span>Reassign Administrative Department & Role</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowReassignModal(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleReassignRole} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-300">Staff Member</label>
                <div className="mt-1 p-2.5 bg-slate-800 rounded-lg border border-slate-700 text-white font-medium">
                  {reassignAdmin.full_name} ({reassignAdmin.email})
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300">New Department / Role Assignment</label>
                <select
                  value={selectedTargetRole}
                  onChange={(e) => setSelectedTargetRole(e.target.value)}
                  className="mt-1 w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-semibold"
                >
                  {roles.map((r) => (
                    <option key={r.id} value={r.name}>
                      {r.display_name} ({r.name})
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-400 mt-1">
                  Assigning this role will immediately replace the staff member's active permissions.
                </p>
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowReassignModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reassigning}
                  className="px-4 py-2 bg-forest-600 hover:bg-forest-500 text-white rounded-lg font-bold flex items-center space-x-1.5 disabled:opacity-50"
                >
                  {reassigning ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>Confirm Reassignment</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invite Admin Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <UserPlus className="w-4 h-4 text-forest-400" />
                <span>Invite Administrative Personnel</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowInviteModal(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleInviteAdmin} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-300">Staff Full Name</label>
                <input
                  type="text"
                  required
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  placeholder="e.g. Dr. Amina Bello"
                  className="mt-1 w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300">Email Address</label>
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="staff@farmintelligence.africa"
                  className="mt-1 w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300">Assigned Department Role</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="mt-1 w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-semibold"
                >
                  {roles.map((r) => (
                    <option key={r.id} value={r.name}>
                      {r.display_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="bg-slate-850 p-3 rounded-lg border border-slate-800 text-[11px] text-slate-400 leading-relaxed">
                The new administrator will receive a provisioned account with default credentials and will be prompted to rotate their password upon initial login.
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={inviting}
                  className="px-4 py-2 bg-forest-600 hover:bg-forest-500 text-white rounded-lg font-bold flex items-center space-x-1.5 disabled:opacity-50"
                >
                  {inviting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <UserPlus className="w-3.5 h-3.5" />}
                  <span>Dispatch Staff Invitation</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Custom Role Builder Modal */}
      {showRoleModal && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <Plus className="w-4 h-4 text-forest-400" />
                <span>Create Granular Custom Role</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowRoleModal(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateRole} className="space-y-3 flex-1 overflow-y-auto pr-1 text-xs">
              <div>
                <label className="block font-semibold text-slate-300">Role Identifier (slug)</label>
                <input
                  type="text"
                  required
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  placeholder="e.g. regional_field_inspector"
                  className="mt-1 w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300">Display Name</label>
                <input
                  type="text"
                  required
                  value={newRoleDisplay}
                  onChange={(e) => setNewRoleDisplay(e.target.value)}
                  placeholder="e.g. Regional Field Inspector"
                  className="mt-1 w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300">Description</label>
                <textarea
                  value={newRoleDesc}
                  onChange={(e) => setNewRoleDesc(e.target.value)}
                  placeholder="Responsibilities and purpose of this custom role"
                  className="mt-1 w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white h-16"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
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

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowRoleModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingRole || selectedPerms.length === 0}
                  className="px-4 py-2 bg-forest-600 hover:bg-forest-500 text-white rounded-lg font-bold flex items-center space-x-1.5 disabled:opacity-50"
                >
                  {creatingRole ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>Save Custom Role</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
