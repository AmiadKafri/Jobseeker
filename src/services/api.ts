import { JobCard } from '../types'; // Assuming JobCard is the primary type

const API_BASE_URL = 'http://localhost:3001/api'; // Backend API base URL

interface ApiErrorResponse {
  error: string;
  details?: any;
}

// Helper to handle API responses
async function handleResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get('content-type');
  let responseData;

  if (contentType && contentType.includes('application/json')) {
    responseData = await response.json();
  } else {
    // Handle non-JSON responses if necessary, or assume error for now
    if (!response.ok) {
      throw new Error(`Server responded with status ${response.status}`);
    }
    // If response is OK but not JSON, it might be an empty response (e.g., for DELETE)
    // or text. For now, we'll assume it's okay if the status is okay.
    return {} as T; // Or handle as appropriate
  }

  if (!response.ok) {
    const error: ApiErrorResponse = responseData;
    console.error('API Error:', error);
    throw new Error(error.error || `Server responded with status ${response.status}`);
  }
  return responseData as T;
}


export async function getJobs(token: string): Promise<JobCard[]> {
  const response = await fetch(`${API_BASE_URL}/jobs`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  // The backend returns jobs which should match JobCard[]
  // Backend jobs have user_id, created_at, updated_at which are not on JobCard.
  // This is fine, TypeScript will only care about the fields defined in JobCard.
  return handleResponse<JobCard[]>(response);
}

// Backend expects: user_id, title, company, status, notes, position
// JobCard has: id, title, company, status, notes, position
// For addJob, id is backend-generated. user_id comes from token (server-side).
// So, frontend sends: title, company, notes (from Omit) and optionally position, status
export type AddJobPayload = Omit<JobCard, 'id' | 'user_id' | 'position' | 'status'> & {
  position?: { x: number; y: number };
  status?: JobCard['status']; // Ensure status matches the allowed JobCard status types
};

export async function addJob(token: string, jobData: AddJobPayload): Promise<JobCard> {
  // Ensure a default status and position if not provided, or ensure backend handles defaults.
  // For now, let's assume backend handles missing optional fields appropriately or they are always sent.
  const payload = {
    ...jobData,
    // Ensure status is one of the predefined column statuses if not provided,
    // or make it mandatory in the payload type if it's always required.
    // Defaulting to 'wishlist' if not provided for example.
    status: jobData.status || 'wishlist',
    // Default position if not provided, though usually it's set by user interaction.
    position: jobData.position || { x: 0, y: 0 }
  };

  const response = await fetch(`${API_BASE_URL}/jobs`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  return handleResponse<JobCard>(response);
}


// For updateJob, we can send partial data.
// Backend Job: id, user_id, title, company, status, notes, position, created_at, updated_at
// Frontend JobCard: id, title, company, status, notes, position
// We should not send user_id. id is in URL.
export type UpdateJobPayload = Partial<Omit<JobCard, 'id' | 'user_id'>>;

export async function updateJob(token: string, jobId: string, jobData: UpdateJobPayload): Promise<JobCard> {
  const response = await fetch(`${API_BASE_URL}/jobs/${jobId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(jobData),
  });
  return handleResponse<JobCard>(response);
}

export async function deleteJob(token: string, jobId: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/jobs/${jobId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  // Delete might return a 200 with the deleted job or 204 No Content
  // handleResponse needs to be able to cope with empty JSON for 204
  // For now, if response.ok and no json, it returns {} as T, which is fine for void.
  await handleResponse<void>(response); // Or just check response.ok and throw otherwise
}
