import { JobCard } from '../types';
import { supabase } from '../lib/supabase';

export type AddJobPayload = Omit<JobCard, 'id' | 'user_id' | 'position' | 'status'> & {
  position?: { x: number; y: number };
  status?: JobCard['status'];
};

export async function getJobs(): Promise<JobCard[]> {
  const { data, error } = await supabase
    .from('jobs')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data as JobCard[];
}

export async function addJob(jobData: AddJobPayload): Promise<JobCard> {
  const user = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from('jobs')
    .insert([
      {
        ...jobData,
        status: jobData.status || 'wishlist',
        position: jobData.position || { x: 0, y: 0 },
        user_id: user.data.user?.id,
      },
    ])
    .select()
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data as JobCard;
}

export type UpdateJobPayload = Partial<Omit<JobCard, 'id' | 'user_id'>>;

export async function updateJob(jobId: string, jobData: UpdateJobPayload): Promise<JobCard> {
  const { data, error } = await supabase
    .from('jobs')
    .update(jobData)
    .eq('id', jobId)
    .select()
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data as JobCard;
}

export async function deleteJob(jobId: string): Promise<void> {
  const { error } = await supabase
    .from('jobs')
    .delete()
    .eq('id', jobId);
  if (error) throw new Error(error.message);
}
