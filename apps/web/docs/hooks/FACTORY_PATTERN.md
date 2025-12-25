# Hook Factory Pattern

This document explains the factory pattern used for creating React hooks in this application.

## Overview

The factory pattern provides reusable utilities for creating consistent, maintainable hooks. It eliminates boilerplate code and ensures hooks follow the same patterns across the codebase.

## Factory Functions

### 1. `createDataHook` - TanStack Query Data Fetching

Creates hooks for data fetching using TanStack Query (React Query).

**Use Case:** When you need to fetch data with caching, automatic refetching, and loading states.

**Example:**

```typescript
import { createDataHook } from "./factory";
import { pollsApi } from "../api";

// Create a hook for fetching polls
export const usePollsQuery = createDataHook(
  (status?: PollStatus) => ["polls", status || "all"], // Query key factory
  (status?: PollStatus) => pollsApi.getPolls(status), // Fetcher function
  { staleTime: 1000 * 60 * 5 } // Optional: 5 minutes cache
);

// Usage in component
function MyComponent() {
  const { data, isLoading, error } = usePollsQuery("active");
  // ...
}
```

**Benefits:**

- Automatic caching and refetching
- Loading and error states
- Optimistic updates support
- Query invalidation

---

### 2. `createMutationHook` - TanStack Query Mutations

Creates hooks for data mutations (create, update, delete operations).

**Use Case:** When you need to modify data with loading states and callbacks.

**Example:**

```typescript
import { createMutationHook } from "./factory";
import { pollsApi } from "../api";

// Create a mutation hook
export const useCreatePoll = createMutationHook(
  (data: CreatePollData) => pollsApi.createPoll(data),
  {
    onSuccess: () => {
      console.log("Poll created successfully!");
    },
    onError: (error) => {
      console.error("Failed to create poll:", error);
    },
  }
);

// Usage in component
function MyComponent() {
  const { mutate, isPending } = useCreatePoll();

  const handleSubmit = (data: CreatePollData) => {
    mutate(data);
  };
  // ...
}
```

**Benefits:**

- Loading states during mutation
- Success/error callbacks
- Automatic query invalidation
- Optimistic updates

---

### 3. `createApiHook` - Simple API Wrapper

Creates hooks that wrap API methods with optional redirect utilities.

**Use Case:** When you have simple API methods that don't need caching or complex state management.

**Example:**

```typescript
import { createApiHook } from "./factory";
import { ideasApi } from "../api";

// Without redirect
export const useUser = createApiHook({
  getUserByWallet: userApi.getUserByWallet,
  saveStateIndex: userApi.saveStateIndex,
  deposit: userApi.deposit,
});

// With redirect utilities
export const useIdeas = createApiHook(
  {
    createIdea: ideasApi.createIdea,
    getIdeaById: ideasApi.getIdeaById,
    updateIdea: ideasApi.updateIdea,
  },
  { includeRedirect: true } // Adds goTo and replaceTo
);

// Usage in component
function MyComponent() {
  const { createIdea, goTo } = useIdeas();

  const handleCreate = async (data) => {
    await createIdea(data);
    goTo("/ideas");
  };
  // ...
}
```

**Benefits:**

- Clean API method wrapping
- Optional navigation utilities
- No boilerplate code
- Type-safe

---

### 4. `createAsyncHook` - Error-Handled Async Methods

Creates hooks with automatic error handling and logging for async methods.

**Use Case:** When you want consistent error handling across multiple async operations.

**Example:**

```typescript
import { createAsyncHook } from "./factory";
import { rewardsApi } from "../api";

export const useRewards = createAsyncHook(
  {
    getReward: async (userId: string, pollId: string) => {
      return await rewardsApi.getReward({ userId, pollId });
    },
    saveReward: async (
      userId: string,
      pollId: string,
      credit_count: number
    ) => {
      return await rewardsApi.saveReward({ userId, pollId, credit_count });
    },
  },
  "Rewards" // Hook name for error logging
);

// Usage in component
function MyComponent() {
  const { getReward, saveReward } = useRewards();

  // Errors are automatically logged as "Rewards - getReward error: ..."
  const reward = await getReward(userId, pollId);
  // ...
}
```

**Benefits:**

- Automatic error logging with context
- Consistent error handling
- Try-catch wrapping
- Cleaner component code

---

## Migration Examples

### Before (Manual Hook)

```typescript
import { useRedirect } from "./useRedirect";
import { ideasApi } from "../api";

export function useIdeas() {
  const { goTo, replaceTo } = useRedirect();

  const createIdea = ideasApi.createIdea;
  const getIdeaById = ideasApi.getIdeaById;
  const updateIdea = ideasApi.updateIdea;

  return {
    createIdea,
    getIdeaById,
    updateIdea,
    goTo,
    replaceTo,
  };
}
```

### After (Factory Pattern)

```typescript
import { ideasApi } from "../api";
import { createApiHook } from "./factory";

export const useIdeas = createApiHook(
  {
    createIdea: ideasApi.createIdea,
    getIdeaById: ideasApi.getIdeaById,
    updateIdea: ideasApi.updateIdea,
  },
  { includeRedirect: true }
);
```

**Result:** 50% less code, same functionality!

---

### 5. `createEnhancedApiHook` - API Hook with Error Boundary & Loading

Creates hooks with automatic error handling, loading states, and optional redirect.

**Use Case:** When you want comprehensive error handling and loading state management built-in.

**Example:**

```typescript
import { createEnhancedApiHook } from "./factory";
import { ideasApi } from "../api";

export const useIdeas = createEnhancedApiHook(
  {
    createIdea: ideasApi.createIdea,
    getIdeaById: ideasApi.getIdeaById,
    updateIdea: ideasApi.updateIdea,
  },
  {
    includeRedirect: true,
    hookName: 'Ideas'
  }
);

// Usage in component
function MyComponent() {
  const { createIdea, isLoading, error, resetError, goTo } = useIdeas();

  const handleCreate = async (data) => {
    try {
      await createIdea(data);
      goTo('/ideas');
    } catch (err) {
      // Error is automatically caught and stored
    }
  };

  return (
    <div>
      {error && <InlineError error={error} onDismiss={resetError} />}
      {isLoading && <LoadingSpinner message="Creating idea..." />}
      <button onClick={handleCreate} disabled={isLoading}>
        Create
      </button>
    </div>
  );
}
```

**Benefits:**

- Automatic error state management
- Built-in loading states
- Error reset functionality
- Action name tracking
- Optional navigation utilities

---

### 6. `useErrorBoundary` - Error State Management

Hook for managing error states with reset capability.

**Example:**

```typescript
import { useErrorBoundary } from "./factory";

function MyComponent() {
  const { error, hasError, resetError, catchError } = useErrorBoundary();

  const handleAction = async () => {
    try {
      await riskyOperation();
    } catch (err) {
      catchError(err);
    }
  };

  if (hasError) {
    return <ErrorDisplay error={error} onReset={resetError} />;
  }

  return <div>...</div>;
}
```

---

### 7. `useLoadingState` - Loading State Management

Hook for tracking loading states across multiple actions.

**Example:**

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

  return (
    <div>
      {isLoading && <p>Loading: {loadingAction}</p>}
      <button onClick={handleFetch} disabled={isLoading}>
        Fetch
      </button>
    </div>
  );
}
```

---

### 8. `useActionWrapper` - Combined Error & Loading

Hook that combines error handling and loading state for actions.

**Example:**

```typescript
import { useActionWrapper } from "./factory";

function MyComponent() {
  const { execute, isLoading, error, data, reset } = useActionWrapper();

  const handleSubmit = async (formData) => {
    await execute('submitForm', async () => {
      return await api.submit(formData);
    });
  };

  return (
    <div>
      {error && <InlineError error={error} onDismiss={reset} />}
      {isLoading && <LoadingSpinner />}
      {data && <SuccessMessage data={data} />}
      <button onClick={handleSubmit} disabled={isLoading}>
        Submit
      </button>
    </div>
  );
}
```

---

## Error Boundary Component

React Error Boundary for catching component errors:

```typescript
import { ErrorBoundary } from "@/components/ErrorBoundary";

function App() {
  return (
    <ErrorBoundary
      fallback={(error, reset) => (
        <div>
          <h1>Error: {error.message}</h1>
          <button onClick={reset}>Try again</button>
        </div>
      )}
      onError={(error, errorInfo) => {
        // Log to error tracking service
        console.error(error, errorInfo);
      }}
    >
      <YourApp />
    </ErrorBoundary>
  );
}
```

---

## UI Components

### InlineError

Display errors inline with dismiss functionality:

```typescript
import { InlineError } from "@/components/ErrorBoundary";

{error && <InlineError error={error} onDismiss={resetError} />}
```

### LoadingSpinner

Display loading states:

```typescript
import { LoadingSpinner } from "@/components/ErrorBoundary";

{isLoading && <LoadingSpinner size="lg" message="Loading data..." />}
```

---

## Choosing the Right Factory

| Factory              | Use When            | Features                                |
| -------------------- | ------------------- | --------------------------------------- |
| `createDataHook`     | Fetching data       | Caching, auto-refetch, loading states   |
| `createMutationHook` | Modifying data      | Loading states, callbacks, invalidation |
| `createApiHook`      | Simple API calls    | Clean wrapping, optional redirect       |
| `createAsyncHook`    | Need error handling | Auto error logging, try-catch           |

---

## Best Practices

1. **Use TanStack Query for data fetching** - It provides caching and automatic refetching
2. **Use `createApiHook` for simple wrappers** - When you don't need caching
3. **Use `createAsyncHook` for complex logic** - When you need consistent error handling
4. **Keep hooks focused** - One hook per domain (polls, ideas, users, etc.)
5. **Export as const** - Factory functions return hooks, so export them as constants

---

## Refactored Hooks

The following hooks have been refactored to use the factory pattern:

- ✅ `useIdeas` - Uses `createApiHook` with redirect
- ✅ `useIPFS` - Uses `createApiHook` with redirect
- ✅ `useUser` - Uses `createApiHook`
- ✅ `useVote` - Uses `createApiHook`
- ✅ `useRewards` - Uses `createAsyncHook`
- ✅ `useResults` - Uses `createAsyncHook`
- ✅ `useJoinPoll` - Uses `createApiHook`
- ✅ `usePolls` - Uses `createDataHook` for queries (partial)

---

## Future Improvements

1. Add mutation factories for common CRUD operations
2. Create factory for hooks with local state management
3. Add factory for hooks with WebSocket connections
4. Create factory for hooks with optimistic updates

---

## Questions?

If you have questions about which factory to use or how to refactor a hook, refer to the examples above or check the existing refactored hooks in the codebase.
