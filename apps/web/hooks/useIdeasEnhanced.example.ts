/**
 * Example: Enhanced Ideas Hook
 *
 * This is an example of how to use createEnhancedApiHook
 * to create a hook with automatic error handling and loading states.
 *
 * To use this in your app:
 * 1. Rename this file to useIdeas.ts (backup the old one first)
 * 2. Update imports in components
 * 3. Use the new error and loading states
 */

import { createEnhancedApiHook } from "./factory";
import { ideasApi } from "../api";

/**
 * Enhanced Ideas Hook with automatic error handling and loading states
 *
 * @example
 * const {
 *   createIdea,
 *   getIdeaById,
 *   isLoading,
 *   error,
 *   resetError,
 *   loadingAction,
 *   goTo
 * } = useIdeasEnhanced();
 *
 * // Create idea with automatic error handling
 * try {
 *   await createIdea(data);
 *   goTo('/ideas');
 * } catch (err) {
 *   // Error is automatically caught and stored in `error` state
 * }
 *
 * // Display error and loading states
 * {error && <InlineError error={error} onDismiss={resetError} />}
 * {isLoading && <LoadingSpinner message={loadingAction} />}
 */
export const useIdeasEnhanced = createEnhancedApiHook(
  {
    createIdea: ideasApi.createIdea,
    getIdeaById: ideasApi.getIdeaById,
    updateIdeaCID: ideasApi.updateIdeaCID,
    updateIdea: ideasApi.updateIdea,
  },
  {
    includeRedirect: true,
    hookName: "Ideas",
  }
);

/**
 * Example Component Usage:
 *
 * import { useIdeasEnhanced } from "@/hooks/useIdeasEnhanced";
 * import { InlineError, LoadingSpinner } from "@/components/ErrorBoundary";
 *
 * function IdeaForm() {
 *   const {
 *     createIdea,
 *     isLoading,
 *     error,
 *     resetError,
 *     loadingAction,
 *     goTo
 *   } = useIdeasEnhanced();
 *
 *   const [formData, setFormData] = useState({});
 *
 *   const handleSubmit = async (e: FormEvent) => {
 *     e.preventDefault();
 *     try {
 *       await createIdea(formData);
 *       goTo('/ideas');
 *     } catch (err) {
 *       // Error automatically caught and displayed
 *     }
 *   };
 *
 *   return (
 *     <div>
 *       {error && (
 *         <InlineError
 *           error={error}
 *           onDismiss={resetError}
 *         />
 *       )}
 *
 *       {isLoading && (
 *         <LoadingSpinner
 *           size="lg"
 *           message={`Processing: ${loadingAction}`}
 *         />
 *       )}
 *
 *       <form onSubmit={handleSubmit}>
 *         <input
 *           type="text"
 *           onChange={(e) => setFormData({...formData, title: e.target.value})}
 *           disabled={isLoading}
 *         />
 *         <button type="submit" disabled={isLoading}>
 *           {isLoading ? 'Creating...' : 'Create Idea'}
 *         </button>
 *       </form>
 *     </div>
 *   );
 * }
 */
