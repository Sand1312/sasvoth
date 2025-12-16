# Manual Testing Guide - Login Refactor

## Prerequisites

1. **Start the development server:**

   ```bash
   # From the root directory
   pnpm dev
   # OR specifically for web app
   turbo dev --filter=web
   ```

2. **Navigate to the login page:**
   - Open browser to: `http://localhost:3002/signin`

3. **Required setup:**
   - MetaMask browser extension installed (for wallet testing)
   - Valid test credentials for email/password login
   - Access to Google and GitHub accounts (for OAuth testing)

---

## Test Cases

### 1. Email/Password Login Tests

#### ✅ Test 1.1: Valid Credentials

- **Steps:**
  1. Enter valid username/email
  2. Enter valid password
  3. Click "Login" button
- **Expected:**
  - Loading state shows "Signing in..."
  - Redirects to `/dashboard` on success
  - No error messages displayed

#### ✅ Test 1.2: Invalid Credentials

- **Steps:**
  1. Enter valid format username/email
  2. Enter incorrect password
  3. Click "Login" button
- **Expected:**
  - Error message: "Invalid credentials" (or backend error message)
  - Form remains on page
  - User can retry

#### ✅ Test 1.3: Empty Fields

- **Steps:**
  1. Leave both fields empty
  2. Click "Login" button
- **Expected:**
  - Validation error: "Username or email is required"
  - Validation error: "Password is required"
  - Form does not submit to backend

#### ✅ Test 1.4: Short Identifier (< 3 chars)

- **Steps:**
  1. Enter 1-2 characters in username/email field
  2. Enter valid password
  3. Click "Login" button
- **Expected:**
  - Validation error: "Username or email must be at least 3 characters"
  - Form does not submit to backend

#### ✅ Test 1.5: Short Password (< 6 chars)

- **Steps:**
  1. Enter valid username/email
  2. Enter 1-5 characters in password field
  3. Click "Login" button
- **Expected:**
  - Validation error: "Password must be at least 6 characters"
  - Form does not submit to backend

---

### 2. OAuth Login Tests

#### ✅ Test 2.1: Google OAuth Flow

- **Steps:**
  1. Click the Google login button
  2. Complete Google OAuth flow
  3. Verify redirect back to application
- **Expected:**
  - Redirects to Google OAuth page
  - After authentication, redirects to `/dashboard`
  - User is logged in

#### ✅ Test 2.2: GitHub OAuth Flow

- **Steps:**
  1. Click the GitHub login button
  2. Complete GitHub OAuth flow
  3. Verify redirect back to application
- **Expected:**
  - Redirects to GitHub OAuth page
  - After authentication, redirects to `/dashboard`
  - User is logged in

---

### 3. MetaMask Wallet Login Tests

#### ✅ Test 3.1: Wallet Login WITH MetaMask Installed

- **Steps:**
  1. Ensure MetaMask extension is installed
  2. Click the MetaMask login button
  3. Approve account connection in MetaMask popup
  4. Sign the message in MetaMask popup
- **Expected:**
  - MetaMask popup appears for account connection
  - MetaMask popup appears for signature
  - After signing, MACI initialization occurs
  - Redirects to `/dashboard` (or `/admin/dashboard` for admin users)

#### ✅ Test 3.2: Wallet Login WITHOUT MetaMask Installed

- **Steps:**
  1. Disable or uninstall MetaMask extension
  2. Click the MetaMask login button
- **Expected:**
  - Error message: "MetaMask is not installed."
  - No popup appears
  - User remains on login page

#### ✅ Test 3.3: User Rejects Account Connection

- **Steps:**
  1. Click the MetaMask login button
  2. Reject the account connection in MetaMask popup
- **Expected:**
  - Error message: "Failed to connect wallet."
  - User remains on login page

#### ✅ Test 3.4: User Rejects Signature

- **Steps:**
  1. Click the MetaMask login button
  2. Approve account connection
  3. Reject the signature request
- **Expected:**
  - Error message: "Failed to sign message."
  - User remains on login page

---

### 4. MACI Initialization Tests

#### ✅ Test 4.1: New Wallet User (MACI Creation)

- **Steps:**
  1. Login with a wallet that has never been used before
  2. Check browser localStorage after successful login
  3. Verify backend user profile
- **Expected:**
  - MACI identity is created
  - localStorage contains:
    - `maci_stateIndex`
    - `maci_pubKeyX`
    - `maci_pubKeyY`
  - User profile has `stateIndex` saved

#### ✅ Test 4.2: Existing Wallet User (MACI Restoration)

- **Steps:**
  1. Login with a wallet that has been used before
  2. Check browser localStorage after successful login
- **Expected:**
  - MACI state is restored from backend
  - localStorage contains:
    - `maci_stateIndex` (from user data)
    - `maci_pubKeyX` (from user data)
    - `maci_pubKeyY` (from user data)

#### ✅ Test 4.3: MACI Setup Failure

- **Steps:**
  1. Simulate MACI setup failure (may require backend manipulation)
  2. Attempt wallet login
- **Expected:**
  - Error message: "Failed to setup MACI system."
  - Error is logged to console
  - User can retry

---

### 5. Error Message Display Tests

#### ✅ Test 5.1: Wallet Errors Display

- **Steps:**
  1. Trigger various wallet errors (no MetaMask, rejected connection, etc.)
- **Expected:**
  - Error appears below social login buttons
  - Error has `role="alert"` and `aria-live="polite"`
  - Error is red text, clearly visible

#### ✅ Test 5.2: Form Errors Display

- **Steps:**
  1. Trigger validation errors
  2. Trigger server errors
- **Expected:**
  - Validation errors appear below respective input fields
  - Server errors appear below the form
  - All errors have proper ARIA attributes

#### ✅ Test 5.3: Error Clearing

- **Steps:**
  1. Trigger an error
  2. Correct the issue and resubmit
- **Expected:**
  - Previous error is cleared
  - New error (if any) is displayed

---

### 6. Loading State Tests

#### ✅ Test 6.1: Email Login Loading State

- **Steps:**
  1. Enter valid credentials
  2. Click "Login" button
  3. Observe button during submission
- **Expected:**
  - Button text changes to "Signing in..."
  - Button is disabled
  - Form inputs are disabled

#### ✅ Test 6.2: Wallet Login Loading State

- **Steps:**
  1. Click MetaMask button
  2. Observe button during connection/signing
- **Expected:**
  - Button shows loading spinner
  - Button is disabled
  - `isSubmitting` state is true

---

### 7. UI/UX Tests

#### ✅ Test 7.1: Hover Tooltips on Social Buttons

- **Steps:**
  1. Hover over Google button
  2. Hover over GitHub button
  3. Hover over MetaMask button
- **Expected:**
  - Tooltip appears with "Login with Google"
  - Tooltip appears with "Login with GitHub"
  - Tooltip appears with "Login with MetaMask"
  - Tooltips disappear when not hovering

#### ✅ Test 7.2: Sign Up Link

- **Steps:**
  1. Click "Sign up" link
- **Expected:**
  - Navigates to `/signup` page

---

### 8. Accessibility Tests

#### ✅ Test 8.1: Keyboard Navigation

- **Steps:**
  1. Use Tab key to navigate through all interactive elements
  2. Use Enter/Space to activate buttons
  3. Verify focus indicators are visible
- **Expected:**
  - Can tab through: username input → password input → login button → Google button → GitHub button → MetaMask button → sign up link
  - Focus indicators are clearly visible
  - Enter key submits form when focused on inputs
  - Space/Enter activates buttons

#### ✅ Test 8.2: ARIA Labels Verification

- **Steps:**
  1. Inspect elements in browser DevTools
  2. Check for ARIA attributes
- **Expected:**
  - Username input has `aria-label="Username or email address"`
  - Password input has `aria-label="Password"`
  - Both inputs have `aria-required="true"`
  - Invalid inputs have `aria-invalid="true"`
  - Social buttons have `aria-label` with provider name
  - Social buttons group has `role="group"` with `aria-label`
  - Errors have `role="alert"` and `aria-live="polite"`

#### ✅ Test 8.3: Screen Reader Testing

- **Steps:**
  1. Enable screen reader (VoiceOver on Mac, NVDA/JAWS on Windows)
  2. Navigate through the login page
  3. Trigger validation errors
  4. Trigger server errors
- **Expected:**
  - All labels are announced correctly
  - Errors are announced when they appear
  - Button states (disabled, loading) are announced
  - Form structure is logical and understandable

---

## Performance Verification

#### ✅ Test 9.1: Component Re-rendering

- **Steps:**
  1. Open React DevTools
  2. Enable "Highlight updates when components render"
  3. Interact with one login method
- **Expected:**
  - Only affected components re-render
  - Social buttons don't re-render when form is typed in
  - Form doesn't re-render when hovering social buttons

---

## Console Verification

During all tests, monitor the browser console for:

- ✅ No unexpected errors
- ✅ Detailed error logging for debugging (when errors occur)
- ✅ No sensitive information (passwords) logged

---

## Test Results Checklist

Use this checklist to track your testing progress:

- [ ] 1.1 - Valid credentials login
- [ ] 1.2 - Invalid credentials error
- [ ] 1.3 - Empty fields validation
- [ ] 1.4 - Short identifier validation
- [ ] 1.5 - Short password validation
- [ ] 2.1 - Google OAuth flow
- [ ] 2.2 - GitHub OAuth flow
- [ ] 3.1 - MetaMask login (installed)
- [ ] 3.2 - MetaMask error (not installed)
- [ ] 3.3 - Account connection rejection
- [ ] 3.4 - Signature rejection
- [ ] 4.1 - MACI creation for new users
- [ ] 4.2 - MACI restoration for existing users
- [ ] 4.3 - MACI setup failure handling
- [ ] 5.1 - Wallet error display
- [ ] 5.2 - Form error display
- [ ] 5.3 - Error clearing
- [ ] 6.1 - Email login loading state
- [ ] 6.2 - Wallet login loading state
- [ ] 7.1 - Hover tooltips
- [ ] 7.2 - Sign up link
- [ ] 8.1 - Keyboard navigation
- [ ] 8.2 - ARIA labels
- [ ] 8.3 - Screen reader compatibility
- [ ] 9.1 - Component re-rendering optimization

---

## Notes

- Some tests may require backend configuration or test data
- MACI tests require the backend MACI service to be running
- OAuth tests require valid OAuth credentials configured in the backend
- For accessibility testing, use actual assistive technology tools

---

## Reporting Issues

If you find any issues during testing:

1. Note the test case number
2. Describe the expected vs actual behavior
3. Include any console errors
4. Take screenshots if relevant
5. Note your browser and OS version
