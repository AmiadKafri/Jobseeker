import { Router, Request, Response } from 'express';
// No longer need direct supabase import here
import { authMiddleware } from '../middleware/authMiddleware';
import JobService from '../services/jobService'; // Import the JobService

const router = Router();

// Apply auth middleware to all routes in this router
router.use(authMiddleware);

// POST /api/jobs - Create a new job
router.post('/', async (req: Request, res: Response) => {
  const { title, company, status, notes, position } = req.body;
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ error: 'User not authenticated' });
  }
  if (!title || !company || !status) {
    return res.status(400).json({ error: 'title, company, and status are required' });
  }

  try {
    const jobData = { title, company, status, notes, position };
    const newJob = await JobService.createJob(userId, jobData);
    return res.status(201).json(newJob);
  } catch (err: any) {
    console.error('Error in POST /api/jobs:', err.message);
    return res.status(500).json({ error: err.message || 'Failed to create job' });
  }
});

// GET /api/jobs - Retrieve all jobs for the authenticated user
router.get('/', async (req: Request, res: Response) => {
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ error: 'User not authenticated' });
  }

  try {
    const jobs = await JobService.getJobsByUserId(userId);
    return res.status(200).json(jobs);
  } catch (err: any) {
    console.error('Error in GET /api/jobs:', err.message);
    return res.status(500).json({ error: err.message || 'Failed to retrieve jobs' });
  }
});

// GET /api/jobs/:id - Retrieve a single job by its ID
router.get('/:id', async (req: Request, res: Response) => {
  const { id: jobId } = req.params;
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ error: 'User not authenticated' });
  }
  if (!jobId) {
    return res.status(400).json({ error: 'Job ID is required' });
  }

  try {
    const job = await JobService.getJobById(jobId, userId);
    if (!job) {
      // Service returns null if not found or not owned.
      // This implies a 404 as the user either can't see it or it doesn't exist for them.
      return res.status(404).json({ error: 'Job not found or access denied' });
    }
    return res.status(200).json(job);
  } catch (err: any) {
    console.error(`Error in GET /api/jobs/${jobId}:`, err.message);
    return res.status(500).json({ error: err.message || 'Failed to retrieve job' });
  }
});

// PUT /api/jobs/:id - Update an existing job by its ID
router.put('/:id', async (req: Request, res: Response) => {
  const { id: jobId } = req.params;
  const userId = req.user?.id;
  const jobDataToUpdate = req.body;

  if (!userId) {
    return res.status(401).json({ error: 'User not authenticated' });
  }
  if (!jobId) {
    return res.status(400).json({ error: 'Job ID is required' });
  }
  if (Object.keys(jobDataToUpdate).length === 0) {
    return res.status(400).json({ error: 'Request body cannot be empty for update' });
  }
  // Prevent changing user_id or id via request body
  if (jobDataToUpdate.user_id) {
    return res.status(400).json({ error: 'Cannot change job ownership (user_id)' });
  }
  if (jobDataToUpdate.id) {
    return res.status(400).json({ error: 'Cannot change job ID in body' });
  }

  try {
    const updatedJob = await JobService.updateJob(jobId, userId, jobDataToUpdate);
    if (!updatedJob) {
      return res.status(404).json({ error: 'Job not found, no changes made, or access denied' });
    }
    return res.status(200).json(updatedJob);
  } catch (err: any) {
    console.error(`Error in PUT /api/jobs/${jobId}:`, err.message);
    return res.status(500).json({ error: err.message || 'Failed to update job' });
  }
});

// DELETE /api/jobs/:id - Delete a job by its ID
router.delete('/:id', async (req: Request, res: Response) => {
  const { id: jobId } = req.params;
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ error: 'User not authenticated' });
  }
  if (!jobId) {
    return res.status(400).json({ error: 'Job ID is required' });
  }

  try {
    const deletedJob = await JobService.deleteJob(jobId, userId);
    if (!deletedJob) {
      // Service returns null if job not found or user doesn't own it.
      return res.status(404).json({ error: 'Job not found or access denied' });
    }
    // Return the data of the job that was deleted, as returned by the service
    return res.status(200).json({ message: 'Job deleted successfully', deletedJob });
  } catch (err: any) {
    console.error(`Error in DELETE /api/jobs/${jobId}:`, err.message);
    return res.status(500).json({ error: err.message || 'Failed to delete job' });
  }
});

export default router;
