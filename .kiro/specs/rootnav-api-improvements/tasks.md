# Implementation Plan

- [x] 1. Add token refresh helper function to RootNav
  - Create `refreshToken` function that accepts cookieHeader and apiBase parameters
  - Implement POST request to `/api/v1/auth/refresh` endpoint
  - Return boolean indicating success or failure
  - Add error logging for debugging
  - _Requirements: 2.5, 3.1, 3.4_

- [x] 2. Update getCurrentUser function with v1 API path and refresh logic
  - [x] 2.1 Update API endpoint URL construction
    - Change endpoint from `/users/me` to `/api/v1/users/me`
    - Use URL constructor for proper path joining
    - Maintain existing environment variable priority
    - _Requirements: 1.1, 1.2, 1.3_
  - [x] 2.2 Implement token refresh on 401 response
    - Add response status check for 401 errors
    - Call refreshToken helper when 401 is detected
    - Implement retry logic after successful refresh
    - Add flag to prevent infinite retry loops
    - Include cookies in retry request
    - _Requirements: 2.1, 2.2, 2.4, 2.6_
  - [x] 2.3 Handle refresh failure scenarios
    - Return null when refresh fails
    - Return null when retry after refresh fails
    - Log appropriate error messages
    - _Requirements: 2.3, 3.1, 3.2_
  - [x] 2.4 Improve error handling and logging
    - Add specific error logging for different failure scenarios
    - Distinguish between network errors and authentication errors
    - Ensure graceful degradation on all error types
    - _Requirements: 3.1, 3.2, 3.3_

- [ ] 3. Manual testing verification
  - Test with valid authentication (user data should load)
  - Test with expired token (should refresh and load user data)
  - Test with invalid/missing token (should return null gracefully)
  - Verify no infinite loops occur on repeated 401 responses
  - Check that correct endpoints are called in browser network tab
  - _Requirements: All_
