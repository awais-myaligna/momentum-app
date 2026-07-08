import { createApiError, ERROR_TYPES } from './apiError';

const DEFAULT_DELAY = 600;

/**
 * Simulates an Axios round-trip for mocked services so screens can be built
 * against realistic async/loading/error states before a real backend exists.
 * Pass `shouldFail`/`errorType` to exercise a specific error state.
 */
export const mockRequest = (data, { delay = DEFAULT_DELAY, shouldFail = false, errorType = ERROR_TYPES.SERVER } = {}) =>
  new Promise((resolve, reject) => {
    setTimeout(() => {
      if (shouldFail) {
        reject(createApiError(errorType));
      } else {
        resolve(data);
      }
    }, delay);
  });
