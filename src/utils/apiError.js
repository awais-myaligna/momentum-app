export const ERROR_TYPES = {
  OFFLINE: 'OFFLINE',
  TIMEOUT: 'TIMEOUT',
  SERVER: 'SERVER',
  UNAUTHORIZED: 'UNAUTHORIZED',
  UNKNOWN: 'UNKNOWN',
};

export const ERROR_MESSAGES = {
  [ERROR_TYPES.OFFLINE]: 'You appear to be offline. Check your connection and try again.',
  [ERROR_TYPES.TIMEOUT]: 'That took longer than expected. Please try again.',
  [ERROR_TYPES.SERVER]: 'Something went wrong on our end. Please try again shortly.',
  [ERROR_TYPES.UNAUTHORIZED]: 'Your session has expired. Please sign in again.',
  [ERROR_TYPES.UNKNOWN]: 'Something went wrong. Please try again.',
};

export const createApiError = (type, message, original) => ({
  type,
  message: message || ERROR_MESSAGES[type] || ERROR_MESSAGES[ERROR_TYPES.UNKNOWN],
  original,
});
