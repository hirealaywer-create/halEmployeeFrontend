export interface PendingLawyerDTO {
  lawyerId: string;
  fullName: string;
  email: string;
  mobileNumber: string;
  barCouncilId: string;
  barCouncilState: string;
  enrollmentYear: number;
  experienceYears: number;
  city: string;
  state: string;
  copDocumentUrl?: string;
  barCouncilIdDocumentUrl?: string;
  enrollmentCertificateUrl?: string;
  submittedAt?: string;
}

export interface ApproveLawyerRequestDTO {
  lawyerId: string;
  number?: string;
  isApproved: boolean;
  validTill?: string; // YYYY-MM-DD
  rejectionReason?: string;
}

export interface ApiResponse<T> {
  error: boolean;
  errors?: Array<{ errorCode: string; errorMessage: string }>;
  data: T;
}

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_USER_API_URL ||
  'https://hirealawyer.in/api/common';

/**
 * Fetch pending or suspended lawyers for approval
 * Endpoint: GET /employee/get-lawyers?suspendedLawyers={boolean}
 */
export async function fetchLawyers(
  token: string,
  suspendedLawyers: boolean = false
): Promise<PendingLawyerDTO[]> {
  const url = `${API_BASE_URL}/employee/get-lawyers?suspendedLawyers=${suspendedLawyers}`;
  console.log(`Fetching lawyers from: ${url}`);

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    let parsedMessage = errorText;
    try {
      const parsed = JSON.parse(errorText);
      if (parsed.errors && parsed.errors.length > 0) {
        parsedMessage = parsed.errors.map((e: { errorMessage: string }) => e.errorMessage).join(', ');
      }
    } catch {
      // Use raw text
    }
    throw new Error(`API Error (${response.status}): ${parsedMessage}`);
  }

  const json: ApiResponse<PendingLawyerDTO[]> = await response.json();
  if (json.error && json.errors && json.errors.length > 0) {
    throw new Error(json.errors.map((e) => e.errorMessage).join(', '));
  }

  return json.data || [];
}

/**
 * Approve or reject lawyer signup
 * Endpoint: POST /employee/approve-lawyer
 */
export async function approveOrRejectLawyer(
  token: string,
  request: ApproveLawyerRequestDTO
): Promise<string> {
  const url = `${API_BASE_URL}/employee/approve-lawyer`;
  console.log(`Submitting lawyer approval request to: ${url}`, request);

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorText = await response.text();
    let parsedMessage = errorText;
    try {
      const parsed = JSON.parse(errorText);
      if (parsed.errors && parsed.errors.length > 0) {
        parsedMessage = parsed.errors.map((e: { errorMessage: string }) => e.errorMessage).join(', ');
      }
    } catch {
      // Use raw text
    }
    throw new Error(`API Error (${response.status}): ${parsedMessage}`);
  }

  const json: ApiResponse<string> = await response.json();
  if (json.error && json.errors && json.errors.length > 0) {
    throw new Error(json.errors.map((e) => e.errorMessage).join(', '));
  }

  return json.data || 'Action processed successfully';
}
