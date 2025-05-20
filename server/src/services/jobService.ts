import { supabase } from '../index'; // Import Supabase client from index.ts

// Define a basic Job type for backend operations.
// This could be more detailed, potentially sharing parts with frontend JobCard type.
interface Job {
  id: string;
  user_id: string;
  title: string;
  company: string;
  status: string; // Consider using the same enum as JobCard['status']
  notes?: string;
  position?: object; // e.g., { x: number; y: number }
  created_at?: string;
  updated_at?: string;
}

// Type for job creation payload, user_id will be passed separately
type CreateJobPayload = Omit<Job, 'id' | 'user_id' | 'created_at' | 'updated_at'>;

// Type for job update payload
// user_id and id are handled separately. created_at, updated_at are not updatable by user.
type UpdateJobPayload = Partial<Omit<Job, 'id' | 'user_id' | 'created_at' | 'updated_at'>>;


const JobService = {
  async createJob(userId: string, jobData: CreateJobPayload): Promise<Job> {
    const { data, error } = await supabase
      .from('jobs')
      .insert([{ ...jobData, user_id: userId }])
      .select()
      .single(); // Assuming insert returns the created row, and we want a single object

    if (error) {
      console.error('Error creating job in Supabase:', error);
      throw new Error(error.message);
    }
    if (!data) {
      throw new Error('Failed to create job, no data returned from Supabase.');
    }
    return data as Job;
  },

  async getJobsByUserId(userId: string): Promise<Job[]> {
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching jobs by user ID from Supabase:', error);
      throw new Error(error.message);
    }
    return (data as Job[]) || [];
  },

  async getJobById(jobId: string, userId: string): Promise<Job | null> {
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', jobId)
      .single(); // Use single to get one record or null

    if (error && error.code !== 'PGRST116') { // PGRST116: "No rows found"
      console.error('Error fetching job by ID from Supabase:', error);
      throw new Error(error.message);
    }
    if (!data) {
      return null; // Job not found
    }
    if (data.user_id !== userId) {
      // Authorization check: Job does not belong to the user
      // This check is crucial for security.
      console.warn(`User ${userId} attempted to access job ${jobId} owned by ${data.user_id}`);
      return null; // Or throw a specific authorization error
    }
    return data as Job;
  },

  async updateJob(jobId: string, userId: string, jobData: UpdateJobPayload): Promise<Job | null> {
    // First, verify ownership by trying to fetch the job
    const jobToUpdate = await this.getJobById(jobId, userId);
    if (!jobToUpdate) {
      return null; // Job not found or user does not own it
    }

    // Ensure user_id is not part of jobData to prevent changing ownership
    if ((jobData as any).user_id) {
        delete (jobData as any).user_id;
    }
    if (Object.keys(jobData).length === 0) {
        // No actual fields to update, return current job or handle as no-op
        return jobToUpdate;
    }

    const { data, error } = await supabase
      .from('jobs')
      .update(jobData)
      .eq('id', jobId)
      .eq('user_id', userId) // Double check ownership on update
      .select()
      .single();

    if (error) {
      console.error('Error updating job in Supabase:', error);
      throw new Error(error.message);
    }
    if (!data) {
        // This case should ideally not be reached if jobToUpdate was found
        // and update operation itself didn't error but returned no data.
        return null; 
    }
    return data as Job;
  },

  async deleteJob(jobId: string, userId: string): Promise<Job | null> {
    // First, verify ownership by trying to fetch the job
    const jobToDelete = await this.getJobById(jobId, userId);
    if (!jobToDelete) {
      return null; // Job not found or user does not own it
    }

    const { error } = await supabase
      .from('jobs')
      .delete()
      .eq('id', jobId)
      .eq('user_id', userId); // Double check ownership on delete

    if (error) {
      console.error('Error deleting job in Supabase:', error);
      throw new Error(error.message);
    }
    // Return the job data that was deleted (fetched before deletion)
    return jobToDelete;
  },
};

export default JobService;
