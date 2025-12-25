# Enhanced Factory Features

## Overview

The factory pattern now includes advanced features for error handling, loading states, and action wrapping.

## New Features

### 1. Error Boundary Hook (`useErrorBoundary`)

Manages error states with reset capability.

```typescript
import { useErrorBoundary } from "./factory";

function MyComponent() {
  const { error, hasError, resetError, catchError } = useErrorBoundary();

  const handleAction = async () => {
    try {
      await riskyOperation();
    } catch (err) {
      catchError(err); // Automatically captures and stores error
    }
  };

  if (hasError) {
    return (
      <div>
        <p>Error: {error?.message}</p>
        <button onClick={resetError}>Try Again</button>
      </div>
    );
  }

  return <button onClick={handleAction}>Do Action</button>;
}
```

**API:**

- `error: Error | null` - Current error state
- `hasError: boolean` - Whether an error exists
- `resetError: () => void` - Clear the error
- `catchError: (error: unknown) => void` - Capture an error

---

### 2. Loading State Hook (`useLoadingState`)

Tracks loading states across multiple actions.

```typescript
import { useLoadingState } from "./factory";

function MyComponent() {
  const { isLoading, loadingAction, startLoading, stopLoading } = useLoadingState();

  const handleFetch = async () => {
    startLoading('fetchData');
    try {
      await fetchData();
    } finally {
      stopLoading();
    }
  };

  const handleSave = async () => {
    startLoading('saveData');
    try {
      await saveData();
    } finally {
      stopLoading();
    }
  };

  return (
    <div>
      {isLoading && <p>Loading: {loadingAction}</p>}
      <button onClick={handleFetch} disabled={isLoading}>Fetch</button>
      <button onClick={handleSave} disabled={isLoading}>Save</button>
    </div>
  );
}
```

**API:**

- `isLoading: boolean` - Whether any action is loading
- `loadingAction: string | null` - Name of current loading action
- `startLoading: (action: string) => void` - Start loading state
- `stopLoading: () => void` - Stop loading state

---

### 3. Action Wrapper Hook (`useActionWrapper`)

Combines error handling and loading state for async actions.

```typescript
import { useActionWrapper } from "./factory";

function MyComponent() {
  const { execute, isLoading, error, data, reset } = useActionWrapper<User>();

  const handleSubmit = async (formData: FormData) => {
    await execute('submitForm', async () => {
      return await api.submit(formData);
    });
  };

  return (
    <div>
      {error && (
        <div className="error">
          {error.message}
          <button onClick={reset}>Dismiss</button>
        </div>
      )}

      {isLoading && <LoadingSpinner />}

      {data && <SuccessMessage user={data} />}

      <button onClick={handleSubmit} disabled={isLoading}>
        Submit
      </button>
    </div>
  );
}
```

**API:**

- `execute: (actionName: string, action: () => Promise<T>) => Promise<T>` - Execute action
- `isLoading: boolean` - Loading state
- `error: Error | null` - Error state
- `data: T | null` - Result data
- `loadingAction: string | null` - Current action name
- `reset: () => void` - Reset all states

---

### 4. Enhanced API Hook (`createEnhancedApiHook`)

Creates hooks with built-in error handling and loading states.

```typescript
import { createEnhancedApiHook } from "./factory";
import { ideasApi } from "../api";

export const useIdeas = createEnhancedApiHook(
  {
    createIdea: ideasApi.createIdea,
    getIdeaById: ideasApi.getIdeaById,
    updateIdea: ideasApi.updateIdea,
    deleteIdea: ideasApi.deleteIdea,
  },
  {
    includeRedirect: true,
    hookName: 'Ideas' // For error logging
  }
);

// Usage in component
function IdeaForm() {
  const {
    createIdea,
    isLoading,
    error,
    resetError,
    loadingAction,
    goTo
  } = useIdeas();

  const handleSubmit = async (data: IdeaData) => {
    try {
      await createIdea(data);
      goTo('/ideas');
    } catch (err) {
      // Error is automatically caught and stored in `error`
    }
  };

  return (
    <div>
      {error && <InlineError error={error} onDismiss={resetError} />}

      {isLoading && (
        <LoadingSpinner message={`Loading: ${loadingAction}`} />
      )}

      <form onSubmit={handleSubmit}>
        {/* form fields */}
        <button type="submit" disabled={isLoading}>
          Create Idea
        </button>
      </form>
    </div>
  );
}
```

**Features:**

- All API methods wrapped with error handling
- Automatic loading state management
- Action name tracking (e.g., "Ideas.createIdea")
- Error reset functionality
- Optional redirect utilities

---

## React Error Boundary Component

Class component for catching React rendering errors.

```typescript
import { ErrorBoundary } from "@/components/ErrorBoundary";

function App() {
  return (
    <ErrorBoundary
      fallback={(error, reset) => (
        <div className="error-container">
          <h1>Something went wrong</h1>
          <p>{error.message}</p>
          <button onClick={reset}>Try again</button>
        </div>
      )}
      onError={(error, errorInfo) => {
        // Send to error tracking service
        logErrorToService(error, errorInfo);
      }}
    >
      <YourApp />
    </ErrorBoundary>
  );
}
```

**Props:**

- `children: ReactNode` - Components to wrap
- `fallback?: (error: Error, resetError: () => void) => ReactNode` - Custom error UI
- `onError?: (error: Error, errorInfo: React.ErrorInfo) => void` - Error callback

---

## UI Components

### InlineError

Display errors inline with optional dismiss button.

```typescript
import { InlineError } from "@/components/ErrorBoundary";

function MyComponent() {
  const [error, setError] = useState<Error | null>(null);

  return (
    <div>
      {error && (
        <InlineError
          error={error}
          onDismiss={() => setError(null)}
        />
      )}
      {/* rest of component */}
    </div>
  );
}
```

**Props:**

- `error: Error | string` - Error to display
- `onDismiss?: () => void` - Optional dismiss callback

---

### LoadingSpinner

Display loading states with optional message.

```typescript
import { LoadingSpinner } from "@/components/ErrorBoundary";

function MyComponent() {
  const { isLoading } = useActionWrapper();

  return (
    <div>
      {isLoading && (
        <LoadingSpinner
          size="lg"
          message="Loading data..."
        />
      )}
      {/* rest of component */}
    </div>
  );
}
```

**Props:**

- `size?: "sm" | "md" | "lg"` - Spinner size (default: "md")
- `message?: string` - Optional loading message

---

## Complete Example

Here's a complete example using all features:

```typescript
// hooks/useIdeas.ts
import { createEnhancedApiHook } from "./factory";
import { ideasApi } from "../api";

export const useIdeas = createEnhancedApiHook(
  {
    createIdea: ideasApi.createIdea,
    getIdeaById: ideasApi.getIdeaById,
    updateIdea: ideasApi.updateIdea,
    deleteIdea: ideasApi.deleteIdea,
  },
  {
    includeRedirect: true,
    hookName: 'Ideas'
  }
);

// components/IdeaPage.tsx
import { ErrorBoundary, InlineError, LoadingSpinner } from "@/components/ErrorBoundary";
import { useIdeas } from "@/hooks/useIdeas";

function IdeaPageContent() {
  const {
    createIdea,
    deleteIdea,
    isLoading,
    error,
    resetError,
    loadingAction,
    goTo
  } = useIdeas();

  const handleCreate = async (data: IdeaData) => {
    try {
      await createIdea(data);
      goTo('/ideas');
    } catch (err) {
      // Error automatically caught
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteIdea(id);
      goTo('/ideas');
    } catch (err) {
      // Error automatically caught
    }
  };

  return (
    <div className="container">
      {/* Error display */}
      {error && (
        <InlineError
          error={error}
          onDismiss={resetError}
        />
      )}

      {/* Loading display */}
      {isLoading && (
        <LoadingSpinner
          size="lg"
          message={`Processing: ${loadingAction}`}
        />
      )}

      {/* Content */}
      <div>
        <button
          onClick={() => handleCreate(formData)}
          disabled={isLoading}
        >
          Create Idea
        </button>

        <button
          onClick={() => handleDelete(ideaId)}
          disabled={isLoading}
        >
          Delete Idea
        </button>
      </div>
    </div>
  );
}

// Wrap with Error Boundary
export default function IdeaPage() {
  return (
    <ErrorBoundary>
      <IdeaPageContent />
    </ErrorBoundary>
  );
}
```

---

## Migration Guide

### Before: Manual Error & Loading Handling

```typescript
function MyComponent() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const handleAction = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await api.doSomething();
    } catch (err) {
      setError(err as Error);
      console.error('Action failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      {error && <div>{error.message}</div>}
      {isLoading && <div>Loading...</div>}
      <button onClick={handleAction} disabled={isLoading}>
        Do Action
      </button>
    </div>
  );
}
```

### After: Using Action Wrapper

```typescript
function MyComponent() {
  const { execute, isLoading, error, reset } = useActionWrapper();

  const handleAction = async () => {
    await execute('doSomething', () => api.doSomething());
  };

  return (
    <div>
      {error && <InlineError error={error} onDismiss={reset} />}
      {isLoading && <LoadingSpinner />}
      <button onClick={handleAction} disabled={isLoading}>
        Do Action
      </button>
    </div>
  );
}
```

**Result:** Cleaner code, automatic error logging, consistent UI!

---

## Best Practices

1. **Use Error Boundary at App Level**
   - Wrap your entire app or major sections
   - Provides fallback for unexpected errors

2. **Use Enhanced API Hook for API Calls**
   - Automatic error handling
   - Built-in loading states
   - Consistent error logging

3. **Use Action Wrapper for Complex Actions**
   - Multiple steps
   - Need to track which action is running
   - Want automatic error capture

4. **Use Inline Components for Consistency**
   - `InlineError` for error display
   - `LoadingSpinner` for loading states
   - Consistent UI across app

5. **Always Provide Reset/Dismiss**
   - Let users clear errors
   - Improves UX
   - Allows retry

---

## Feature Comparison

| Feature         | Manual    | useActionWrapper | createEnhancedApiHook |
| --------------- | --------- | ---------------- | --------------------- |
| Error Handling  | ❌ Manual | ✅ Automatic     | ✅ Automatic          |
| Loading State   | ❌ Manual | ✅ Automatic     | ✅ Automatic          |
| Action Tracking | ❌ No     | ✅ Yes           | ✅ Yes                |
| Error Logging   | ❌ Manual | ✅ Automatic     | ✅ Automatic          |
| Reset Function  | ❌ Manual | ✅ Built-in      | ✅ Built-in           |
| Redirect Utils  | ❌ Manual | ❌ No            | ✅ Optional           |
| Code Lines      | ~20       | ~5               | ~3                    |

---

## Conclusion

The enhanced factory features provide:

- ✅ Automatic error handling
- ✅ Built-in loading states
- ✅ Action tracking
- ✅ Consistent error logging
- ✅ Reusable UI components
- ✅ Better developer experience
- ✅ Cleaner component code
