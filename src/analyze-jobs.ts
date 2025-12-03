import 'tsconfig-paths/register';
import 'dotenv/config';
import mongoose from 'mongoose';
import { envConfig } from '@config/env.config';
import { Job } from '@modules/job/job.model';

async function analyzeJobs() {
  try {
    await mongoose.connect(envConfig.mongodbUri);
    console.log('Connected to MongoDB');

    const jobs = await Job.find().sort({ createdAt: -1 }).limit(20);
    console.log(`Found ${jobs.length} jobs`);

    jobs.forEach((job, index) => {
      console.log(`\n--- Job ${index + 1} ---`);
      console.log(`ID: ${job._id}`);
      console.log(`Channel: ${job.channelId}`);
      console.log(`Status: ${job.status}`);
      console.log('Parsed Data:', JSON.stringify(job.parsedData, null, 2));
      console.log('Raw Text Snippet (first 200 chars):');
      console.log(job.rawText.substring(0, 200));
      console.log('--- End Job ---\n');
    });

    await mongoose.disconnect();
  } catch (error) {
    console.error('Analysis failed:', error);
    process.exit(1);
  }
}

analyzeJobs();
