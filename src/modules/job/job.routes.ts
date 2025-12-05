import { Router } from 'express';
import { JobController } from './job.controller';
import { authenticate } from '@middlewares/auth.middleware';

const router = Router();
const jobController = new JobController();

// All routes require authentication
router.use(authenticate);

// Search skills
router.get('/skills/search', jobController.searchSkills);

// Search job functions
router.get('/functions/search', jobController.searchJobFunctions);

// Search jobs with filters (POST for complex body)
router.post('/search', jobController.getJobs);

// Get specific job
router.get('/:id', jobController.getJobById);

// Mark job as viewed
router.post('/:id/view', jobController.markJobAsViewed);

export default router;
