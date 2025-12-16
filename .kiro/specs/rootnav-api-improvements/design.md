# Design Document

## Overview

This design improves the RootNav component's server-side user authentication by aligning it with the client-side API architecture. The solution adds proper API versioning (v1 prefix) and implements token refresh logic similar to the axios interceptor pattern used in the client-side API layer.

## Architecture

### Current Architecture

```
RootNav (Server Component)
  └─> getCurrentUser()
       └─> Direct fetch to /users/me
            └─> Returns user or null
```

### Proposed Architecture

```
RootNav (Server Component)
  └─> getCurrentUser()
       └─> Fetch to /api/v1/users/me
            ├─> Success: Return user
            └─> 401 Error: Attempt token refresh
                 ├─> Refresh success: Retry original request
                 └─> Refresh failure: Return null
```

## Components and Interfaces

### Modified Function: getCurrentUser

**Location:** `apps/web/app/RootNav.tsx`

**Signature:**

```typescript
async function getCurrentUser(): Promise<User>;
```

**Behavior:**

1. Construct API base URL from environment variables
2. Build full endpoint URL: `${apiBase}/api/v1/users/me`
3. Extract and format cookies from Next.js cookie store
4. Make initial fetch request with cookies
5. Handle response:
   - If 200 OK: Parse and return user data
   - If 401 Unauthorized: Attempt token refresh
   - Other errors: Log and return null

### New Helper Function: refreshToken

**Location:** `apps/web/app/RootNav.tsx`

**Signature:**

```typescript
async function refreshToken(
  cookieHeader: string,
  apiBase: string
): Promise<boolean>;
```

**Purpose:** Encapsulate token refresh logic to keep getCurrentUser clean

**Behavior:**

1. Construct refresh endpoint URL: `${apiBase}/api/v1/auth/refresh`
2. Make POST request with cookies
3. Return true if refresh succeeds (2xx status)
4. Return false if refresh fails
5. Log errors for debugging

### API Endpoint Changes

**Current Endpoint:** `/users/me`
**New Endpoint:** `/api/v1/users/me`

**Refresh Endpoint:** `/api/v1/auth/refresh` (already exists in backend)

## Data Models

### User Type (Unchanged)

```typescript
type User = {
  id?: string;
  email?: string;
  name?: string;
  [key: string]: unknown;
} | null;
```

### Cookie Header Format

```typescript
// Format: "cookie1=value1; cookie2=value2"
const cookieHeader = cookieStore
  .getAll()
  .map(({ name, value }) => `${name}=${value}`)
  .join("; ");
```

## Error Handling

### Error Scenarios

1. **Network Error**
   - Log error with context
   - Return null (graceful degradation)
   - User sees navigation without authentication

2. **401 Unauthorized (Initial Request)**
   - Attempt token refresh
   - If refresh succeeds: Retry original request
   - If refresh fails: Return null

3. **401 Unauthorized (After Refresh)**
   - Do not retry again (prevent infinite loop)
   - Return null
   - User will be redirected to signin by client-side logic

4. **Other HTTP Errors (4xx, 5xx)**
   - Log error
   - Return null
   - Graceful degradation

### Retry Logic

```typescript
let hasAttemptedRefresh = false;

if (res.status === 401 && !hasAttemptedRefresh) {
  hasAttemptedRefresh = true;
  const refreshSuccess = await refreshToken(cookieHeader, apiBase);

  if (refreshSuccess) {
    // Retry original request
    const retryRes = await fetch(userEndpoint, { ... });
    // Handle retry response
  }
}
```

## Implementation Details

### Environment Variable Priority

```typescript
const apiBase =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.API_URL ||
  "http://localhost:8000";
```

This maintains compatibility with existing configurations.

### URL Construction

```typescript
// User endpoint
const userEndpoint = new URL("/api/v1/users/me", apiBase).toString();

// Refresh endpoint
const refreshEndpoint = new URL("/api/v1/auth/refresh", apiBase).toString();
```

Using `URL` constructor ensures proper path joining regardless of trailing slashes.

### Cookie Handling

Cookies are extracted from Next.js cookie store and formatted as a standard Cookie header:

```typescript
const cookieStore = await cookies();
const cookieHeader = cookieStore
  .getAll()
  .map(({ name, value }) => `${name}=${value}`)
  .join("; ");
```

This header is included in all requests to maintain session state.

## Testing Strategy

### Unit Testing Approach

Since this is a server component with external dependencies (fetch, cookies), testing should focus on:

1. **Integration Testing**
   - Test with mock backend API
   - Verify correct endpoint URLs are called
   - Verify cookie headers are properly formatted

2. **Manual Testing**
   - Test with valid authentication
   - Test with expired token (should refresh)
   - Test with invalid token (should return null)
   - Test with no authentication (should return null)

### Test Scenarios

1. **Happy Path**
   - User is authenticated
   - Initial request succeeds
   - User data is returned

2. **Token Refresh Path**
   - User has expired token
   - Initial request returns 401
   - Refresh succeeds
   - Retry succeeds
   - User data is returned

3. **Failed Refresh Path**
   - User has invalid token
   - Initial request returns 401
   - Refresh fails
   - Null is returned

4. **No Authentication Path**
   - No cookies present
   - Request returns 401
   - Refresh fails (no valid session)
   - Null is returned

## Performance Considerations

### Caching Strategy

The current implementation uses `cache: "no-store"` to ensure fresh user data on each page load. This is appropriate for authentication state but could be optimized:

- Consider using Next.js `revalidate` for short-term caching (e.g., 30 seconds)
- Balance between fresh data and reduced API calls

### Request Overhead

- Token refresh adds one additional request in the 401 scenario
- This is acceptable as it only occurs when tokens expire
- Prevents unnecessary redirects to signin page

## Security Considerations

1. **Cookie Security**
   - Cookies should be HttpOnly and Secure in production
   - SameSite attribute should be set appropriately

2. **Error Messages**
   - Avoid exposing sensitive information in error logs
   - Log sufficient detail for debugging without revealing tokens

3. **Retry Limits**
   - Single retry prevents infinite loops
   - Protects against potential DoS scenarios

## Migration Path

This is a non-breaking change:

1. Update RootNav.tsx with new implementation
2. Deploy to staging for testing
3. Verify authentication flows work correctly
4. Deploy to production

No database migrations or API changes required.
