import { Router } from 'express';
import { JobController } from './job.controller';
import { authenticate } from '@middlewares/auth.middleware';

const router = Router();
const jobController = new JobController();

// All routes require authentication
router.use(authenticate);

// Search skills
router.get('/skills/search', jobController.searchSkills);

// Get all jobs
router.get('/', jobController.getJobs);
// Get specific job
router.get('/:id', jobController.getJobById);

// Mark job as viewed
router.post('/:id/view', jobController.markJobAsViewed);

export default router;
