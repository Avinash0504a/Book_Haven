const ERROR_MESSAGES = {
  VALIDATION_ERROR: 'Please check the highlighted fields and try again.',
  INVALID_CREDENTIALS: 'The email address or password you entered is incorrect.',
  DUPLICATE_EMAIL: 'An account with this email address already exists.',
  UNAUTHORIZED: 'Please log in to continue.',
  FORBIDDEN: 'You do not have permission to access this resource.',
  NOT_FOUND: 'The requested item was not found.',
  INSUFFICIENT_STOCK: 'One or more items in your cart do not have enough stock available.',
  INSUFFICIENT_POINTS: 'You do not have enough gift points for this redemption.',
  INSUFFICIENT_WALLET: 'Your wallet balance is insufficient for this transaction.',
  COD_NOT_AVAILABLE: 'Cash on Delivery is not available for this order.',
  CANNOT_CANCEL: 'This order cannot be cancelled.',
  DUPLICATE_REVIEW: 'You have already reviewed this book.',
  REFUND_CHANGED: 'The refund amount has changed. Please review the updated preview.',
  PAYMENT_DECLINED: 'Your payment was declined. Please try another payment method.',
  ORDER_EXPIRED: 'This order checkout session has expired. Please try again.',
  UNKNOWN_ERROR: 'An unexpected error occurred. Please try again.'
};

export function getErrorMessage(error) {
  if (!error) return ERROR_MESSAGES.UNKNOWN_ERROR;
  if (typeof error === 'string') return error;

  const code = error.code || error.response?.data?.code;
  if (code && ERROR_MESSAGES[code]) {
    return ERROR_MESSAGES[code];
  }

  const message = error.message || error.response?.data?.message;
  if (message && message !== 'Internal server error') {
    return message;
  }

  return ERROR_MESSAGES.UNKNOWN_ERROR;
}

export function getFieldErrors(error) {
  if (error?.fieldErrors && Array.isArray(error.fieldErrors)) {
    const map = {};
    for (const fe of error.fieldErrors) {
      if (fe.field) {
        map[fe.field] = fe.message || fe.reason;
      }
    }
    return map;
  }
  if (error?.response?.data?.data?.fieldErrors && Array.isArray(error.response.data.data.fieldErrors)) {
    const map = {};
    for (const fe of error.response.data.data.fieldErrors) {
      if (fe.field) {
        map[fe.field] = fe.message || fe.reason;
      }
    }
    return map;
  }
  return {};
}
