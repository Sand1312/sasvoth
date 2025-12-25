# Factory Pattern Quick Reference

## Import Statements

```typescript
// Factory functions
import {
  createDataHook,
  createMutationHook,
  createApiHook,
  createAsyncHook,
  createEnhancedApiHook,
  useErrorBoundary,
  useLoadingState,
  useActionWrapper,
} from "@/hooks/factory";

// UI Components
import {
  ErrorBoundary,
  InlineError,
  LoadingSpinner,
  DefaultErrorFallback,
} from "@/components/ErrorBoundary";
```

## Quick Examples

### 1. Simple API Hook

```typescript
export const useIdeas = createApiHook(
  {
    createIdea: ideasApi.createIdea,
    getIdeaById: ideasApi.getIdeaById,
  },
  { includeRedirect: true }
);
```

### 2. Enhanced API Hook (Recommended)

```typescript
export const useIdeas = createEnhancedApiHook(
  {
    createIdea: ideasApi.createIdea,
    getIdeaById: ideasApi.getIdeaById,
  },
  {
    includeRedirect: true,
    hookName: "Ideas",
  }
);
```

### 3. Query Hook

```typescript
export const usePollQuery = createDataHook(
  (pollId: string) => ["poll", pollId],
  (pollId: string) => pollsApi.getPollById(pollId)
);
```

### 4. Mutation Hook

```typescript
export const useCreatePoll = createMutationHook((data: PollData) =>
  pollsApi.createPoll(data)
);
```

## Component Usage

### With Enhanced Hook

```typescript
function MyComponent() {
  const {
    createIdea,
    isLoading,
    error,
    resetError,
    goTo
  } = useIdeas();

  const handleSubmit = async (data) => {
    try {
      await createIdea(data);
      goTo('/ideas');
    } catch (err) {
      // Error caught automatically
    }
  };

  return (
    <div>
      {error && <InlineError error={error} onDismiss={resetError} />}
      {isLoading && <LoadingSpinner />}
      <button onClick={handleSubmit} disabled={isLoading}>
        Submit
      </button>
    </div>
  );
}
```

### With Action Wrapper

```typescript
function MyComponent() {
  const { execute, isLoading, error, reset } = useActionWrapper();

  const handleAction = async () => {
    await execute('myAction', async () => {
      return await api.doSomething();
    });
  };

  return (
    <div>
      {error && <InlineError error={error} onDismiss={reset} />}
      {isLoading && <LoadingSpinner />}
      <button onClick={handleAction}>Do Action</button>
    </div>
  );
}
```

### With Error Boundary

```typescript
function App() {
  return (
    <ErrorBoundary>
      <YourApp />
    </ErrorBoundary>
  );
}
```

## Decision Tree

```
Need to create a hook?
│
├─ Fetching data?
│  └─ Use createDataHook (TanStack Query)
│
├─ Mutating data?
│  └─ Use createMutationHook (TanStack Query)
│
├─ Simple API wrapper?
│  ├─ Need error/loading? → Use createEnhancedApiHook ⭐
│  └─ Just wrapping? → Use createApiHook
│
└─ Complex async logic?
   └─ Use createAsyncHook

Need error handling in component?
│
├─ Catch React errors? → Use ErrorBoundary
├─ Manage error state? → Use useErrorBoundary
└─ Execute actions? → Use useActionWrapper ⭐

Need loading states?
│
├─ Track multiple actions? → Use useLoadingState
└─ Single action? → Use useActionWrapper ⭐
```

## Common Patterns

### Pattern 1: Create Enhanced Hook

```typescript
// hooks/useMyApi.ts
export const useMyApi = createEnhancedApiHook(
  {
    method1: api.method1,
    method2: api.method2,
  },
  { hookName: "MyApi" }
);
```

### Pattern 2: Use in Component

```typescript
// components/MyComponent.tsx
const { method1, isLoading, error, resetError } = useMyApi();
```

### Pattern 3: Display States

```typescript
{error && <InlineError error={error} onDismiss={resetError} />}
{isLoading && <LoadingSpinner message="Loading..." />}
```

### Pattern 4: Wrap with Error Boundary

```typescript
<ErrorBoundary>
  <MyComponent />
</ErrorBoundary>
```

## Cheat Sheet

| Need                | Use                        | Import From                  |
| ------------------- | -------------------------- | ---------------------------- |
| Fetch data          | `createDataHook`           | `@/hooks/factory`            |
| Mutate data         | `createMutationHook`       | `@/hooks/factory`            |
| API wrapper         | `createApiHook`            | `@/hooks/factory`            |
| API + error/loading | `createEnhancedApiHook` ⭐ | `@/hooks/factory`            |
| Error state         | `useErrorBoundary`         | `@/hooks/factory`            |
| Loading state       | `useLoadingState`          | `@/hooks/factory`            |
| Action execution    | `useActionWrapper` ⭐      | `@/hooks/factory`            |
| Catch React errors  | `ErrorBoundary`            | `@/components/ErrorBoundary` |
| Show error          | `InlineError`              | `@/components/ErrorBoundary` |
| Show loading        | `LoadingSpinner`           | `@/components/ErrorBoundary` |

⭐ = Most commonly used

## Tips

1. **Start with `createEnhancedApiHook`** - It has everything you need
2. **Always wrap app with `ErrorBoundary`** - Catches unexpected errors
3. **Use `InlineError` and `LoadingSpinner`** - Consistent UI
4. **Provide `hookName` option** - Better error logging
5. **Always handle errors** - Even if automatic, add try-catch
6. **Disable buttons when loading** - Better UX
7. **Provide reset/dismiss** - Let users recover from errors

## Common Mistakes

❌ **Don't:**

```typescript
// Forgetting to handle loading state
<button onClick={handleAction}>Submit</button>

// Not displaying errors
const { error } = useMyApi();
// ... no error display

// Not providing reset
{error && <div>{error.message}</div>}
```

✅ **Do:**

```typescript
// Handle loading state
<button onClick={handleAction} disabled={isLoading}>
  {isLoading ? 'Loading...' : 'Submit'}
</button>

// Display errors
{error && <InlineError error={error} onDismiss={resetError} />}

// Provide reset
{error && <InlineError error={error} onDismiss={resetError} />}
```

## Need Help?

- 📖 Full docs: `FACTORY_PATTERN.md`
- 🚀 Enhanced features: `ENHANCED_FEATURES.md`
- 📊 Summary: `ENHANCEMENT_SUMMARY.md`
- 🏗️ Architecture: `ARCHITECTURE.md`
- 💡 Example: `useIdeasEnhanced.example.ts`
