/**
 * Debug script to test token subscription flow
 * Run: npx ts-node debug-token.ts
 */

import { User } from './src/modules/user/user.model';
import mongoose from 'mongoose';

async function debugToken() {
  // Connect to MongoDB
  await mongoose.connect(
    process.env.MONGODB_URI || 'mongodb://localhost:27017/telegram-jobs'
  );

  // Find users with tokens
  const usersWithTokens = await User.find({
    telegramSubscriptionToken: { $exists: true, $ne: null },
  });

  console.log(
    `\n📊 Found ${usersWithTokens.length} users with subscription tokens:\n`
  );

  usersWithTokens.forEach((user) => {
    console.log(`User ID: ${user._id}`);
    console.log(`Email: ${user.email}`);
    console.log(`Token: ${user.telegramSubscriptionToken}`);
    console.log(`ChatId: ${user.telegramChatId || 'NOT SET'}`);
    console.log(`Subscribed: ${!!user.telegramChatId}`);
    console.log(
      `Deep Link: https://t.me/jobsniper_v2_bot?start=${user.telegramSubscriptionToken}`
    );
    console.log('---\n');
  });

  // Close connection
  await mongoose.disconnect();
}

debugToken().catch(console.error);
