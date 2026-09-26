import React, { useState } from 'react';
import { ShieldAlert, LogIn, UserCheck, KeyRound, CheckCircle2, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Modal } from '../components/common/Modal';

export const Login: React.FC = () => {
  const { login, demoLogin } = useAuth();
  const [tab, setTab] = useState<'login' | 'register'>('login');

  const [email, setEmail] = useState('manager@stocksense.io');
  const [password, setPassword] = useState('password123');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'INVENTORY_MANAGER' | 'WAREHOUSE_STAFF'>('INVENTORY_MANAGER');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Forgot password modal state
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotStep, setForgotStep] = useState<'request' | 'verify'>('request');
  const [mockOtp, setMockOtp] = useState('');
  const [inputOtp, setInputOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (tab === 'login') {
        await login(email, password);
      } else {
        await api.post('/auth/register', { email, password, name, role });
        await login(email, password);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDemo = async (roleType: 'INVENTORY_MANAGER' | 'WAREHOUSE_STAFF') => {
    setError(null);
    setLoading(true);
    try {
      await demoLogin(roleType);
    } catch (err: any) {
      setError(err.message || 'Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) return;
    setForgotLoading(true);
    try {
      const res = await api.post('/auth/forgot-password', { email: forgotEmail });
      setMockOtp(res.data.mockOtp);
      setInputOtp(res.data.mockOtp); // Pre-fill mock OTP for smooth dev testing
      setForgotStep('verify');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to request OTP');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputOtp || !newPassword) return;
    setForgotLoading(true);
    try {
      await api.post('/auth/reset-password', {
        email: forgotEmail,
        otp: inputOtp,
        newPassword,
      });
      setForgotSuccess(true);
      setTimeout(() => {
        setIsForgotModalOpen(false);
        setForgotSuccess(false);
        setForgotStep('request');
      }, 2000);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Password reset failed');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-800 overflow-hidden">
        {/* Brand Header */}
        <div className="bg-slate-950 p-6 text-center text-white border-b border-slate-800">
          <div className="w-12 h-12 rounded-xl bg-emerald-600 flex items-center justify-center mx-auto mb-3 shadow-md shadow-emerald-900/50">
            <ShieldAlert className="w-7 h-7 text-emerald-100" />
          </div>
          <h1 className="text-xl font-bold tracking-wider">
            STOCK<span className="text-emerald-400">SENSE</span>
          </h1>
          <p className="text-xs text-slate-400 font-mono uppercase tracking-widest mt-1">
            Inventory Reality & Exception Management
          </p>
        </div>

        {/* 1-Click Demo Logins Banner */}
        <div className="bg-slate-50 p-4 border-b border-slate-200 space-y-2">
          <span className="block text-[10px] uppercase font-bold tracking-wider text-slate-500 text-center">
            Instant 1-Click Demo Evaluation
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleDemo('INVENTORY_MANAGER')}
              disabled={loading}
              className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold text-center transition-colors shadow-2xs"
            >
              Login as Manager
              <span className="block text-[10px] text-emerald-100 font-normal">Alex Mercer</span>
            </button>
            <button
              onClick={() => handleDemo('WAREHOUSE_STAFF')}
              disabled={loading}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold text-center transition-colors shadow-2xs"
            >
              Login as Staff
              <span className="block text-[10px] text-slate-300 font-normal">Sam Rodriguez</span>
            </button>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-slate-200">
          <button
            onClick={() => setTab('login')}
            className={`flex-1 py-3 text-xs font-bold text-center border-b-2 transition-all ${
              tab === 'login'
                ? 'border-emerald-600 text-emerald-600 bg-white'
                : 'border-transparent text-slate-400 hover:text-slate-600 bg-slate-50/50'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => setTab('register')}
            className={`flex-1 py-3 text-xs font-bold text-center border-b-2 transition-all ${
              tab === 'register'
                ? 'border-emerald-600 text-emerald-600 bg-white'
                : 'border-transparent text-slate-400 hover:text-slate-600 bg-slate-50/50'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Auth Form */}
        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {tab === 'register' && (
              <>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Jordan Hayes"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Assigned Role</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as any)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                  >
                    <option value="INVENTORY_MANAGER">Inventory Manager</option>
                    <option value="WAREHOUSE_STAFF">Warehouse Staff</option>
                  </select>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Work Email</label>
              <input
                type="email"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium"
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-slate-700">Password</label>
                {tab === 'login' && (
                  <button
                    type="button"
                    onClick={() => {
                      setForgotEmail(email);
                      setIsForgotModalOpen(true);
                    }}
                    className="text-[11px] font-semibold text-emerald-600 hover:text-emerald-700"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-colors shadow-xs flex items-center justify-center gap-1.5 mt-2"
            >
              <LogIn className="w-4 h-4" />
              <span>{loading ? 'Authenticating...' : tab === 'login' ? 'Sign In to StockSense' : 'Register Account'}</span>
            </button>
          </form>
        </div>
      </div>

      {/* Forgot Password Modal (Section 27) */}
      <Modal
        isOpen={isForgotModalOpen}
        onClose={() => setIsForgotModalOpen(false)}
        title="Reset Password (Development / OTP Flow)"
        subtitle="Verification code mock flow as specified in Section 27"
      >
        {forgotSuccess ? (
          <div className="p-6 text-center space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
            <h4 className="text-sm font-bold text-slate-900">Password Successfully Updated</h4>
            <p className="text-xs text-slate-500">You may now log in with your updated credentials.</p>
          </div>
        ) : forgotStep === 'request' ? (
          <form onSubmit={handleRequestOtp} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Work Email</label>
              <input
                type="email"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                required
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsForgotModalOpen(false)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={forgotLoading}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold"
              >
                {forgotLoading ? 'Sending...' : 'Send Verification OTP'}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800">
              Mock OTP generated: <strong className="font-mono">{mockOtp}</strong> (automatically filled for testing)
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">6-Digit Verification Code</label>
              <input
                type="text"
                value={inputOtp}
                onChange={(e) => setInputOtp(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">New Password</label>
              <input
                type="password"
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                required
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setForgotStep('request')}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={forgotLoading}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold"
              >
                {forgotLoading ? 'Updating...' : 'Set New Password'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
