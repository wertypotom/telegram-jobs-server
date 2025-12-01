import { Router } from 'express';
import { JobController } from './job.controller';

const router = Router();
const jobController = new JobController();

// Get all jobs
router.get('/', jobController.getJobs);
// Get specific job
router.get('/:id', jobController.getJobById);

// Mark job as viewed
router.post('/:id/view', jobController.markJobAsViewed);

export default router;
