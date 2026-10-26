export interface DecodedToken {
  aud: string;
  iss: string;
  sub: string;
  user_id?: string;
  phone_number?: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  groups?: string[];
  roles?: string[];
  authorities?: string[];
  exp: number;
  iat: number;
  [key: string]: unknown;
}

export interface EmployeeUser {
  id: string; // Firebase UID
  phoneNumber?: string;
  email?: string;
  displayName: string;
  idToken: string;
  decodedToken: DecodedToken;
  roles: string[];
  isApprover: boolean;
}

export type LoginMode = 'phone' | 'email';
export type PhoneAuthStep = 'phoneNumber' | 'otp';
