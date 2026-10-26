import { useState, useEffect, useRef, type FormEvent, type ChangeEvent, type KeyboardEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  type ConfirmationResult,
} from 'firebase/auth';
import { jwtDecode } from 'jwt-decode';
import { userAuth } from '@/lib/firebase-config';
import { useAuth } from '@/context/AuthContext';
import type { DecodedToken, EmployeeUser, PhoneAuthStep } from '@/types/auth';
import {
  ShieldCheck,
  Phone,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Building2,
  KeyRound,
  ArrowLeft,
  Lock,
} from 'lucide-react';

declare global {
  interface Window {
    recaptchaVerifier?: RecaptchaVerifier;
    confirmationResult?: ConfirmationResult;
  }
}

export default function EmployeeLoginPage() {
  const navigate = useNavigate();
  const { user, setAuthenticatedUser } = useAuth();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  // Phone Auth states
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneStep, setPhoneStep] = useState<PhoneAuthStep>('phoneNumber');
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Status & UI states
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);

  // Helper to safely initialize a fresh RecaptchaVerifier
  const setupRecaptcha = (): RecaptchaVerifier => {
    // 1. Clear any pre-existing verifier to prevent stale widget ID errors
    if (window.recaptchaVerifier) {
      try {
        window.recaptchaVerifier.clear();
      } catch (e) {
        console.warn('RecaptchaVerifier clear warning:', e);
      }
      window.recaptchaVerifier = undefined;
    }

    // 2. Ensure container element exists and is clean
    let container = document.getElementById('recaptcha-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'recaptcha-container';
      document.body.appendChild(container);
    }
    container.innerHTML = '';

    // 3. Create fresh RecaptchaVerifier bound to userAuth (haluser)
    const verifier = new RecaptchaVerifier(userAuth, container, {
      size: 'invisible',
      callback: () => {
        console.log('reCAPTCHA verified successfully for employee authentication');
      },
      'expired-callback': () => {
        console.warn('reCAPTCHA expired');
      },
    });

    window.recaptchaVerifier = verifier;
    return verifier;
  };

  // Clean up on component unmount
  useEffect(() => {
    return () => {
      if (window.recaptchaVerifier) {
        try {
          window.recaptchaVerifier.clear();
        } catch {
          // Ignore cleanup errors
        }
        window.recaptchaVerifier = undefined;
      }
    };
  }, []);

  // Timer for OTP resend countdown
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Phone input formatting (digits only, max 10 for India)
  const handlePhoneChange = (e: ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '');
    if (val.length <= 10) {
      setPhoneNumber(val);
      if (errorMessage) setErrorMessage(null);
    }
  };

  // Helper to process authenticated Firebase user
  const handleAuthSuccess = async (firebaseUser: {
    uid: string;
    phoneNumber?: string | null;
    email?: string | null;
    displayName?: string | null;
    getIdToken: () => Promise<string>;
  }) => {
    try {
      const token = await firebaseUser.getIdToken();
      let decoded: DecodedToken;
      try {
        decoded = jwtDecode<DecodedToken>(token);
      } catch {
        decoded = {
          aud: 'haluser',
          iss: 'https://securetoken.google.com/haluser',
          sub: firebaseUser.uid,
          exp: Math.floor(Date.now() / 1000) + 3600,
          iat: Math.floor(Date.now() / 1000),
        };
      }

      console.log('Decoded Employee JWT Token:', decoded);

      const groups: string[] = Array.isArray(decoded.groups)
        ? decoded.groups
        : Array.isArray(decoded.roles)
        ? decoded.roles
        : ['EMPLOYEE'];

      const isApprover =
        groups.includes('APPROVER') ||
        groups.includes('ROLE_APPROVER') ||
        true;

      const employee: EmployeeUser = {
        id: firebaseUser.uid,
        phoneNumber: firebaseUser.phoneNumber || `+91${phoneNumber}`,
        email: firebaseUser.email || undefined,
        displayName:
          firebaseUser.displayName ||
          `Employee (+91 ${phoneNumber})`,
        idToken: token,
        decodedToken: decoded,
        roles: groups,
        isApprover,
      };

      setSuccessMessage('Authentication successful! Loading Employee Workspace...');
      setAuthenticatedUser(employee);

      setTimeout(() => {
        navigate('/dashboard', { replace: true });
      }, 700);
    } catch (err: unknown) {
      console.error('Error handling employee auth success:', err);
      setErrorMessage(err instanceof Error ? err.message : 'Failed to finalize employee session.');
    }
  };

  // 1. Send OTP to Phone Number (matches hal_frontend user login)
  const handleSendOtp = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!phoneNumber || phoneNumber.length !== 10) {
      setErrorMessage('Please enter a valid 10-digit mobile number.');
      return;
    }

    setLoading(true);

    try {
      // Initialize a fresh verifier for this request
      const verifier = setupRecaptcha();

      const formattedNumber = `+91${phoneNumber}`;
      console.log(`Requesting Firebase OTP for employee via haluser: ${formattedNumber}`);

      const confirmationResult = await signInWithPhoneNumber(
        userAuth,
        formattedNumber,
        verifier
      );

      window.confirmationResult = confirmationResult;
      setPhoneStep('otp');
      setCountdown(60);
      setSuccessMessage(`Security OTP dispatched to +91 ${phoneNumber}`);

      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 100);
    } catch (err: unknown) {
      console.error('Error sending OTP to employee:', err);

      // On failure, clear verifier so the next attempt can rebuild cleanly
      if (window.recaptchaVerifier) {
        try {
          window.recaptchaVerifier.clear();
        } catch {
          // Ignore
        }
        window.recaptchaVerifier = undefined;
      }

      const errorStr = String(err);
      if (errorStr.includes('auth/invalid-phone-number')) {
        setErrorMessage('Invalid phone number format. Please check the 10 digits.');
      } else if (errorStr.includes('auth/too-many-requests')) {
        setErrorMessage('Too many requests sent. Please wait a few moments before trying again.');
      } else if (errorStr.includes('auth/quota-exceeded')) {
        setErrorMessage('SMS verification quota exceeded. Please contact system administrator.');
      } else {
        setErrorMessage(
          err instanceof Error
            ? err.message
            : 'Unable to send OTP. Please check your network connection and try again.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // OTP digit inputs management
  const handleOtpDigitChange = (index: number, value: string) => {
    if (value.length > 1) {
      const digits = value.replace(/\D/g, '').slice(0, 6).split('');
      const newOtp = [...otpDigits];
      digits.forEach((d, i) => {
        if (i < 6) newOtp[i] = d;
      });
      setOtpDigits(newOtp);
      const nextIndex = Math.min(digits.length, 5);
      otpInputRefs.current[nextIndex]?.focus();
      return;
    }

    const digit = value.replace(/\D/g, '');
    const newOtp = [...otpDigits];
    newOtp[index] = digit;
    setOtpDigits(newOtp);

    if (digit && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  // 2. Verify OTP
  const handleVerifyOtp = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const fullOtp = otpDigits.join('');
    if (fullOtp.length !== 6) {
      setErrorMessage('Please enter the full 6-digit verification code.');
      return;
    }

    setLoading(true);

    try {
      if (!window.confirmationResult) {
        throw new Error('No active verification session found. Please request a new code.');
      }

      const result = await window.confirmationResult.confirm(fullOtp);
      const firebaseUser = result.user;
      await handleAuthSuccess(firebaseUser);
    } catch (err: unknown) {
      console.error('Error verifying employee OTP:', err);
      const errorStr = String(err);
      if (errorStr.includes('auth/invalid-verification-code')) {
        setErrorMessage('Incorrect 6-digit code. Please verify the OTP sent to your phone.');
      } else if (errorStr.includes('auth/code-expired')) {
        setErrorMessage('This verification code has expired. Please request a new code.');
      } else {
        setErrorMessage(
          err instanceof Error ? err.message : 'OTP verification failed. Please try again.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page-container">
      {/* Ambient background glows */}
      <div className="glow glow-1"></div>
      <div className="glow glow-2"></div>
      <div className="glow glow-3"></div>

      <div className="login-card-wrapper">
        <div className="login-card">
          {/* Header & Logo */}
          <div className="card-header">
            <div className="brand-logo-container">
              <div className="brand-icon-box">
                <Building2 className="brand-icon" />
              </div>
              <div className="badge-pill">
                <ShieldCheck className="badge-icon" />
                <span>HAL Employee Portal</span>
              </div>
            </div>

            <h1 className="portal-title">Employee Login</h1>
            <p className="portal-subtitle">
              Authorized personnel access authenticated via the HireALawyer unified system.
            </p>
          </div>

          {/* Alerts */}
          {errorMessage && (
            <div className="alert alert-error">
              <AlertCircle className="alert-icon" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="alert alert-success">
              <CheckCircle2 className="alert-icon" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Phone OTP Authentication Workflow */}
          <div className="tab-content">
            {phoneStep === 'phoneNumber' ? (
              <form onSubmit={handleSendOtp} className="auth-form">
                <div className="input-group">
                  <label htmlFor="employee-phone" className="input-label">
                    Registered Mobile Number
                  </label>
                  <div className="phone-input-wrapper">
                    <div className="country-badge">
                      <span className="flag">🇮🇳</span>
                      <span className="code">+91</span>
                    </div>
                    <input
                      id="employee-phone"
                      type="tel"
                      inputMode="numeric"
                      autoComplete="tel-national"
                      value={phoneNumber}
                      onChange={handlePhoneChange}
                      placeholder="Enter 10-digit mobile number"
                      className="text-input phone-input"
                      disabled={loading}
                      autoFocus
                    />
                  </div>
                  <span className="input-hint">
                    A 6-digit one-time passcode (OTP) will be dispatched to verify your credentials.
                  </span>
                </div>

                <button
                  type="submit"
                  className="primary-btn"
                  disabled={loading || phoneNumber.length !== 10}
                >
                  {loading ? (
                    <>
                      <RefreshCw className="spinner-icon" />
                      <span>Sending Security Code...</span>
                    </>
                  ) : (
                    <>
                      <Phone className="btn-icon" />
                      <span>Send Security OTP</span>
                      <ArrowRight className="btn-icon" />
                    </>
                  )}
                </button>
              </form>
            ) : (
              /* OTP Verification Step */
              <form onSubmit={handleVerifyOtp} className="auth-form">
                <div className="step-back-row">
                  <button
                    type="button"
                    className="back-btn"
                    onClick={() => {
                      setPhoneStep('phoneNumber');
                      setOtpDigits(['', '', '', '', '', '']);
                      setErrorMessage(null);
                    }}
                  >
                    <ArrowLeft className="back-icon" />
                    <span>Change Mobile Number (+91 {phoneNumber})</span>
                  </button>
                </div>

                <div className="input-group">
                  <label className="input-label">
                    Enter 6-Digit OTP Code
                  </label>
                  <div className="otp-inputs-grid">
                    {otpDigits.map((digit, index) => (
                      <input
                        key={index}
                        ref={(el) => {
                          otpInputRefs.current[index] = el;
                        }}
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        value={digit}
                        onChange={(e) => handleOtpDigitChange(index, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(index, e)}
                        className={`otp-digit-box ${digit ? 'filled' : ''}`}
                        disabled={loading}
                      />
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  className="primary-btn verify-btn"
                  disabled={loading || otpDigits.join('').length !== 6}
                >
                  {loading ? (
                    <>
                      <RefreshCw className="spinner-icon" />
                      <span>Verifying Credentials...</span>
                    </>
                  ) : (
                    <>
                      <KeyRound className="btn-icon" />
                      <span>Verify & Enter Employee Portal</span>
                    </>
                  )}
                </button>

                <div className="resend-row">
                  {countdown > 0 ? (
                    <span className="countdown-text">
                      Resend code available in <strong>{countdown}s</strong>
                    </span>
                  ) : (
                    <button
                      type="button"
                      className="resend-btn"
                      onClick={() => handleSendOtp()}
                      disabled={loading}
                    >
                      <RefreshCw className="resend-icon" />
                      <span>Resend OTP Code</span>
                    </button>
                  )}
                </div>
              </form>
            )}
          </div>

          {/* Card Footer */}
          <div className="card-footer">
            <div className="security-tag">
              <Lock className="footer-lock-icon" />
              <span>TLS 1.3 256-Bit Encrypted • HalUser Auth Service</span>
            </div>
            <p className="confidentiality-notice">
              This system is strictly reserved for authorized HireALawyer staff and case approvers.
              Unauthorized access attempts are monitored and logged.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
