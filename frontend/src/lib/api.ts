const API_BASE = typeof window !== 'undefined'
  ? '/api/v1'
  : (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api/v1');

export class ApiError extends Error {
  status: number;
  data: any;
  constructor(status: number, message: string, data?: any) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

export async function apiFetch<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('fi_access_token') : null;
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;
  
  try {
    const res = await fetch(url, {
      ...options,
      headers,
    });

    if (!res.ok) {
      let errorMsg = `Request failed (${res.status})`;
      let errorData = null;
      try {
        errorData = await res.json();
        errorMsg = errorData.detail || errorData.message || errorMsg;
      } catch {}
      throw new ApiError(res.status, errorMsg, errorData);
    }

    if (res.status === 204) {
      return {} as T;
    }

    return await res.json();
  } catch (err: any) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(0, err.message || 'Network error');
  }
}

// Client helper API methods
export const api = {
  // Auth
  register: (data: any) => apiFetch('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  login: (data: any) => apiFetch('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  adminLogin: (data: any) => apiFetch('/auth/admin/login', { method: 'POST', body: JSON.stringify(data) }),
  adminVerifyOtp: (data: any) => apiFetch('/auth/admin/verify-otp', { method: 'POST', body: JSON.stringify(data) }),
  adminChangePassword: (data: any) => apiFetch('/auth/admin/change-password', { method: 'POST', body: JSON.stringify(data) }),
  forgotPassword: (data: any) => apiFetch('/auth/forgot-password', { method: 'POST', body: JSON.stringify(data) }),
  resetPassword: (data: any) => apiFetch('/auth/reset-password', { method: 'POST', body: JSON.stringify(data) }),
  getMe: () => apiFetch('/auth/me'),

  // Farms & Fields
  getFarms: () => apiFetch('/farms'),
  getFarm: (id: string) => apiFetch(`/farms/${id}`),
  createFarm: (data: any) => apiFetch('/farms', { method: 'POST', body: JSON.stringify(data) }),
  updateFarm: (id: string, data: any) => apiFetch(`/farms/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  archiveFarm: (id: string) => apiFetch(`/farms/${id}`, { method: 'DELETE' }),
  validateBoundary: (geojson: string) => apiFetch('/farms/validate-boundary', { method: 'POST', body: JSON.stringify({ geojson }) }),
  addField: (farmId: string, data: any) => apiFetch(`/farms/${farmId}/fields`, { method: 'POST', body: JSON.stringify(data) }),

  // Agronomy
  getCrops: () => apiFetch('/agronomy/crops'),
  getCrop: (id: string) => apiFetch(`/agronomy/crops/${id}`),

  // Assessments
  runAssessment: (data: any) => apiFetch('/assessments', { method: 'POST', body: JSON.stringify(data) }),
  getAssessments: () => apiFetch('/assessments'),
  getAssessment: (id: string) => apiFetch(`/assessments/${id}`),
  getCropPlan: (assessmentId: string) => apiFetch(`/assessments/${assessmentId}/crop-plan`),
  toggleTask: (taskId: string) => apiFetch(`/assessments/tasks/${taskId}/toggle`, { method: 'POST' }),

  // Billing & Subscriptions
  getPlans: () => apiFetch('/billing/plans'),
  initializePayment: (data: any) => apiFetch('/billing/initialize', { method: 'POST', body: JSON.stringify(data) }),
  verifyPayment: (ref: string) => apiFetch('/billing/verify', { method: 'POST', body: JSON.stringify({ reference: ref }) }),
  getSubscription: () => apiFetch('/billing/subscription'),

  // Super Admin
  getAdminOverview: () => apiFetch('/admin/overview'),
  getAdminUsers: (statusFilter?: string) => apiFetch(`/admin/users${statusFilter ? `?status_filter=${statusFilter}` : ''}`),
  updateUserStatus: (id: string, status: string) => apiFetch(`/admin/users/${id}/status`, { method: 'PATCH', body: JSON.stringify({ account_status: status }) }),
  getAdminStaff: () => apiFetch('/admin/access-control/admins'),
  inviteAdminStaff: (data: any) => apiFetch('/admin/access-control/invite', { method: 'POST', body: JSON.stringify(data) }),
  getRoles: () => apiFetch('/admin/access-control/roles'),
  createRole: (data: any) => apiFetch('/admin/access-control/roles', { method: 'POST', body: JSON.stringify(data) }),
  getPayments: () => apiFetch('/admin/payments'),
  processRefund: (paymentId: string, reason: string) => apiFetch(`/admin/payments/refund?payment_id=${paymentId}&reason=${encodeURIComponent(reason)}`, { method: 'POST' }),
  getPaymentSettings: () => apiFetch('/admin/settings/payments'),
  updatePaymentSettings: (data: any) => apiFetch('/admin/settings/payments', { method: 'POST', body: JSON.stringify(data) }),
  getAdminSubscriptions: () => apiFetch('/admin/subscriptions'),
  getDataSources: () => apiFetch('/admin/data-sources'),
  syncDataSource: (id: string) => apiFetch(`/admin/data-sources/${id}/sync`, { method: 'POST' }),
  getAuditLogs: (limit = 50) => apiFetch(`/admin/audit-logs?limit=${limit}`),
};
