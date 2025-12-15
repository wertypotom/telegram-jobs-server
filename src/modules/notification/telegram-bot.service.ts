import { envConfig } from '@config/env.config';
import { Logger } from '@utils/logger';
import TelegramBot from 'node-telegram-bot-api';
import { User } from '@modules/user/user.model';
import { Feedback } from '@modules/feedback/feedback.model';

interface ISession {
  lastMessageId?: number;
  awaitingFeedback?: {
    category: 'BUG' | 'FEATURE' | 'UX' | 'SUBSCRIPTION' | 'OTHER';
    message?: string;
    awaitingMessage: boolean;
    awaitingRating: boolean;
  };
}

/**
 * TelegramBotService - Handles Telegram bot commands and notifications
 */
export class TelegramBotService {
  private static instance: TelegramBotService | null = null;
  private bot: TelegramBot | null = null;
  private sessions: Map<string, ISession> = new Map();

  private constructor() {
    if (!envConfig.telegramBotToken) {
      Logger.warn('TELEGRAM_BOT_TOKEN not set - bot features disabled');
      return;
    }

    // Production: Use webhooks to avoid 409 conflicts
    if (envConfig.nodeEnv === 'production') {
      this.bot = new TelegramBot(envConfig.telegramBotToken);
      // Setup webhook asynchronously (don't block constructor)
      this.setupWebhook().catch((err) => {
        Logger.error('Webhook setup failed (bot will not work):', err);
      });
      Logger.info('Telegram bot initialized with webhooks');
    } else {
      // Development: Use polling for easier local testing
      this.bot = new TelegramBot(envConfig.telegramBotToken, { polling: true });
      Logger.info('Telegram bot initialized with polling');
    }

    this.setupCommands();
  }

  /**
   * Get singleton instance
   */
  static getInstance(): TelegramBotService {
    if (!TelegramBotService.instance) {
      TelegramBotService.instance = new TelegramBotService();
    }
    return TelegramBotService.instance;
  }

  /**
   * Setup bot command handlers
   */
  private setupCommands(): void {
    if (!this.bot) return;

    // Register command handlers
    this.bot.onText(/\/start/, (msg) => this.handleStart(msg));
    this.bot.onText(/\/menu/, (msg) => this.handleMenu(msg));
    this.bot.onText(/\/subscribe (.+)/, (msg, match) =>
      this.handleSubscribe(msg, match)
    );
    this.bot.onText(/\/unsubscribe/, (msg) => this.handleUnsubscribe(msg));
    this.bot.onText(/\/status/, (msg) => this.handleStatus(msg));
    this.bot.onText(/\/help/, (msg) => this.handleHelp(msg));

    // Register callback query handler
    this.bot.on('callback_query', (query) => this.handleCallbackQuery(query));

    // Message handlers (for feedback text)
    this.bot.on('message', (msg) => this.handleMessage(msg));

    // Set bot commands menu
    this.bot.setMyCommands([
      { command: 'start', description: 'Start the bot' },
      { command: 'menu', description: 'Show main menu' },
      { command: 'status', description: 'Check subscription status' },
    ]);

    Logger.info('Telegram bot commands registered');
  }

  /**
   * Setup webhook for production
   */
  private async setupWebhook(): Promise<void> {
    if (!this.bot || !envConfig.telegramWebhookUrl) {
      Logger.warn('Webhook URL not configured - skipping webhook setup');
      return;
    }

    try {
      // Delete any existing webhook first
      await this.bot.deleteWebHook();

      // Set new webhook
      const webhookOptions: any = {};
      if (envConfig.telegramWebhookSecret) {
        webhookOptions.secret_token = envConfig.telegramWebhookSecret;
      }

      await this.bot.setWebHook(envConfig.telegramWebhookUrl, webhookOptions);
      Logger.info(`Webhook set successfully: ${envConfig.telegramWebhookUrl}`);
    } catch (error) {
      Logger.error('Failed to set webhook:', error);
      throw error;
    }
  }

  /**
   * Process webhook update (called by webhook endpoint)
   */
  async processUpdate(update: TelegramBot.Update): Promise<void> {
    if (!this.bot) return;

    try {
      // Process the update through the bot's internal handler
      await this.bot.processUpdate(update);
    } catch (error) {
      Logger.error('Error processing webhook update:', error);
    }
  }

  /**
   * /start - Welcome message with main menu (or auto-link if token provided)
   */
  private async handleStart(msg: TelegramBot.Message): Promise<void> {
    const chatId = msg.chat.id;
    const messageText = msg.text || '';

    // Extract token from /start TOKEN
    const parts = messageText.split(' ');
    const token = parts.length > 1 ? parts[1] : null;

    // If token provided, attempt auto-linking
    if (token) {
      await this.handleTokenSubscription(chatId, token);
      return;
    }

    // Check if user is already subscribed
    const user = await User.findOne({ telegramChatId: chatId.toString() });
    const isSubscribed = !!user?.telegramChatId;
    const isPaused = user && !user.notificationEnabled;

    // Different welcome based on status
    let welcomeText = '';

    if (isSubscribed && !isPaused) {
      welcomeText = `
✅ You're all set!

You'll receive notifications when jobs match your filters.

Manage settings: https://jobsniper.com/settings/notifications
      `;
    } else if (isPaused) {
      welcomeText = `
⏸️ Notifications Paused

Your Telegram is linked, but notifications are paused.

Resume anytime from the web app or menu below.
      `;
    } else {
      welcomeText = `
👋 Welcome to JobSniper!

Get instant notifications for jobs matching YOUR preferences.

To get started:
1. Visit https://jobsniper.com/settings/notifications
2. Toggle notifications ON
3. Click "Open in Telegram" button

What would you like to do?
      `;
    }

    const keyboard = {
      inline_keyboard: [
        // Dynamic button based on status
        isSubscribed && !isPaused
          ? [{ text: '⏸️ Pause Notifications', callback_data: 'pause' }]
          : isSubscribed && isPaused
          ? [{ text: '▶️ Resume Notifications', callback_data: 'resume' }]
          : [],
        [{ text: '📊 Check Status', callback_data: 'status' }],
        [{ text: '💬 Send Feedback', callback_data: 'feedback' }],
        // Full unsubscribe option (only if subscribed)
        isSubscribed
          ? [
              {
                text: '🔓 Completely Unsubscribe',
                callback_data: 'full_unsubscribe',
              },
            ]
          : [],
      ].filter((row) => row.length > 0), // Remove empty rows
    };

    await this.bot?.sendMessage(chatId, welcomeText, {
      reply_markup: keyboard,
    });
  }

  /**
   * /menu - Show main menu (same as /start but always shows menu)
   */
  private async handleMenu(msg: TelegramBot.Message): Promise<void> {
    const chatId = msg.chat.id;
    await this.showMainMenu(chatId);
  }

  /**
   * Handle token-based subscription (from deep link)
   */
  private async handleTokenSubscription(
    chatId: number,
    token: string
  ): Promise<void> {
    try {
      // Find user by token
      const user = await User.findOne({ telegramSubscriptionToken: token });

      if (!user) {
        await this.bot?.sendMessage(
          chatId,
          '❌ Invalid or expired link.\n\nPlease generate a new link from the settings page.'
        );
        return;
      }

      // Link chatId to user account
      user.telegramChatId = chatId.toString();
      user.notificationEnabled = true;
      user.telegramSubscriptionToken = undefined; // Clear token after use
      await user.save();

      const successText = `
🎉 Success!

You're now subscribed to Job Sniper notifications!

You'll receive alerts when jobs match your filters.

Manage your preferences:
→ https://jobsniper.com/settings/notifications
      `;

      const keyboard = {
        inline_keyboard: [
          [{ text: '⏸️ Pause Notifications', callback_data: 'pause' }],
          [{ text: '📊 View Status', callback_data: 'status' }],
          [
            {
              text: '⚙️ Open Settings',
              url: 'https://jobsniper.com/settings/notifications',
            },
          ],
        ],
      };

      await this.bot?.sendMessage(chatId, successText, {
        reply_markup: keyboard,
      });
      Logger.info(`User ${user._id} subscribed via token link`);
    } catch (error) {
      Logger.error('Token subscription error:', error);
      await this.bot?.sendMessage(
        chatId,
        '❌ An error occurred. Please try again later.'
      );
    }
  }

  /**
   * /subscribe <userId> - Link Telegram to JobSniper account
   */
  private async handleSubscribe(
    msg: TelegramBot.Message,
    match: RegExpExecArray | null
  ): Promise<void> {
    const chatId = msg.chat.id;
    const userId = match?.[1];

    if (!userId) {
      await this.bot?.sendMessage(
        chatId,
        '⚠️ Please provide your User ID.\n\nUsage: /subscribe YOUR_USER_ID'
      );
      return;
    }

    try {
      const user = await User.findById(userId);

      if (!user) {
        await this.bot?.sendMessage(
          chatId,
          '❌ User ID not found.\n\nPlease copy the correct ID from your settings page.'
        );
        return;
      }

      // Link chatId to user account
      user.telegramChatId = chatId.toString();
      user.notificationEnabled = true;
      await user.save();

      const confirmText = `
✅ Subscription activated!

You'll receive notifications when jobs match your filters.

Current filters:
${this.formatFilters(user.notificationFilters)}

Manage filters: https://jobsniper.com/settings/notifications
      `;

      const keyboard = {
        inline_keyboard: [
          [{ text: '⚙️ Settings', callback_data: 'settings' }],
          [{ text: '« Back to Main Menu', callback_data: 'main_menu' }],
        ],
      };

      await this.bot?.sendMessage(chatId, confirmText, {
        reply_markup: keyboard,
      });
      Logger.info(`User ${userId} subscribed to notifications`);
    } catch (error) {
      Logger.error('Subscribe error:', error);
      await this.bot?.sendMessage(
        chatId,
        '❌ An error occurred. Please try again later.'
      );
    }
  }

  /**
   * /unsubscribe - Disable notifications
   */
  private async handleUnsubscribe(msg: TelegramBot.Message): Promise<void> {
    const chatId = msg.chat.id;

    try {
      const user = await User.findOne({ telegramChatId: chatId.toString() });

      if (!user) {
        await this.bot?.sendMessage(
          chatId,
          '⚠️ You are not subscribed to notifications.'
        );
        return;
      }

      user.notificationEnabled = false;
      await user.save();

      await this.bot?.sendMessage(
        chatId,
        '🔕 Notifications paused.\n\nTo resume, use /subscribe command or visit settings.'
      );
      Logger.info(`User ${user._id} unsubscribed from notifications`);
    } catch (error) {
      Logger.error('Unsubscribe error:', error);
      await this.bot?.sendMessage(
        chatId,
        '❌ An error occurred. Please try again later.'
      );
    }
  }

  /**
   * Pause notifications (callback handler)
   */
  private async handlePause(chatId: number): Promise<void> {
    try {
      const user = await User.findOne({ telegramChatId: chatId.toString() });

      if (!user) {
        await this.bot?.sendMessage(chatId, '⚠️ You are not subscribed.');
        return;
      }

      user.notificationEnabled = false;
      await user.save();

      const text = `
⏸️ Notifications Paused

Your Telegram is still linked, but notifications are disabled.

✅ Resume easily:
• Click "Resume" below
• Or use /menu command
      `;

      const keyboard = {
        inline_keyboard: [
          [{ text: '▶️ Resume Notifications', callback_data: 'resume' }],
          [{ text: '🏠 Main Menu', callback_data: 'main_menu' }],
        ],
      };

      await this.bot?.sendMessage(chatId, text, { reply_markup: keyboard });
      Logger.info(`User ${user._id} paused notifications`);
    } catch (error) {
      Logger.error('Pause error:', error);
      await this.bot?.sendMessage(
        chatId,
        '❌ An error occurred. Please try again later.'
      );
    }
  }

  /**
   * Resume notifications (callback handler)
   */
  private async handleResume(chatId: number): Promise<void> {
    try {
      const user = await User.findOne({ telegramChatId: chatId.toString() });

      if (!user) {
        await this.bot?.sendMessage(chatId, '⚠️ You are not subscribed.');
        return;
      }

      user.notificationEnabled = true;
      await user.save();

      const text = `
▶️ Notifications Resumed!

You'll now receive job alerts when they match your filters.

Manage settings: https://jobsniper.com/settings/notifications
      `;

      const keyboard = {
        inline_keyboard: [
          [{ text: '⏸️ Pause Notifications', callback_data: 'pause' }],
          [{ text: '🏠 Main Menu', callback_data: 'main_menu' }],
        ],
      };

      await this.bot?.sendMessage(chatId, text, { reply_markup: keyboard });
      Logger.info(`User ${user._id} resumed notifications`);
    } catch (error) {
      Logger.error('Resume error:', error);
      await this.bot?.sendMessage(
        chatId,
        '❌ An error occurred. Please try again later.'
      );
    }
  }

  /**
   * Fully unsubscribe - remove Telegram link completely
   */
  private async handleFullUnsubscribe(chatId: number): Promise<void> {
    try {
      const user = await User.findOne({ telegramChatId: chatId.toString() });

      if (!user) {
        await this.bot?.sendMessage(chatId, '⚠️ You are not subscribed.');
        return;
      }

      // Completely remove Telegram link
      user.telegramChatId = undefined;
      user.notificationEnabled = false;
      await user.save();

      const text = `
🔓 Telegram Unlinked

Your Telegram has been completely disconnected from your account.

🔄 To re-enable notifications:
1. Visit https://jobsniper.work/settings/notifications
2. Click "Connect Telegram"
3. Return to this bot

💡 Tip: Use "Pause" instead if you just want to temporarily stop notifications.
      `;

      const keyboard = {
        inline_keyboard: [
          [{ text: '🏠 Main Menu', callback_data: 'main_menu' }],
        ],
      };

      await this.bot?.sendMessage(chatId, text, { reply_markup: keyboard });
      Logger.info(`User ${user._id} fully unsubscribed and unlinked Telegram`);
    } catch (error) {
      Logger.error('Full unsubscribe error:', error);
      await this.bot?.sendMessage(
        chatId,
        '❌ An error occurred. Please try again later.'
      );
    }
  }

  /**
   * /status - Show subscription status
   */
  private async handleStatus(msg: TelegramBot.Message): Promise<void> {
    const chatId = msg.chat.id;

    try {
      const user = await User.findOne({ telegramChatId: chatId.toString() });

      if (!user || !user.notificationEnabled) {
        await this.bot?.sendMessage(
          chatId,
          '⚠️ Notifications are disabled.\n\nUse /subscribe to enable.'
        );
        return;
      }

      const statusText = `
⚙️ Notification Settings

Status: ✅ Active
Filters: ${
        user.notificationFilters
          ? Object.keys(user.notificationFilters).length
          : 0
      } active
Last notification: ${
        user.lastNotificationSent
          ? new Date(user.lastNotificationSent).toLocaleString()
          : 'Never'
      }
Quiet hours: ${
        user.quietHours?.enabled
          ? `${user.quietHours.startHour}:00 - ${user.quietHours.endHour}:00`
          : 'Disabled'
      }
      `;

      const keyboard = {
        inline_keyboard: [
          [{ text: '🔕 Pause Notifications', callback_data: 'unsubscribe' }],
          [{ text: '« Back', callback_data: 'main_menu' }],
        ],
      };

      await this.bot?.sendMessage(chatId, statusText, {
        reply_markup: keyboard,
      });
    } catch (error) {
      Logger.error('Status error:', error);
      await this.bot?.sendMessage(
        chatId,
        '❌ An error occurred. Please try again later.'
      );
    }
  }

  /**
   * /help - Show all commands
   */
  private async handleHelp(msg: TelegramBot.Message): Promise<void> {
    const chatId = msg.chat.id;

    const helpText = `
📖 JobSniper Bot Commands

/start - Main menu
/subscribe <userId> - Enable notifications
/unsubscribe - Pause notifications
/status - View your settings
/help - Show this help message

💡 Tip: Use the buttons below for easier navigation!
    `;

    const keyboard = {
      inline_keyboard: [[{ text: '🏠 Main Menu', callback_data: 'main_menu' }]],
    };

    await this.bot?.sendMessage(chatId, helpText, { reply_markup: keyboard });
  }

  /**
   * Handle callback queries from inline keyboards
   */
  private async handleCallbackQuery(
    query: TelegramBot.CallbackQuery
  ): Promise<void> {
    const chatId = query.message?.chat.id;
    const data = query.data;

    if (!chatId || !data) return;

    // Answer callback to remove loading state
    await this.bot?.answerCallbackQuery(query.id);

    switch (data) {
      case 'main_menu':
        await this.showMainMenu(chatId);
        break;
      case 'subscribe_info':
        await this.showSubscribeInfo(chatId);
        break;
      case 'status':
        await this.handleStatus({
          chat: { id: chatId },
        } as TelegramBot.Message);
        break;
      case 'feedback':
        await this.showFeedbackCategories(chatId);
        break;
      case 'help':
        await this.handleHelp({ chat: { id: chatId } } as TelegramBot.Message);
        break;
      case 'pause':
        await this.handlePause(chatId);
        break;
      case 'resume':
        await this.handleResume(chatId);
        break;
      case 'full_unsubscribe':
      case 'unsubscribe':
        await this.handleFullUnsubscribe(chatId);
        break;

      // Feedback categories
      case 'fb_bug':
      case 'fb_feature':
      case 'fb_ux':
      case 'fb_subscription':
      case 'fb_other':
        await this.startFeedbackFlow(chatId, data);
        break;

      // Rating buttons
      case 'rating_1':
      case 'rating_2':
      case 'rating_3':
      case 'rating_4':
      case 'rating_5':
        await this.saveFeedbackRating(chatId, parseInt(data.split('_')[1]));
        break;
    }
  }

  /**
   * Handle text messages (for feedback)
   */
  private async handleMessage(msg: TelegramBot.Message): Promise<void> {
    const chatId = msg.chat.id;
    const text = msg.text;

    // Ignore commands
    if (text?.startsWith('/')) return;

    // Check if user is in feedback flow
    const session = this.sessions.get(chatId.toString());
    if (session?.awaitingFeedback?.awaitingMessage && text) {
      session.awaitingFeedback.message = text;
      session.awaitingFeedback.awaitingMessage = false;
      session.awaitingFeedback.awaitingRating = true;

      await this.askForRating(chatId);
    }
  }

  /**
   * Show main menu (dynamic based on subscription)
   */
  private async showMainMenu(chatId: number): Promise<void> {
    // Check if user is subscribed
    const user = await User.findOne({ telegramChatId: chatId.toString() });
    const isSubscribed = !!user?.telegramChatId;
    const isPaused = user && !user.notificationEnabled;

    const text = `
🏠 Main Menu

What would you like to do?
    `;

    const keyboard = {
      inline_keyboard: [
        // Dynamic button based on status
        isSubscribed && !isPaused
          ? [{ text: '⏸️ Pause Notifications', callback_data: 'pause' }]
          : isSubscribed && isPaused
          ? [{ text: '▶️ Resume Notifications', callback_data: 'resume' }]
          : [
              {
                text: '🔔 Subscribe to Notifications',
                callback_data: 'subscribe_info',
              },
            ],
        [{ text: '📊 Check Status', callback_data: 'status' }],
        [
          {
            text: '⚙️ Settings',
            url: `${envConfig.frontendUrl}/settings/notifications`,
          },
        ],
        [{ text: '💬 Send Feedback', callback_data: 'feedback' }],
        // Full unsubscribe option (only if subscribed)
        isSubscribed
          ? [
              {
                text: '🔓 Completely Unsubscribe',
                callback_data: 'full_unsubscribe',
              },
            ]
          : [],
      ].filter((row) => row.length > 0), // Remove empty rows
    };

    await this.bot?.sendMessage(chatId, text, { reply_markup: keyboard });
  }

  /**
   * Show subscribe instructions
   */
  private async showSubscribeInfo(chatId: number): Promise<void> {
    const text = `
🔔 Subscribe to Notifications

To enable notifications:

1. Visit https://jobsniper.work/settings/notifications
2. Copy your User ID
3. Send: /subscribe YOUR_USER_ID

You'll receive instant alerts for matching jobs!
    `;

    const keyboard = {
      inline_keyboard: [[{ text: '« Back', callback_data: 'main_menu' }]],
    };

    await this.bot?.sendMessage(chatId, text, { reply_markup: keyboard });
  }

  /**
   * Show feedback categories
   */
  private async showFeedbackCategories(chatId: number): Promise<void> {
    const text = `
📝 Thanks for your feedback!

What would you like to share?
    `;

    const keyboard = {
      inline_keyboard: [
        [{ text: '🐛 Report Bug', callback_data: 'fb_bug' }],
        [{ text: '💡 Feature Request', callback_data: 'fb_feature' }],
        [{ text: '🎨 UX Feedback', callback_data: 'fb_ux' }],
        [{ text: '💳 Subscription', callback_data: 'fb_subscription' }],
        [{ text: '💬 Other', callback_data: 'fb_other' }],
        [{ text: '« Back to Main Menu', callback_data: 'main_menu' }],
      ],
    };

    await this.bot?.sendMessage(chatId, text, { reply_markup: keyboard });
  }

  /**
   * Start feedback flow
   */
  private async startFeedbackFlow(
    chatId: number,
    categoryData: string
  ): Promise<void> {
    const categoryMap = {
      fb_bug: { category: 'BUG' as const, emoji: '🐛', title: 'Bug Report' },
      fb_feature: {
        category: 'FEATURE' as const,
        emoji: '💡',
        title: 'Feature Request',
      },
      fb_ux: {
        category: 'UX' as const,
        emoji: '🎨',
        title: 'User Experience',
      },
      fb_subscription: {
        category: 'SUBSCRIPTION' as const,
        emoji: '💳',
        title: 'Subscription & Membership',
      },
      fb_other: {
        category: 'OTHER' as const,
        emoji: '💬',
        title: 'Other Feedback',
      },
    };

    const { category, emoji, title } =
      categoryMap[categoryData as keyof typeof categoryMap];

    this.sessions.set(chatId.toString(), {
      awaitingFeedback: {
        category,
        awaitingMessage: true,
        awaitingRating: false,
      },
    });

    await this.bot?.sendMessage(
      chatId,
      `${emoji} ${title}\n\nPlease describe your feedback in detail.`
    );
  }

  /**
   * Ask for rating
   */
  private async askForRating(chatId: number): Promise<void> {
    const text = `
⭐ How would you rate your experience?
    `;

    const keyboard = {
      inline_keyboard: [
        [
          { text: '1⃣', callback_data: 'rating_1' },
          { text: '2⃣', callback_data: 'rating_2' },
          { text: '3⃣', callback_data: 'rating_3' },
          { text: '4⃣', callback_data: 'rating_4' },
          { text: '5⃣', callback_data: 'rating_5' },
        ],
      ],
    };

    await this.bot?.sendMessage(chatId, text, { reply_markup: keyboard });
  }

  /**
   * Save feedback with rating
   */
  private async saveFeedbackRating(
    chatId: number,
    rating: number
  ): Promise<void> {
    const session = this.sessions.get(chatId.toString());

    if (!session?.awaitingFeedback?.awaitingRating) return;

    try {
      const user = await User.findOne({ telegramChatId: chatId.toString() });

      const feedback = new Feedback({
        userId: user?._id,
        telegramChatId: chatId.toString(),
        source: 'TELEGRAM',
        message: session.awaitingFeedback.message,
        rating,
        category: session.awaitingFeedback.category,
        status: 'PENDING',
      });

      await feedback.save();

      this.sessions.delete(chatId.toString());

      const text = `
✅ Feedback received!

Your ${session.awaitingFeedback.category} has been recorded.
We review all feedback and will consider it for future updates.

Thank you for helping us improve JobSniper! 🚀
      `;

      const keyboard = {
        inline_keyboard: [
          [{ text: '🏠 Main Menu', callback_data: 'main_menu' }],
        ],
      };

      await this.bot?.sendMessage(chatId, text, { reply_markup: keyboard });
      Logger.info(`Feedback received from chat ${chatId}`);
    } catch (error) {
      Logger.error('Save feedback error:', error);
      await this.bot?.sendMessage(
        chatId,
        '❌ An error occurred. Please try again later.'
      );
    }
  }

  /**
   * Send a simple text message to a chat
   */
  async sendMessage(chatId: string, text: string): Promise<void> {
    if (!this.bot) return;

    try {
      await this.bot.sendMessage(chatId, text);
    } catch (error) {
      Logger.error(`Failed to send message to ${chatId}:`, error);
    }
  }

  /**
   * Send job notification to user
   */
  async sendJobNotification(chatId: string, job: any): Promise<void> {
    if (!this.bot) return;

    const text = `
🚀 New Job Match!

${job.parsedData.jobTitle || 'Job Position'} at ${
      job.parsedData.company || 'Company'
    }
💰 ${job.parsedData.salary || 'Salary not specified'}
🏠 ${job.parsedData.isRemote ? 'Remote' : job.parsedData.location || 'On-site'}
⏰ Just posted

🔗 View & Apply: ${envConfig.frontendUrl}/jobs/${job._id}
    `;

    const keyboard = {
      inline_keyboard: [
        [
          {
            text: '🔗 Open Job',
            url: `${envConfig.frontendUrl}/jobs/${job._id}`,
          },
        ],
      ],
    };

    try {
      await this.bot.sendMessage(chatId, text, { reply_markup: keyboard });
    } catch (error) {
      Logger.error(`Failed to send notification to ${chatId}:`, error);
    }
  }

  /**
   * Format filters for display
   */
  private formatFilters(filters: any): string {
    if (!filters) return '• No filters set';

    const parts: string[] = [];

    if (filters.stack?.length) {
      parts.push(`• Stack: ${filters.stack.join(', ')}`);
    }
    if (filters.level?.length) {
      parts.push(`• Level: ${filters.level.join(', ')}`);
    }
    if (filters.locationType?.length) {
      parts.push(`• Location: ${filters.locationType.join(', ')}`);
    }

    return parts.length ? parts.join('\n') : '• No filters set';
  }

  /**
   * Stop the bot
   */
  async stop(): Promise<void> {
    if (this.bot) {
      await this.bot.stopPolling();
      Logger.info('Telegram bot stopped');
    }
  }
}
