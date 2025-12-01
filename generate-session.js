const { TelegramClient } = require('telegram');
const { StringSession } = require('telegram/sessions');
const input = require('input');
require('dotenv').config();

const apiId = parseInt(process.env.TELEGRAM_API_ID);
const apiHash = process.env.TELEGRAM_API_HASH;

if (!apiId || !apiHash) {
  console.error('❌ Error: TELEGRAM_API_ID and TELEGRAM_API_HASH must be set in .env');
  process.exit(1);
}

(async () => {
  console.log('🔐 Telegram Session Generator\n');
  
  const client = new TelegramClient(
    new StringSession(''), 
    apiId, 
    apiHash,
    { connectionRetries: 5 }
  );
  
  try {
    await client.start({
      phoneNumber: async () => await input.text('📱 Phone number (with country code, e.g., +1234567890): '),
      password: async () => await input.text('🔒 2FA Password (press Enter if not enabled): '),
      phoneCode: async () => await input.text('💬 Code from Telegram: '),
      onError: (err) => console.log('❌ Error:', err),
    });
    
    console.log('\n✅ Successfully authenticated!\n');
    console.log('📋 Your TELEGRAM_SESSION_STRING:\n');
    console.log('─'.repeat(60));
    console.log(client.session.save());
    console.log('─'.repeat(60));
    console.log('\n💡 Copy the string above to TELEGRAM_SESSION_STRING in your .env file\n');
    
    await client.disconnect();
  } catch (error) {
    console.error('❌ Failed to generate session:', error.message);
    process.exit(1);
  }
})();
