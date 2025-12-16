# Requirements Document

## Introduction

This document outlines the requirements for refactoring the login system from a monolithic 100+ line component into a modular, maintainable architecture. The current implementation mixes UI rendering, business logic, and wallet integration in a single component, making it difficult to test and maintain. The refactored system will follow single responsibility principles with clear separation of concerns.

## Glossary

- **LoginPage**: The main container component that orchestrates the login UI
- **LoginForm**: Component responsible for email/password authentication UI
- **SocialLoginButtons**: Component managing OAuth and wallet login providers
- **useLogin Hook**: Custom hook containing all login business logic
- **MACI**: Minimal Anti-Collusion Infrastructure - privacy-preserving voting protocol
- **MetaMask**: Browser extension for Ethereum wallet management
- **OAuth**: Open Authorization protocol for third-party authentication

## Requirements

### Requirement 1

**User Story:** As a developer, I want the login component split into focused sub-components, so that each component has a single responsibility and is easier to maintain

#### Acceptance Criteria

1. THE System SHALL provide a LoginPage component that acts as a container for layout composition
2. THE System SHALL provide a LoginForm component that handles email/password input and validation
3. THE System SHALL provide a SocialLoginButtons component that manages OAuth and wallet login options
4. THE System SHALL provide a SocialLoginButton component for individual provider buttons with hover tooltips
5. WHEN a component is modified, THEN only components with direct dependencies SHALL require changes

### Requirement 2

**User Story:** As a developer, I want all business logic extracted into a custom hook, so that logic can be tested independently and reused across components

#### Acceptance Criteria

1. THE System SHALL provide a useLogin hook that encapsulates all login business logic
2. THE useLogin hook SHALL manage wallet connection state and errors
3. THE useLogin hook SHALL manage form submission state and errors
4. THE useLogin hook SHALL provide handlers for wallet, email, and social login methods
5. THE useLogin hook SHALL handle MACI system initialization after successful authentication
6. THE System SHALL separate UI concerns from business logic concerns

### Requirement 3

**User Story:** As a user, I want to login with email and password, so that I can access the platform with traditional credentials

#### Acceptance Criteria

1. WHEN a user enters valid email/username and password, THE System SHALL authenticate the user
2. WHEN a user submits the form with empty fields, THE System SHALL display a validation error
3. WHEN a user enters an identifier shorter than 3 characters, THE System SHALL display a validation error
4. WHEN a user enters a password shorter than 6 characters, THE System SHALL display a validation error
5. WHEN authentication fails, THE System SHALL display the error message from the backend
6. WHILE the form is submitting, THE System SHALL disable the submit button and show loading state

### Requirement 4

**User Story:** As a user, I want to login with Google OAuth, so that I can use my existing Google account

#### Acceptance Criteria

1. WHEN a user clicks the Google login button, THE System SHALL redirect to Google OAuth flow
2. THE System SHALL display the Google icon and label on the button
3. WHEN hovering over the button, THE System SHALL show a tooltip with "Login with Google"
4. THE System SHALL provide proper ARIA labels for accessibility

### Requirement 5

**User Story:** As a user, I want to login with GitHub OAuth, so that I can use my existing GitHub account

#### Acceptance Criteria

1. WHEN a user clicks the GitHub login button, THE System SHALL redirect to GitHub OAuth flow
2. THE System SHALL display the GitHub icon and label on the button
3. WHEN hovering over the button, THE System SHALL show a tooltip with "Login with GitHub"
4. THE System SHALL provide proper ARIA labels for accessibility

### Requirement 6

**User Story:** As a user, I want to login with MetaMask wallet, so that I can authenticate using my Ethereum wallet

#### Acceptance Criteria

1. WHEN a user clicks the MetaMask button and MetaMask is not installed, THE System SHALL display an error message
2. WHEN a user clicks the MetaMask button and MetaMask is installed, THE System SHALL request account access
3. WHEN account access is granted, THE System SHALL request a signature for authentication
4. WHEN the signature is obtained, THE System SHALL authenticate with the backend
5. WHEN authentication succeeds, THE System SHALL initialize the MACI system
6. WHEN any step fails, THE System SHALL display an appropriate error message
7. WHILE the wallet connection is in progress, THE System SHALL show loading state

### Requirement 7

**User Story:** As a new user authenticating with wallet, I want the MACI system automatically initialized, so that I can participate in privacy-preserving voting

#### Acceptance Criteria

1. WHEN a new user authenticates with wallet, THE System SHALL create a MACI identity using their public keys
2. WHEN MACI signup succeeds, THE System SHALL store the state index in localStorage
3. WHEN MACI signup succeeds, THE System SHALL store the public keys in localStorage
4. WHEN MACI signup succeeds, THE System SHALL save the state index to the user profile
5. WHEN an existing user authenticates, THE System SHALL restore MACI state from user data
6. WHEN MACI initialization fails, THE System SHALL display an error message

### Requirement 8

**User Story:** As a developer, I want comprehensive error handling with categorized error messages, so that users receive clear feedback and issues can be diagnosed

#### Acceptance Criteria

1. THE System SHALL categorize errors into: network, validation, authentication, wallet, and unknown
2. WHEN a wallet is not installed, THE System SHALL display "MetaMask is not installed"
3. WHEN wallet connection fails, THE System SHALL display "Failed to connect wallet"
4. WHEN form fields are empty, THE System SHALL display "Username/email and password are required"
5. WHEN credentials are invalid, THE System SHALL display "Invalid credentials"
6. WHEN MACI setup fails, THE System SHALL display "Failed to setup MACI system"
7. THE System SHALL log detailed error information to the console for debugging

### Requirement 9

**User Story:** As a user with disabilities, I want the login interface to be accessible, so that I can authenticate regardless of my abilities

#### Acceptance Criteria

1. THE System SHALL provide ARIA labels for all interactive elements
2. THE System SHALL provide role attributes for form groups
3. THE System SHALL provide proper autocomplete attributes for form fields
4. THE System SHALL ensure keyboard navigation works for all interactive elements
5. THE System SHALL meet WCAG 2.1 AA accessibility standards

### Requirement 10

**User Story:** As a developer, I want the login components to be performance optimized, so that the user experience is smooth and responsive

#### Acceptance Criteria

1. THE System SHALL use React.memo for components that don't need frequent re-renders
2. THE System SHALL use useMemo for stable handler references
3. THE System SHALL prevent unnecessary re-renders through proper dependency management
4. WHEN a user interacts with one login method, THE System SHALL not re-render unrelated components
