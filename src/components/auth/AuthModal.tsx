import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { Modal } from '../ui/Modal.tsx';
import { Button } from '../ui/Button.tsx';
import { Input } from '../ui/Input.tsx';
import { Badge } from '../ui/Badge.tsx';
import { Mail, Lock, User, GraduationCap, Calendar, Sparkles, CheckCircle2 } from 'lucide-react';
import { UserRegistrationSchema } from '../../models/validation.ts';

export const AuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    closeAuthModal,
    authModalTab,
    login,
    signup,
    switchAccount,
  } = useAuth();

  const [activeTab, setActiveTab] = useState<'login' | 'signup' | 'forgot'>(authModalTab);

  // Sync tab with context if opened with a specific tab
  React.useEffect(() => {
    setActiveTab(authModalTab);
  }, [authModalTab]);

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Signup form state
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupCollege, setSignupCollege] = useState('IIT Delhi');
  const [signupGradYear, setSignupGradYear] = useState('2026');
  const [signupErrors, setSignupErrors] = useState<Record<string, string>>({});

  // Forgot password state
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSubmitted, setForgotSubmitted] = useState(false);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsLoading(true);
    try {
      if (!loginEmail || !loginPassword) {
        setLoginError('Please enter both email and password');
        setIsLoading(false);
        return;
      }
      const res = await login(loginEmail, loginPassword);
      if (!res.success) {
        setLoginError(res.error || 'Failed to authenticate');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupErrors({});
    setIsLoading(true);

    const parseResult = UserRegistrationSchema.safeParse({
      name: signupName,
      email: signupEmail,
      password: signupPassword,
      college: signupCollege,
      gradYear: parseInt(signupGradYear, 10),
    });

    if (!parseResult.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parseResult.error.issues) {
        const fieldName = issue.path[0]?.toString() || 'form';
        fieldErrors[fieldName] = issue.message;
      }
      setSignupErrors(fieldErrors);
      setIsLoading(false);
      return;
    }

    try {
      await signup(
        signupName,
        signupEmail,
        signupPassword,
        signupCollege,
        parseInt(signupGradYear, 10)
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = (account: 'aarav-sharma' | 'priya-patel' | 'admin-user') => {
    switchAccount(account);
    closeAuthModal();
  };

  return (
    <Modal
      isOpen={isAuthModalOpen}
      onClose={closeAuthModal}
      title={
        activeTab === 'login'
          ? 'Sign in to rJobs'
          : activeTab === 'signup'
          ? 'Create your Candidate Account'
          : 'Reset your password'
      }
      description={
        activeTab === 'login'
          ? 'Access your resume studio, job radar alerts, and applications'
          : activeTab === 'signup'
          ? 'Free for Indian university students and early-career job seekers'
          : 'Enter your registered email address to receive reset instructions'
      }
      maxWidth="md"
    >
      {/* Tab toggle */}
      <div className="flex border-b border-slate-800 mb-5">
        <button
          type="button"
          onClick={() => {
            setActiveTab('login');
            setLoginError('');
          }}
          className={`flex-1 py-2 text-xs font-semibold text-center border-b-2 transition-colors cursor-pointer ${
            activeTab === 'login'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Sign In
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab('signup');
            setSignupErrors({});
          }}
          className={`flex-1 py-2 text-xs font-semibold text-center border-b-2 transition-colors cursor-pointer ${
            activeTab === 'signup'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Sign Up
        </button>
      </div>

      {/* Quick Demo Switcher Card */}
      <div className="mb-5 p-3 rounded-xl bg-indigo-950/40 border border-indigo-900/60">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-300 mb-2">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Quick 1-Click Demo Profiles (Pre-seeded with real data)</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => handleDemoLogin('aarav-sharma')}
            className="text-left p-2 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-indigo-900/40 text-xs transition-colors cursor-pointer"
          >
            <div className="font-semibold text-slate-200 flex items-center justify-between">
              <span>Aarav Sharma</span>
              <Badge variant="purple" size="sm">Pro</Badge>
            </div>
            <div className="text-[11px] text-slate-400 truncate">IIT Delhi '26 • SDE Intern</div>
          </button>

          <button
            type="button"
            onClick={() => handleDemoLogin('priya-patel')}
            className="text-left p-2 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-indigo-900/40 text-xs transition-colors cursor-pointer"
          >
            <div className="font-semibold text-slate-200 flex items-center justify-between">
              <span>Priya Patel</span>
              <Badge variant="default" size="sm">Free</Badge>
            </div>
            <div className="text-[11px] text-slate-400 truncate">BITS Pilani '25 • AI/ML Intern</div>
          </button>
        </div>
      </div>

      {/* Login Tab Content */}
      {activeTab === 'login' && (
        <form onSubmit={handleLoginSubmit} className="space-y-4">
          <Input
            label="Email Address"
            type="email"
            placeholder="aarav.sharma@iitd.ac.in"
            value={loginEmail}
            onChange={(e) => setLoginEmail(e.target.value)}
            leftIcon={<Mail className="h-4 w-4" />}
            required
          />

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-semibold text-slate-300">Password</label>
              <button
                type="button"
                onClick={() => setActiveTab('forgot')}
                className="text-xs text-indigo-400 hover:text-indigo-300 cursor-pointer"
              >
                Forgot password?
              </button>
            </div>
            <Input
              type="password"
              placeholder="••••••••••••"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              leftIcon={<Lock className="h-4 w-4" />}
              required
            />
          </div>

          {loginError && (
            <div className="p-2.5 rounded-lg bg-rose-950/60 border border-rose-800/60 text-xs text-rose-300 font-medium">
              {loginError}
            </div>
          )}

          <Button type="submit" variant="primary" className="w-full" isLoading={isLoading}>
            Sign In to Dashboard
          </Button>

          <p className="text-center text-xs text-slate-400 pt-2">
            Don't have an account?{' '}
            <button
              type="button"
              onClick={() => setActiveTab('signup')}
              className="text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer"
            >
              Sign up free
            </button>
          </p>
        </form>
      )}

      {/* Signup Tab Content */}
      {activeTab === 'signup' && (
        <form onSubmit={handleSignupSubmit} className="space-y-3.5">
          <Input
            label="Full Name"
            placeholder="e.g. Rohan Varma"
            value={signupName}
            onChange={(e) => setSignupName(e.target.value)}
            leftIcon={<User className="h-4 w-4" />}
            error={signupErrors.name}
            required
          />

          <Input
            label="University or Personal Email"
            type="email"
            placeholder="rohan@university.edu or gmail"
            value={signupEmail}
            onChange={(e) => setSignupEmail(e.target.value)}
            leftIcon={<Mail className="h-4 w-4" />}
            error={signupErrors.email}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="College / Institute"
              placeholder="e.g. IIT Delhi, NITK, BITS"
              value={signupCollege}
              onChange={(e) => setSignupCollege(e.target.value)}
              leftIcon={<GraduationCap className="h-4 w-4" />}
              error={signupErrors.college}
            />

            <Input
              label="Graduation Year"
              type="number"
              min={2023}
              max={2030}
              placeholder="2026"
              value={signupGradYear}
              onChange={(e) => setSignupGradYear(e.target.value)}
              leftIcon={<Calendar className="h-4 w-4" />}
              error={signupErrors.gradYear}
            />
          </div>

          <Input
            label="Password (min 8 characters)"
            type="password"
            placeholder="••••••••••••"
            value={signupPassword}
            onChange={(e) => setSignupPassword(e.target.value)}
            leftIcon={<Lock className="h-4 w-4" />}
            error={signupErrors.password}
            required
          />

          <div className="text-[11px] text-slate-400 leading-normal">
            By signing up, you agree to the{' '}
            <span className="text-slate-200 underline">Terms of Service</span> and acknowledge our{' '}
            <span className="text-slate-200 underline">DPDP-Compliant Privacy Policy</span>.
          </div>

          <Button type="submit" variant="primary" className="w-full" isLoading={isLoading}>
            Create Free Account
          </Button>
        </form>
      )}

      {/* Forgot Password Content */}
      {activeTab === 'forgot' && (
        <div className="space-y-4">
          {forgotSubmitted ? (
            <div className="p-4 rounded-xl bg-emerald-950/50 border border-emerald-800 text-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
              <h4 className="text-sm font-semibold text-emerald-200">Reset instructions sent</h4>
              <p className="text-xs text-slate-300 mt-1">
                We've sent a secure reset link to <span className="font-semibold">{forgotEmail}</span>.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => {
                  setForgotSubmitted(false);
                  setActiveTab('login');
                }}
              >
                Back to Sign In
              </Button>
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (forgotEmail) setForgotSubmitted(true);
              }}
              className="space-y-4"
            >
              <Input
                label="Your Registered Email"
                type="email"
                placeholder="name@example.com"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                leftIcon={<Mail className="h-4 w-4" />}
                required
              />
              <Button type="submit" variant="primary" className="w-full">
                Send Reset Link
              </Button>
              <button
                type="button"
                onClick={() => setActiveTab('login')}
                className="w-full text-center text-xs text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                Cancel and return to login
              </button>
            </form>
          )}
        </div>
      )}
    </Modal>
  );
};
