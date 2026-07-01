import React, { useState } from 'react';
import { Page } from '../types';
import { authAPI } from '../api';
import { Shield, ArrowRight, CheckCircle2, Lock, Mail, Building, User, Info, ArrowLeft } from 'lucide-react';

interface AuthPagesProps {
  initialScreen: 'login' | 'register' | 'forgot-password';
  onNavigate: (page: Page) => void;
  onLoginSuccess: (credentials: { email: string; password: string }) => void;
}

export default function AuthPages({ initialScreen, onNavigate, onLoginSuccess }: AuthPagesProps) {
  const [screen, setScreen] = useState<'login' | 'register' | 'forgot-password'>(initialScreen);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [orgName, setOrgName] = useState('');
  const [fullName, setFullName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Please input valid email and password credentials.');
      return;
    }
    setErrorMsg('');
    setLoading(true);
    try {
      await onLoginSuccess({ email, password });
    } catch (err: any) {
      const msg = err?.response?.data?.detail || 'Login failed. Please check your credentials.';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !orgName || !fullName) {
      setErrorMsg('Please populate all structural fields.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }
    setErrorMsg('');
    setLoading(true);
    try {
      await authAPI.register({ email, password, full_name: fullName });
      setSuccessMsg('Account created successfully! Please sign in.');
      setTimeout(() => {
        setSuccessMsg('');
        setScreen('login');
        setEmail('');
        setPassword('');
        setFullName('');
        setOrgName('');
        setConfirmPassword('');
      }, 2000);
    } catch (err: any) {
      const msg = err?.response?.data?.detail || 'Registration failed. Email may already be in use.';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }
    setErrorMsg('');
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSuccessMsg(`If an account exists with ${email}, a reset link has been dispatched.`);
    }, 1000);
  };

  return (
    <div id="auth-root" className="min-h-screen bg-[#FAF9F6] text-neutral-900 font-sans flex flex-col justify-between">
      
      {/* Dynamic Header */}
      <header className="p-6 border-b border-neutral-100 flex items-center justify-between">
        <button onClick={() => onNavigate('home')} className="flex items-center gap-2 font-display font-bold text-lg hover:opacity-80 transition-opacity">
          <span className="w-8 h-8 bg-[#0F0F0F] flex items-center justify-center text-white font-mono text-sm font-bold rounded">
            C
          </span>
          <span>Cert<span className="text-[#E52E40]">FI</span></span>
        </button>
        <button onClick={() => onNavigate('home')} className="text-xs font-mono text-neutral-500 hover:text-neutral-900 flex items-center gap-1.5 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Landing Page
        </button>
      </header>

      {/* Main Container */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md bg-white border-2 border-neutral-800 p-8 rounded-lg shadow-[8px_8px_0px_0px_rgba(15,15,15,1)]">
          
          {/* Logo element */}
          <div className="text-center mb-6">
            <div className="w-12 h-12 bg-[#E52E40] text-white flex items-center justify-center rounded-lg mx-auto mb-3">
              <Shield className="w-6 h-6" />
            </div>
            {screen === 'login' && (
              <>
                <h1 className="text-2xl font-bold font-display text-neutral-900">Sign In to CertFI</h1>
                <p className="text-xs text-neutral-400 mt-1">Access your cryptographic template generator suite.</p>
              </>
            )}
            {screen === 'register' && (
              <>
                <h1 className="text-2xl font-bold font-display text-neutral-900">Create Corporate Workspace</h1>
                <p className="text-xs text-neutral-400 mt-1">Configure layout editors and invite design specialists.</p>
              </>
            )}
            {screen === 'forgot-password' && (
              <>
                <h1 className="text-2xl font-bold font-display text-neutral-900">Reset Security Phrase</h1>
                <p className="text-xs text-neutral-400 mt-1">Regain secure access to your immutable ledger credentials.</p>
              </>
            )}
          </div>

          {/* Messages */}
          {errorMsg && (
            <div className="bg-rose-50 border-l-4 border-rose-600 text-rose-800 p-3 mb-4 rounded text-xs flex items-start gap-2">
              <Info className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}
          {successMsg && (
            <div className="bg-emerald-50 border-l-4 border-emerald-600 text-emerald-800 p-3 mb-4 rounded text-xs flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* LOGIN FORM */}
          {screen === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-mono font-bold uppercase text-neutral-500 mb-1">Corporate Email</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-neutral-400" />
                  <input 
                    type="email" 
                    required 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. ramkiranmohan1759@gmail.com" 
                    className="w-full bg-neutral-50 border border-neutral-200 focus:border-[#E52E40] outline-none p-3 pl-10 rounded text-sm transition-colors font-mono"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-mono font-bold uppercase text-neutral-500">Security Password</label>
                  <button 
                    type="button" 
                    onClick={() => setScreen('forgot-password')} 
                    className="text-xs font-semibold text-[#E52E40] hover:underline"
                  >
                    Forgot Key?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-neutral-400" />
                  <input 
                    type="password" 
                    required 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••" 
                    className="w-full bg-neutral-50 border border-neutral-200 focus:border-[#E52E40] outline-none p-3 pl-10 rounded text-sm transition-colors"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-neutral-500">
                  <input 
                    type="checkbox" 
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="accent-[#E52E40]" 
                  />
                  <span>Persist session (Remember Me)</span>
                </label>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-[#0F0F0F] hover:bg-[#E52E40] disabled:bg-neutral-400 text-white font-semibold text-sm p-3.5 rounded transition-all flex items-center justify-center gap-2"
              >
                {loading ? 'Authenticating Workspace...' : 'Secure Login'} <ArrowRight className="w-4 h-4" />
              </button>

              <div className="relative my-6 text-center">
                <hr className="border-neutral-100" />
                <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-white px-3 text-[10px] font-mono text-neutral-400 uppercase">OR CONTINUING WITH</span>
              </div>

              {/* Mock OAuth option */}
              <button 
                type="button" 
                onClick={() => onLoginSuccess({ email: 'demo@certfi.com', password: 'demo123' })}
                className="w-full border border-neutral-200 hover:border-[#0F0F0F] bg-white text-neutral-700 text-xs font-semibold p-3 rounded flex items-center justify-center gap-2 transition-colors"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#EA4335" d="M12.24 10.285V14.4h6.887c-.275 1.565-1.88 4.604-6.887 4.604-4.33 0-7.859-3.579-7.859-8s3.53-8 7.859-8c2.46 0 4.105 1.025 5.047 1.926l3.227-3.11c-2.071-1.928-4.754-3.11-8.274-3.11-6.627 0-12 5.373-12 12s5.373 12 12 12c6.926 0 11.52-4.869 11.52-11.726 0-.788-.085-1.39-.188-1.983H12.24z"/>
                </svg>
                <span>Continue with Corporate Google account</span>
              </button>

              <p className="text-xs text-neutral-500 text-center mt-6">
                New to CertFI?{' '}
                <button type="button" onClick={() => setScreen('register')} className="text-[#E52E40] font-bold hover:underline">
                  Configure Workspace
                </button>
              </p>
            </form>
          )}

          {/* REGISTER FORM */}
          {screen === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-mono font-bold uppercase text-neutral-500 mb-1">Organization Name</label>
                <div className="relative">
                  <Building className="absolute left-3.5 top-3.5 w-4 h-4 text-neutral-400" />
                  <input 
                    type="text" 
                    required 
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    placeholder="e.g. Kyoto Academy of Technology" 
                    className="w-full bg-neutral-50 border border-neutral-200 focus:border-[#E52E40] outline-none p-3 pl-10 rounded text-sm transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono font-bold uppercase text-neutral-500 mb-1">Your Full Name</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3.5 w-4 h-4 text-neutral-400" />
                  <input 
                    type="text" 
                    required 
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Ram Kiran Mohan" 
                    className="w-full bg-neutral-50 border border-neutral-200 focus:border-[#E52E40] outline-none p-3 pl-10 rounded text-sm transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono font-bold uppercase text-neutral-500 mb-1">Corporate Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-neutral-400" />
                  <input 
                    type="email" 
                    required 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. ramkiranmohan1759@gmail.com" 
                    className="w-full bg-neutral-50 border border-neutral-200 focus:border-[#E52E40] outline-none p-3 pl-10 rounded text-sm transition-colors font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono font-bold uppercase text-neutral-500 mb-1">Password</label>
                  <input 
                    type="password" 
                    required 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••" 
                    className="w-full bg-neutral-50 border border-neutral-200 focus:border-[#E52E40] outline-none p-3 rounded text-sm transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono font-bold uppercase text-neutral-500 mb-1">Confirm Password</label>
                  <input 
                    type="password" 
                    required 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••" 
                    className="w-full bg-neutral-50 border border-neutral-200 focus:border-[#E52E40] outline-none p-3 rounded text-sm transition-colors"
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-[#0F0F0F] hover:bg-[#E52E40] disabled:bg-neutral-400 text-white font-semibold text-sm p-3.5 rounded transition-all flex items-center justify-center gap-2"
              >
                {loading ? 'Registering Workspace...' : 'Create Account'} <ArrowRight className="w-4 h-4" />
              </button>

              <p className="text-xs text-neutral-500 text-center mt-4">
                Already registered?{' '}
                <button type="button" onClick={() => setScreen('login')} className="text-[#E52E40] font-bold hover:underline">
                  Sign In
                </button>
              </p>
            </form>
          )}

          {/* FORGOT PASSWORD */}
          {screen === 'forgot-password' && (
            <form onSubmit={handleForgotSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-mono font-bold uppercase text-neutral-500 mb-1">Enter Register Email</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-neutral-400" />
                  <input 
                    type="email" 
                    required 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. ramkiranmohan1759@gmail.com" 
                    className="w-full bg-neutral-50 border border-neutral-200 focus:border-[#E52E40] outline-none p-3 pl-10 rounded text-sm transition-colors font-mono"
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-[#0F0F0F] hover:bg-[#E52E40] disabled:bg-neutral-400 text-white font-semibold text-sm p-3.5 rounded transition-all flex items-center justify-center gap-2"
              >
                {loading ? 'Dispatching Query...' : 'Send Security Reset Link'}
              </button>

              <p className="text-xs text-neutral-500 text-center mt-4">
                Remember your credentials?{' '}
                <button type="button" onClick={() => setScreen('login')} className="text-[#E52E40] font-bold hover:underline">
                  Sign In
                </button>
              </p>
            </form>
          )}

        </div>
      </div>

      {/* Footer message */}
      <footer className="p-6 text-center text-xs text-neutral-400 border-t border-neutral-100 font-mono">
        © 2026 CertFI Ledger Systems. Cryptographic credentials active.
      </footer>

    </div>
  );
}
