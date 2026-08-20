const Notification = require('../models/Notification');

/**
 * Creates an in-app notification for a user.
 * Silently catches errors to not block primary business transactions.
 */
const createNotification = async ({ recipient, title, message, type = 'SYSTEM', link = '' }) => {
  try {
    if (!recipient) return null;
    const notification = await Notification.create({
      recipient,
      title,
      message,
      type,
      link,
    });
    return notification;
  } catch (error) {
    console.error('Failed to create in-app notification:', error.message);
    return null;
  }
};

module.exports = {
  createNotification,
};
