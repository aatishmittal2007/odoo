import React, { useState } from 'react';
import {
  LogIn,
  KeyRound,
  CheckCircle2,
  Eye,
  EyeOff,
  Building,
  Mail,
  Lock,
  User,
  ShieldAlert,
  ArrowRight,
  Sparkles,
  Layers,
  Activity,
  Check,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Modal } from '../components/common/Modal';
import { BrandLogo } from '../components/common/BrandLogo';

export const Login: React.FC = () => {
  const { login, demoLogin } = useAuth();
  const [tab, setTab] = useState<'login' | 'register'>('login');

  // Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Register Fields
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<'INVENTORY_MANAGER' | 'WAREHOUSE_STAFF'>('INVENTORY_MANAGER');
  const [acceptTerms, setAcceptTerms] = useState(false);

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

  // Password strength check
  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return { score: 0, label: '', color: '' };
    let score = 0;
    if (pwd.length >= 6) score++;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;

    if (score <= 2) return { score: 1, label: 'Weak', color: 'bg-rose-500' };
    if (score <= 4) return { score: 2, label: 'Medium', color: 'bg-amber-500' };
    return { score: 3, label: 'Strong', color: 'bg-emerald-500' };
  };

  const passwordStrength = getPasswordStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (tab === 'register') {
      if (!acceptTerms) {
        setError('Please accept the Terms of Service and Privacy Policy to continue.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
    }

    setLoading(true);

    try {
      if (tab === 'login') {
        await login(email, password);
      } else {
        await api.post('/auth/register', {
          email,
          password,
          name,
          role,
          department: company ? `${company} Operations` : 'Warehouse Logistics',
        });
        await login(email, password);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Authentication failed. Please check credentials.');
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
      const otpCode = res.data.devOtp || res.data.mockOtp;
      setMockOtp(otpCode);
      setInputOtp(otpCode); // Pre-fill in dev mode for seamless demo
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
    <div className="min-h-screen bg-[#faf9fe] flex items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden">
      {/* Soft Ambient Lavender Gradients */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-300/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-pink-300/20 rounded-full blur-3xl pointer-events-none" />

      {/* Main Split Authentication Container */}
      <div className="w-full max-w-4xl bg-white/90 backdrop-blur-xl rounded-3xl shadow-card border border-purple-100 overflow-hidden grid grid-cols-1 md:grid-cols-12 relative z-10 animate-fadeIn">
        {/* Left Side: Brand Visual Atmosphere (Hero Panel) */}
        <div className="hidden md:flex md:col-span-5 bg-gradient-to-br from-[#120f24] via-[#1a1438] to-[#2d1b4e] p-8 text-white flex-col justify-between relative overflow-hidden border-r border-purple-900/40">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-500/10 via-transparent to-transparent pointer-events-none" />

          <div>
            <BrandLogo size="lg" inverted={true} />
            <div className="mt-8 space-y-4">
              <h2 className="text-xl font-bold leading-tight tracking-tight text-white">
                Know what your system says.
                <span className="block text-purple-400">Know what your warehouse actually has.</span>
              </h2>
              <p className="text-xs text-purple-200/70 leading-relaxed font-normal">
                Inventory systems record transactions. StockSense detects discrepancies against physical reality, calculates tolerance, triggers investigations, and resolves exceptions.
              </p>
            </div>
          </div>

          {/* Feature Highlights */}
          <div className="space-y-3 pt-6 border-t border-purple-800/40">
            <div className="flex items-center gap-2.5 text-xs text-purple-200">
              <div className="w-5 h-5 rounded-md bg-purple-600/30 border border-purple-400/30 flex items-center justify-center text-purple-300">
                <Check className="w-3.5 h-3.5" />
              </div>
              <span>Automated Tiered Tolerance Engine</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-purple-200">
              <div className="w-5 h-5 rounded-md bg-purple-600/30 border border-purple-400/30 flex items-center justify-center text-purple-300">
                <Check className="w-3.5 h-3.5" />
              </div>
              <span>Deterministic Explainable Severity</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-purple-200">
              <div className="w-5 h-5 rounded-md bg-purple-600/30 border border-purple-400/30 flex items-center justify-center text-purple-300">
                <Check className="w-3.5 h-3.5" />
              </div>
              <span>Immutable Ledger & Root Cause Tracking</span>
            </div>
          </div>

          {/* Bottom Quote */}
          <div className="text-[11px] text-purple-300/50 font-mono">
            Enterprise Grade • PostgreSQL • n8n Ready
          </div>
        </div>

        {/* Right Side: Auth Forms */}
        <div className="md:col-span-7 p-6 sm:p-8 flex flex-col justify-between">
          <div>
            {/* Top Brand Header (Visible on Mobile) */}
            <div className="md:hidden mb-6 flex justify-center">
              <BrandLogo size="md" />
            </div>

            {/* Instant 1-Click Demo Evaluation Banner */}
            <div className="p-3.5 rounded-2xl bg-purple-50/70 border border-purple-100/90 mb-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] uppercase font-bold tracking-wider text-purple-800 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-purple-600" /> Instant Demo Access
                </span>
                <span className="text-[10px] text-purple-600/80 font-medium">Evaluation Mode</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleDemo('INVENTORY_MANAGER')}
                  disabled={loading}
                  className="px-3 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl text-xs font-semibold text-center transition-all shadow-sm hover:scale-[1.01]"
                >
                  Login as Manager
                  <span className="block text-[10px] text-purple-200 font-normal">Alex Mercer</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDemo('WAREHOUSE_STAFF')}
                  disabled={loading}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold text-center transition-all shadow-sm hover:scale-[1.01]"
                >
                  Login as Staff
                  <span className="block text-[10px] text-slate-300 font-normal">Sam Rodriguez</span>
                </button>
              </div>
            </div>

            {/* Tab Selector */}
            <div className="flex bg-purple-50/50 p-1 rounded-xl mb-5 border border-purple-100/50">
              <button
                type="button"
                onClick={() => {
                  setTab('login');
                  setError(null);
                }}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all text-center ${
                  tab === 'login'
                    ? 'bg-white text-purple-700 shadow-sm border border-purple-100'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setTab('register');
                  setError(null);
                }}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all text-center ${
                  tab === 'register'
                    ? 'bg-white text-purple-700 shadow-sm border border-purple-100'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Create Account
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium flex items-center gap-2 animate-fadeIn">
                <ShieldAlert className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{error}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-3.5">
              {tab === 'register' && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                      <div className="relative">
                        <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          placeholder="Jordan Hayes"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 bg-white border border-purple-100 rounded-xl text-xs focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Company / Organization</label>
                      <div className="relative">
                        <Building className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          placeholder="Apex Supply Chain"
                          value={company}
                          onChange={(e) => setCompany(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 bg-white border border-purple-100 rounded-xl text-xs focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Role Assignment</label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value as any)}
                      className="w-full px-3 py-2 bg-white border border-purple-100 rounded-xl text-xs focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                    >
                      <option value="INVENTORY_MANAGER">Inventory Manager (Full Ops & Resolution)</option>
                      <option value="WAREHOUSE_STAFF">Warehouse Staff (Counting & Floor Operations)</option>
                    </select>
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Work Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-white border border-purple-100 rounded-xl text-xs focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 font-medium"
                    required
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700">Password</label>
                  {tab === 'login' && (
                    <button
                      type="button"
                      onClick={() => {
                        setForgotEmail(email);
                        setIsForgotModalOpen(true);
                      }}
                      className="text-[11px] font-semibold text-purple-600 hover:text-purple-700"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-10 py-2 bg-white border border-purple-100 rounded-xl text-xs focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Password Strength Indicator on Register */}
                {tab === 'register' && password && (
                  <div className="mt-1.5 space-y-1">
                    <div className="flex items-center justify-between text-[10px] text-slate-500">
                      <span>Password strength: <strong>{passwordStrength.label}</strong></span>
                    </div>
                    <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden flex gap-1">
                      <div className={`h-full flex-1 ${passwordStrength.score >= 1 ? passwordStrength.color : 'bg-slate-200'}`} />
                      <div className={`h-full flex-1 ${passwordStrength.score >= 2 ? passwordStrength.color : 'bg-slate-200'}`} />
                      <div className={`h-full flex-1 ${passwordStrength.score >= 3 ? passwordStrength.color : 'bg-slate-200'}`} />
                    </div>
                  </div>
                )}
              </div>

              {tab === 'register' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Confirm Password</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-white border border-purple-100 rounded-xl text-xs focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                      required
                    />
                  </div>
                </div>
              )}

              {/* Checkboxes */}
              {tab === 'login' ? (
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="remember"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-3.5 w-3.5 text-purple-600 focus:ring-purple-500 border-slate-300 rounded cursor-pointer"
                  />
                  <label htmlFor="remember" className="ml-2 block text-xs text-slate-600 cursor-pointer">
                    Remember my credentials for 7 days
                  </label>
                </div>
              ) : (
                <div className="flex items-start">
                  <input
                    type="checkbox"
                    id="terms"
                    checked={acceptTerms}
                    onChange={(e) => setAcceptTerms(e.target.checked)}
                    className="h-3.5 w-3.5 mt-0.5 text-purple-600 focus:ring-purple-500 border-slate-300 rounded cursor-pointer"
                  />
                  <label htmlFor="terms" className="ml-2 block text-[11px] text-slate-600 cursor-pointer">
                    I agree to the StockSense enterprise terms of service and audit logging privacy policy.
                  </label>
                </div>
              )}

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-purple-600/20 flex items-center justify-center gap-2 mt-2 cursor-pointer hover:scale-[1.005]"
              >
                <LogIn className="w-4 h-4" />
                <span>
                  {loading
                    ? 'Authenticating...'
                    : tab === 'login'
                    ? 'Sign In to StockSense'
                    : 'Create StockSense Account'}
                </span>
              </button>
            </form>
          </div>

          {/* Footer Note */}
          <div className="pt-6 border-t border-purple-100/60 text-center text-[11px] text-slate-400">
            StockSense — Inventory Reality & Exception Management • v2.4 Enterprise
          </div>
        </div>
      </div>

      {/* Forgot Password Modal with Real Hashed OTP Verification */}
      <Modal
        isOpen={isForgotModalOpen}
        onClose={() => setIsForgotModalOpen(false)}
        title="Reset Account Password"
        subtitle="Cryptographic verification code delivery"
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
              <label className="block text-xs font-semibold text-slate-700 mb-1">Registered Work Email</label>
              <input
                type="email"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-purple-200 rounded-xl text-xs"
                placeholder="name@company.com"
                required
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsForgotModalOpen(false)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={forgotLoading}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-colors"
              >
                {forgotLoading ? 'Generating...' : 'Send Verification OTP'}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-4">
            {mockOtp && (
              <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl text-xs text-purple-900">
                Development OTP Code: <strong className="font-mono text-purple-700">{mockOtp}</strong> (valid for 15 minutes)
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">6-Digit Verification Code</label>
              <input
                type="text"
                value={inputOtp}
                onChange={(e) => setInputOtp(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-purple-200 rounded-xl text-xs font-mono font-bold text-center tracking-widest"
                maxLength={6}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">New Password</label>
              <input
                type="password"
                placeholder="Enter new password (min. 6 characters)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-purple-200 rounded-xl text-xs"
                minLength={6}
                required
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setForgotStep('request')}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={forgotLoading}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-colors"
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
