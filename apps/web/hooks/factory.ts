import {
  useQuery,
  UseQueryOptions,
  QueryKey,
  useMutation,
  UseMutationOptions,
} from "@tanstack/react-query";
import { useState, useCallback } from "react";
import { useRedirect } from "./useRedirect";

/**
 * Error boundary state for hooks
 */
interface ErrorBoundaryState {
  error: Error | null;
  hasError: boolean;
  resetError: () => void;
}

/**
 * Loading state for async actions
 */
interface LoadingState {
  isLoading: boolean;
  loadingAction: string | null;
}

/**
 * Action wrapper result
 */
interface ActionResult<T> {
  data: T | null;
  error: Error | null;
  isLoading: boolean;
}

/**
 * Factory for creating TanStack Query hooks for data fetching
 * @example
 * const usePollQuery = createDataHook(
 *   (pollId: string) => ["poll", pollId],
 *   (pollId: string) => pollsApi.getPollById(pollId)
 * );
 */
export function createDataHook<TData, TArgs extends any[] = []>(
  queryKeyFactory: (...args: TArgs) => QueryKey,
  fetcher: (...args: TArgs) => Promise<TData>,
  defaultOptions?: Omit<
    UseQueryOptions<TData, Error, TData, QueryKey>,
    "queryKey" | "queryFn"
  >
) {
  return (...args: TArgs) => {
    const queryKey = queryKeyFactory(...args);
    return useQuery({
      queryKey,
      queryFn: () => fetcher(...args),
      ...defaultOptions,
    });
  };
}

/**
 * Factory for creating TanStack Query mutation hooks
 * @example
 * const useCreatePoll = createMutationHook(
 *   (data: CreatePollData) => pollsApi.createPoll(data),
 *   { onSuccess: () => console.log('Poll created!') }
 * );
 */
export function createMutationHook<TData, TVariables>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  defaultOptions?: Omit<
    UseMutationOptions<TData, Error, TVariables>,
    "mutationFn"
  >
) {
  return () => {
    return useMutation({
      mutationFn,
      ...defaultOptions,
    });
  };
}

/**
 * Factory for creating simple API wrapper hooks
 * Wraps API methods and optionally includes redirect utilities
 * @example
 * const useIdeas = createApiHook({
 *   createIdea: ideasApi.createIdea,
 *   getIdeaById: ideasApi.getIdeaById,
 * }, { includeRedirect: true });
 */
export function createApiHook<
  T extends Record<string, (...args: any[]) => any>,
>(apiMethods: T, options?: { includeRedirect?: boolean }) {
  return () => {
    const redirect = options?.includeRedirect ? useRedirect() : undefined;

    return {
      ...apiMethods,
      ...(redirect && { goTo: redirect.goTo, replaceTo: redirect.replaceTo }),
    };
  };
}

/**
 * Factory for creating hooks with async methods that handle errors
 * Automatically wraps methods with try-catch and error logging
 * @example
 * const usePolls = createAsyncHook({
 *   getPolls: async (status?: PollStatus) => {
 *     return await pollsApi.getPolls(status);
 *   },
 * }, 'Polls');
 */
export function createAsyncHook<
  T extends Record<string, (...args: any[]) => Promise<any>>,
>(methods: T, hookName: string) {
  return () => {
    const wrappedMethods = {} as {
      [K in keyof T]: T[K];
    };

    for (const [key, method] of Object.entries(methods)) {
      wrappedMethods[key as keyof T] = (async (...args: any[]) => {
        try {
          return await method(...args);
        } catch (error) {
          console.error(`${hookName} - ${key} error:`, error);
          throw error;
        }
      }) as T[keyof T];
    }

    return wrappedMethods;
  };
}

/**
 * Hook for error boundary functionality
 * Provides error state management and reset capability
 * @example
 * const { error, hasError, resetError, catchError } = useErrorBoundary();
 *
 * try {
 *   await someAction();
 * } catch (err) {
 *   catchError(err);
 * }
 */
export function useErrorBoundary(): ErrorBoundaryState & {
  catchError: (error: unknown) => void;
} {
  const [error, setError] = useState<Error | null>(null);

  const catchError = useCallback((err: unknown) => {
    const error = err instanceof Error ? err : new Error(String(err));
    setError(error);
    console.error("Error caught by boundary:", error);
  }, []);

  const resetError = useCallback(() => {
    setError(null);
  }, []);

  return {
    error,
    hasError: error !== null,
    resetError,
    catchError,
  };
}

/**
 * Hook for managing loading states across multiple actions
 * Tracks which action is currently loading
 * @example
 * const { isLoading, loadingAction, startLoading, stopLoading } = useLoadingState();
 *
 * startLoading('fetchData');
 * await fetchData();
 * stopLoading();
 */
export function useLoadingState() {
  const [state, setState] = useState<LoadingState>({
    isLoading: false,
    loadingAction: null,
  });

  const startLoading = useCallback((action: string) => {
    setState({ isLoading: true, loadingAction: action });
  }, []);

  const stopLoading = useCallback(() => {
    setState({ isLoading: false, loadingAction: null });
  }, []);

  return {
    ...state,
    startLoading,
    stopLoading,
  };
}

/**
 * Action wrapper that combines error handling and loading state
 * Automatically manages loading state and catches errors
 * @example
 * const { execute, isLoading, error, data } = useActionWrapper();
 *
 * const handleSubmit = async () => {
 *   await execute('submit', async () => {
 *     return await api.submit(data);
 *   });
 * };
 */
export function useActionWrapper<T = any>() {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  const execute = useCallback(
    async (actionName: string, action: () => Promise<T>): Promise<T> => {
      setIsLoading(true);
      setLoadingAction(actionName);
      setError(null);

      try {
        const result = await action();
        setData(result);
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        console.error(`Action "${actionName}" failed:`, error);
        throw error;
      } finally {
        setIsLoading(false);
        setLoadingAction(null);
      }
    },
    []
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setIsLoading(false);
    setLoadingAction(null);
  }, []);

  return {
    execute,
    reset,
    data,
    error,
    isLoading,
    loadingAction,
  };
}

/**
 * Enhanced API hook with error boundary and loading state
 * Wraps API methods with automatic error handling and loading states
 * @example
 * const useIdeas = createEnhancedApiHook({
 *   createIdea: ideasApi.createIdea,
 *   getIdeaById: ideasApi.getIdeaById,
 * }, {
 *   includeRedirect: true,
 *   hookName: 'Ideas'
 * });
 *
 * // Usage
 * const { createIdea, isLoading, error, resetError } = useIdeas();
 */
export function createEnhancedApiHook<
  T extends Record<string, (...args: any[]) => Promise<any>>,
>(
  apiMethods: T,
  options?: {
    includeRedirect?: boolean;
    hookName?: string;
  }
) {
  return () => {
    const redirect = options?.includeRedirect ? useRedirect() : undefined;
    const { execute, isLoading, error, reset, loadingAction } =
      useActionWrapper();
    const hookName = options?.hookName || "API";

    // Wrap each API method with action wrapper
    const wrappedMethods = {} as {
      [K in keyof T]: (
        ...args: Parameters<T[K]>
      ) => Promise<Awaited<ReturnType<T[K]>>>;
    };

    for (const [key, method] of Object.entries(apiMethods)) {
      wrappedMethods[key as keyof T] = (async (...args: any[]) => {
        return await execute(`${hookName}.${key}`, () => method(...args));
      }) as any;
    }

    return {
      ...wrappedMethods,
      isLoading,
      error,
      loadingAction,
      resetError: reset,
      ...(redirect && { goTo: redirect.goTo, replaceTo: redirect.replaceTo }),
    };
  };
}
