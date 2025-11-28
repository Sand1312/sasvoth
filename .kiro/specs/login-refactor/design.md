# Design Document

## Overview

This design refactors the monolithic login component into a modular architecture with clear separation of concerns. The solution extracts business logic into a custom hook, splits UI into focused components, and implements comprehensive error handling and accessibility features.

## Architecture

### Current Architecture

```
LoginPage (Monolithic - 200+ lines)
├── State management (wallet, form, errors)
├── Business logic (wallet connection, MACI setup)
├── Form rendering
├── Social button rendering
└── Error handling
```

### Proposed Architecture

```
LoginPage (Container Component)
├── useLogin (Business Logic Hook)
│   ├── Wallet connection logic
│   ├── MACI initialization
│   ├── Form submission logic
│   └── Error management
├── LoginForm (Email/Password Component)
│   ├── Form validation
│   ├── Input handling
│   └── Error display
└── SocialLoginButtons (OAuth/Wallet Component)
    ├── Provider configuration
    └── SocialLoginButton (Individual Button)
        ├── Hover tooltip
        ├── Loading state
        └── Accessibility attributes
```

## Components and Interfaces

### 1. LoginPage (Container Component)

**Location:** `apps/web/components/LoginPage.tsx`

**Type:** Client Component

**Responsibility:** Layout composition and component orchestration

**Interface:**

```typescript
interface LoginPageProps {} // No external props needed

export default function LoginPage(): JSX.Element;
```

**Structure:**

- Uses useLogin hook for all business logic
- Composes LoginForm and SocialLoginButtons
- Provides layout and styling
- No business logic or state management

### 2. LoginForm Component

**Location:** `apps/web/components/LoginForm.tsx`

**Type:** Client Component

**Responsibility:** Email/password form handling and validation

**Interface:**

```typescript
interface LoginFormProps {
  onSubmit: (identifier: string, password: string) => Promise<void>;
  isSubmitting: boolean;
  error: string | null;
}

export function LoginForm(props: LoginFormProps): JSX.Element;
```

**Validation Rules:**

```typescript
const FORM_VALIDATION = {
  identifier: {
    required: true,
    minLength: 3,
    maxLength: 255,
  },
  password: {
    required: true,
    minLength: 6,
    maxLength: 128,
  },
};
```

**Features:**

- Client-side validation before submission
- Displays both local validation errors and server errors
- Loading state on submit button
- Proper autocomplete attributes
- ARIA labels for accessibility

### 3. SocialLoginButtons Component

**Location:** `apps/web/components/SocialLoginButtons.tsx`

**Type:** Client Component

**Responsibility:** OAuth and wallet login providers

**Interface:**

```typescript
interface SocialLoginButtonsProps {
  onGoogleLogin: () => void;
  onGithubLogin: () => void;
  onWalletLogin: () => void;
  error: string | null;
}

export function SocialLoginButtons(props: SocialLoginButtonsProps): JSX.Element;
```

**Provider Configuration:**

```typescript
const PROVIDERS = {
  google: {
    name: "Google",
    icon: GoogleIcon,
    label: "Login with Google",
    testId: "google-login-btn",
  },
  github: {
    name: "GitHub",
    icon: GitHubIcon,
    label: "Login with GitHub",
    testId: "github-login-btn",
  },
  wallet: {
    name: "MetaMask",
    icon: MetaMaskIcon,
    label: "Login with MetaMask",
    testId: "wallet-login-btn",
  },
} as const;
```

### 4. SocialLoginButton Component

**Location:** `apps/web/components/SocialLoginButton.tsx`

**Type:** Client Component

**Responsibility:** Individual social login button with hover tooltip

**Interface:**

```typescript
interface SocialLoginButtonProps {
  provider: "google" | "github" | "wallet";
  onClick: () => void;
  label: string;
  icon: React.ReactNode;
  testId: string;
}

export const SocialLoginButton = React.memo(
  (props: SocialLoginButtonProps): JSX.Element => {
    // Implementation
  }
);
```

**Features:**

- Hover tooltip showing provider name
- Loading state during authentication
- Disabled state to prevent double-clicks
- ARIA labels for accessibility
- Memoized for performance

### 5. useLogin Hook

**Location:** `apps/web/hooks/useLogin.ts`

**Type:** Custom Hook

**Responsibility:** Centralized login business logic

**Interface:**

```typescript
interface UseLoginReturn {
  // State
  walletError: string | null;
  formError: string | null;
  isSubmitting: boolean;

  // Handlers
  handleWalletLogin: () => Promise<void>;
  handleEmailLogin: (identifier: string, password: string) => Promise<void>;
  handleSocialLogin: (provider: string) => void;

  // Utilities
  clearErrors: () => void;
  reset: () => void;
}

export function useLogin(): UseLoginReturn;
```

**Error Messages Configuration:**

```typescript
const ERROR_MESSAGES = {
  WALLET: {
    NOT_INSTALLED: "MetaMask is not installed.",
    CONNECTION_FAILED: "Failed to connect wallet.",
    SIGNATURE_FAILED: "Failed to sign message.",
    NETWORK_ERROR: "Network error occurred.",
  },
  FORM: {
    REQUIRED_FIELDS: "Username/email and password are required.",
    INVALID_CREDENTIALS: "Invalid credentials.",
    NETWORK_ERROR: "Network error occurred.",
  },
  MACI: {
    SETUP_FAILED: "Failed to setup MACI system.",
  },
} as const;
```

## Data Models

### User Authentication Data

```typescript
interface WalletAuthData {
  address: string;
  signature: string;
  message: string;
}

interface EmailAuthData {
  username: string;
  email: string;
  password: string;
}

interface AuthResponse {
  user: {
    walletAddress?: string;
    privateKey?: string;
    publicKeyX: string;
    publicKeyY: string;
    stateIndex?: number;
  };
}
```

### MACI State

```typescript
interface MaciState {
  stateIndex: number;
  publicKeyX: string;
  publicKeyY: string;
}

interface MaciSignupResult {
  stateIndex: number;
}
```

## Error Handling

### Error Categories

```typescript
const ERROR_CATEGORIES = {
  NETWORK: "network",
  VALIDATION: "validation",
  AUTHENTICATION: "authentication",
  WALLET: "wallet",
  UNKNOWN: "unknown",
} as const;

interface AppError {
  category: keyof typeof ERROR_CATEGORIES;
  message: string;
  code?: string;
  originalError?: any;
}
```

### Error Flow

1. **Wallet Errors**
   - Check MetaMask installation
   - Handle connection rejection
   - Handle signature rejection
   - Display user-friendly messages

2. **Form Errors**
   - Validate on client before submission
   - Display server validation errors
   - Clear errors on new submission

3. **Network Errors**
   - Catch fetch failures
   - Display generic network error
   - Log details for debugging

4. **MACI Errors**
   - Catch initialization failures
   - Allow user to continue (non-blocking)
   - Log for support investigation

## Business Logic Flow

### Wallet Login Flow

```
1. User clicks MetaMask button
2. Check if MetaMask is installed
   ├─ Not installed → Show error
   └─ Installed → Continue
3. Request account access
   ├─ Rejected → Show error
   └─ Granted → Continue
4. Request signature
   ├─ Rejected → Show error
   └─ Signed → Continue
5. Authenticate with backend
   ├─ Failed → Show error
   └─ Success → Continue
6. Initialize MACI
   ├─ New user → Create MACI identity
   │   ├─ Store in localStorage
   │   └─ Save to user profile
   └─ Existing user → Restore from data
       └─ Store in localStorage
7. Redirect to dashboard
```

### Email Login Flow

```
1. User enters credentials
2. Validate on client
   ├─ Invalid → Show validation error
   └─ Valid → Continue
3. Submit to backend
   ├─ Failed → Show server error
   └─ Success → Redirect to dashboard
```

### Social Login Flow

```
1. User clicks provider button
2. Redirect to OAuth provider
3. Provider handles authentication
4. Redirect back with token
5. Backend validates token
6. Redirect to dashboard
```

### MACI Initialization Logic

```typescript
async function handleMaciSetup(user: AuthResponse["user"]): Promise<void> {
  try {
    if (user.privateKey) {
      // New user - create MACI identity
      const maciResult = await signupToMaci(user.publicKeyX, user.publicKeyY);

      if (maciResult.stateIndex) {
        // Store in localStorage
        localStorage.setItem(
          "maci_stateIndex",
          maciResult.stateIndex.toString()
        );
        localStorage.setItem("maci_pubKeyX", user.publicKeyX.toString());
        localStorage.setItem("maci_pubKeyY", user.publicKeyY.toString());

        // Save to user profile
        await saveStateIndex(user.walletAddress!, maciResult.stateIndex);
      }
    } else {
      // Existing user - restore from data
      localStorage.setItem("maci_stateIndex", user.stateIndex!.toString());
      localStorage.setItem("maci_pubKeyX", user.publicKeyX.toString());
      localStorage.setItem("maci_pubKeyY", user.publicKeyY.toString());
    }
  } catch (error) {
    console.error("MACI setup error:", error);
    throw new Error(ERROR_MESSAGES.MACI.SETUP_FAILED);
  }
}
```

## Performance Optimization

### Memoization Strategy

```typescript
// Hook memoization
export function useLogin(): UseLoginReturn {
  const handlers = useMemo(
    () => ({
      wallet: handleWalletLogin,
      email: handleEmailLogin,
      social: handleSocialLogin,
    }),
    [
      /* stable dependencies */
    ]
  );

  return useMemo(
    () => ({
      ...state,
      ...handlers,
      clearErrors,
      reset,
    }),
    [state, handlers]
  );
}

// Component memoization
export const SocialLoginButton = React.memo(
  (props: SocialLoginButtonProps) => {
    // Component implementation
  },
  (prevProps, nextProps) => {
    // Custom comparison for optimal re-rendering
    return (
      prevProps.provider === nextProps.provider &&
      prevProps.label === nextProps.label
    );
  }
);
```

### Loading States

- **Wallet Login**: Disable button, show spinner during connection/signing
- **Email Login**: Disable submit button, show "Signing in..." text
- **Social Login**: Immediate redirect, no loading state needed

## Accessibility

### ARIA Labels

```typescript
const ACCESSIBILITY = {
  google: { ariaLabel: "Login with Google account" },
  github: { ariaLabel: "Login with GitHub account" },
  wallet: { ariaLabel: "Login with MetaMask wallet" },
};
```

### Form Attributes

```typescript
<Input
  type="text"
  autoComplete="username"
  aria-label="Username or email address"
  aria-required="true"
  aria-invalid={!!error}
/>

<Input
  type="password"
  autoComplete="current-password"
  aria-label="Password"
  aria-required="true"
  aria-invalid={!!error}
/>
```

### Error Announcements

```typescript
{error && (
  <p role="alert" aria-live="polite" className="text-sm text-red-600">
    {error}
  </p>
)}
```

## Testing Strategy

### Unit Tests

1. **useLogin Hook**
   - Test state management
   - Test error handling
   - Test MACI initialization logic
   - Mock external dependencies (wallet, API)

2. **LoginForm**
   - Test validation logic
   - Test form submission
   - Test error display
   - Test loading states

3. **SocialLoginButtons**
   - Test button rendering
   - Test click handlers
   - Test error display

### Integration Tests

1. **Wallet Connection Flow**
   - Mock MetaMask
   - Test full authentication flow
   - Test MACI initialization

2. **Email Login Flow**
   - Mock API responses
   - Test validation and submission
   - Test error scenarios

3. **Social Login Flow**
   - Test redirect behavior
   - Mock OAuth responses

### E2E Tests

1. Complete login flows for each method
2. Error state recovery
3. Navigation after successful login
4. Accessibility compliance

## Migration Path

1. Create new components in `apps/web/components/`
2. Create useLogin hook in `apps/web/hooks/`
3. Update signin page to use new components
4. Test all login methods
5. Remove old monolithic code
6. Update any dependent components

No breaking changes to external APIs or user experience.

## Security Considerations

1. **Password Handling**
   - Never log passwords
   - Use HTTPS for transmission
   - Proper autocomplete attributes

2. **Wallet Signatures**
   - Verify signature on backend
   - Use nonce to prevent replay attacks
   - Clear sensitive data after use

3. **Error Messages**
   - Don't expose system internals
   - Log detailed errors server-side only
   - Show user-friendly messages

4. **localStorage**
   - Store only non-sensitive MACI state
   - Clear on logout
   - Validate before use
