# Hook Factory Architecture

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         Factory Layer                            │
│                        (factory.ts)                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────┐  ┌──────────────────┐                    │
│  │ createDataHook   │  │createMutationHook│                    │
│  │                  │  │                  │                    │
│  │ • TanStack Query │  │ • TanStack Query │                    │
│  │ • Caching        │  │ • Mutations      │                    │
│  │ • Auto-refetch   │  │ • Callbacks      │                    │
│  └──────────────────┘  └──────────────────┘                    │
│                                                                   │
│  ┌──────────────────┐  ┌──────────────────┐                    │
│  │ createApiHook    │  │ createAsyncHook  │                    │
│  │                  │  │                  │                    │
│  │ • API wrapping   │  │ • Error handling │                    │
│  │ • Opt. redirect  │  │ • Auto logging   │                    │
│  │ • Type-safe      │  │ • Try-catch wrap │                    │
│  └──────────────────┘  └──────────────────┘                    │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
                              ▲
                              │
                              │ Uses
                              │
┌─────────────────────────────────────────────────────────────────┐
│                         Hook Layer                               │
│                    (Individual Hooks)                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  useIdeas      useIPFS       useUser        useVote             │
│  useRewards    useResults    useJoinPoll    usePolls            │
│                                                                   │
│  All hooks created using factory functions                       │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
                              ▲
                              │
                              │ Imports
                              │
┌─────────────────────────────────────────────────────────────────┐
│                      Component Layer                             │
│                   (React Components)                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  LoginPage    PollPage    IdeaPage    DashboardPage             │
│                                                                   │
│  Components use hooks without knowing about factory pattern      │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow

### 1. Query Hook Flow (createDataHook)

```
Component
    │
    ├─> usePollsQuery("active")
    │       │
    │       ├─> TanStack Query
    │       │       │
    │       │       ├─> Check cache
    │       │       │
    │       │       ├─> Fetch if needed
    │       │       │       │
    │       │       │       └─> pollsApi.getPolls("active")
    │       │       │
    │       │       └─> Return { data, isLoading, error }
    │       │
    │       └─> Component receives data
    │
    └─> Render with data
```

### 2. API Hook Flow (createApiHook)

```
Component
    │
    ├─> const { createIdea, goTo } = useIdeas()
    │       │
    │       ├─> Factory wraps API methods
    │       │       │
    │       │       ├─> createIdea = ideasApi.createIdea
    │       │       ├─> getIdeaById = ideasApi.getIdeaById
    │       │       └─> goTo = redirect.goTo (optional)
    │       │
    │       └─> Return wrapped methods
    │
    ├─> await createIdea(data)
    │       │
    │       └─> Direct API call
    │
    └─> goTo('/ideas')
```

### 3. Async Hook Flow (createAsyncHook)

```
Component
    │
    ├─> const { getReward } = useRewards()
    │       │
    │       ├─> Factory wraps with try-catch
    │       │       │
    │       │       └─> async (...args) => {
    │       │             try {
    │       │               return await method(...args)
    │       │             } catch (error) {
    │       │               console.error("Rewards - getReward error:", error)
    │       │               throw error
    │       │             }
    │       │           }
    │       │
    │       └─> Return wrapped method
    │
    ├─> await getReward(userId, pollId)
    │       │
    │       ├─> Automatic error logging
    │       │
    │       └─> Return result or throw
    │
    └─> Handle result
```

## Factory Selection Decision Tree

```
Need to fetch data?
    │
    ├─ YES ──> Need caching/auto-refetch?
    │           │
    │           ├─ YES ──> createDataHook
    │           │           (TanStack Query)
    │           │
    │           └─ NO ──> createApiHook
    │                      (Simple wrapper)
    │
    └─ NO ──> Need to modify data?
                │
                ├─ YES ──> Need loading states/callbacks?
                │           │
                │           ├─ YES ──> createMutationHook
                │           │           (TanStack Query)
                │           │
                │           └─ NO ──> createApiHook
                │                      (Simple wrapper)
                │
                └─ NO ──> Need error handling?
                            │
                            ├─ YES ──> createAsyncHook
                            │           (Auto error logging)
                            │
                            └─ NO ──> createApiHook
                                       (Simple wrapper)
```

## Pattern Comparison

### Traditional Hook Pattern

```typescript
// ❌ Lots of boilerplate
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

### Factory Pattern

```typescript
// ✅ Concise and declarative
export const useIdeas = createApiHook(
  {
    createIdea: ideasApi.createIdea,
    getIdeaById: ideasApi.getIdeaById,
    updateIdea: ideasApi.updateIdea,
  },
  { includeRedirect: true }
);
```

## Benefits Matrix

| Aspect              | Traditional | Factory Pattern |
| ------------------- | ----------- | --------------- |
| **Lines of Code**   | 15-25       | 5-12            |
| **Boilerplate**     | High        | Low             |
| **Consistency**     | Manual      | Automatic       |
| **Error Handling**  | Manual      | Built-in        |
| **Type Safety**     | Manual      | Automatic       |
| **Maintainability** | Medium      | High            |
| **Learning Curve**  | Low         | Medium          |
| **Flexibility**     | High        | High            |

## Migration Strategy

### Phase 1: Simple Hooks ✅ (Completed)

- useIdeas
- useIPFS
- useUser
- useVote
- useRewards
- useResults
- useJoinPoll

### Phase 2: Complex Hooks (Future)

- useAuth (authentication logic)
- useMACI (blockchain interactions)
- usePolls (complete migration)

### Phase 3: New Hooks (Ongoing)

- All new hooks should use factory pattern
- Choose appropriate factory based on needs

## Best Practices

1. **Choose the Right Factory**
   - Data fetching → `createDataHook`
   - Data mutation → `createMutationHook`
   - Simple API → `createApiHook`
   - Error handling → `createAsyncHook`

2. **Keep Hooks Focused**
   - One domain per hook (polls, ideas, users)
   - Don't mix concerns

3. **Use TypeScript**
   - Factories maintain full type safety
   - Let TypeScript infer types when possible

4. **Document Complex Logic**
   - Add comments for non-obvious patterns
   - Reference this architecture doc

5. **Test Thoroughly**
   - Factory pattern doesn't change behavior
   - Existing tests should still pass

## Conclusion

The factory pattern provides a scalable, maintainable approach to creating React hooks. It reduces boilerplate while maintaining flexibility and type safety.
