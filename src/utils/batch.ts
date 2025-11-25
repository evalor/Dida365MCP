/**
 * Batch Execution Utilities
 *
 * Provides concurrent batch execution with rate limiting and result formatting.
 */

/**
 * Maximum number of concurrent API requests
 * This limit helps prevent rate limiting from the Dida365 API
 */
export const MAX_CONCURRENT = 5;

/**
 * Result of a single batch operation
 */
export interface BatchResult<T, R> {
    /** Index of the item in the original array */
    index: number;
    /** Whether the operation succeeded */
    success: boolean;
    /** Result data (only present on success) */
    result?: R;
    /** Error message (only present on failure) */
    error?: string;
    /** Original input for reference/retry */
    input: T;
}

/**
 * Summary statistics for batch operations
 */
export interface BatchSummary {
    /** Total number of items processed */
    total: number;
    /** Number of successful operations */
    succeeded: number;
    /** Number of failed operations */
    failed: number;
}

/**
 * Formatted batch operation response
 */
export interface BatchResponse<T, R> {
    /** Summary statistics */
    summary: BatchSummary;
    /** Detailed results for each item */
    results: Array<{
        index: number;
        success: boolean;
        task?: R;
        taskId?: string;
        projectId?: string;
        error?: string;
        errorType?: 'not_found' | 'auth_failed' | 'network' | 'validation' | 'unknown';
        retryable?: boolean;
        input?: T;
    }>;
    /** Failed items ready for retry */
    failedItems?: T[];
}

/**
 * Classify error type and determine if retryable
 */
function classifyError(error: string): { errorType: 'not_found' | 'auth_failed' | 'network' | 'validation' | 'unknown'; retryable: boolean } {
    const lowerError = error.toLowerCase();

    if (lowerError.includes('not found') || lowerError.includes('404')) {
        return { errorType: 'not_found', retryable: false };
    }
    if (lowerError.includes('401') || lowerError.includes('unauthorized') || lowerError.includes('authentication')) {
        return { errorType: 'auth_failed', retryable: false };
    }
    if (lowerError.includes('network') || lowerError.includes('timeout') || lowerError.includes('econnrefused') || lowerError.includes('429') || lowerError.includes('too many')) {
        return { errorType: 'network', retryable: true };
    }
    if (lowerError.includes('invalid') || lowerError.includes('required') || lowerError.includes('validation')) {
        return { errorType: 'validation', retryable: false };
    }
    return { errorType: 'unknown', retryable: true };
}

/**
 * Execute operations in batches with concurrency control
 *
 * @param items - Array of items to process
 * @param executor - Async function to execute for each item
 * @param maxConcurrent - Maximum concurrent operations (default: MAX_CONCURRENT)
 * @returns Array of batch results
 *
 * @example
 * ```typescript
 * const results = await batchExecute(
 *   tasks,
 *   async (task) => await createTask(task),
 *   5
 * );
 * ```
 */
export async function batchExecute<T, R>(
    items: T[],
    executor: (item: T) => Promise<R>,
    maxConcurrent: number = MAX_CONCURRENT
): Promise<BatchResult<T, R>[]> {
    const results: BatchResult<T, R>[] = [];

    // Process items in chunks to respect rate limits
    for (let i = 0; i < items.length; i += maxConcurrent) {
        const batch = items.slice(i, i + maxConcurrent);

        const batchPromises = batch.map(async (item, batchIndex) => {
            const index = i + batchIndex;
            try {
                const result = await executor(item);
                return {
                    index,
                    success: true as const,
                    result,
                    input: item,
                };
            } catch (error) {
                return {
                    index,
                    success: false as const,
                    error: error instanceof Error ? error.message : String(error),
                    input: item,
                };
            }
        });

        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);
    }

    return results;
}

/**
 * Format batch results for create/update operations (returns task objects)
 *
 * @param results - Raw batch execution results
 * @returns Formatted response with summary, results, and failed items
 */
export function formatBatchResults<T, R>(
    results: BatchResult<T, R>[]
): BatchResponse<T, R> {
    const succeeded = results.filter((r) => r.success).length;
    const failed = results.length - succeeded;

    return {
        summary: {
            total: results.length,
            succeeded,
            failed,
        },
        results: results.map((r) => {
            if (r.success) {
                return {
                    index: r.index,
                    success: true,
                    task: r.result,
                };
            } else {
                const { errorType, retryable } = classifyError(r.error || '');
                return {
                    index: r.index,
                    success: false,
                    error: r.error,
                    errorType,
                    retryable,
                    input: r.input,
                };
            }
        }),
        ...(failed > 0 && {
            failedItems: results.filter((r) => !r.success).map((r) => r.input),
        }),
    };
}

/**
 * Format batch results for complete/delete operations (no task object returned)
 *
 * @param results - Raw batch execution results
 * @returns Formatted response with summary, results, and failed items
 */
export function formatBatchResultsSimple<
    T extends { taskId: string; projectId: string },
>(results: BatchResult<T, void>[]): BatchResponse<T, void> {
    const succeeded = results.filter((r) => r.success).length;
    const failed = results.length - succeeded;

    return {
        summary: {
            total: results.length,
            succeeded,
            failed,
        },
        results: results.map((r) => {
            if (r.success) {
                return {
                    index: r.index,
                    success: true,
                    taskId: r.input.taskId,
                    projectId: r.input.projectId,
                };
            } else {
                const { errorType, retryable } = classifyError(r.error || '');
                return {
                    index: r.index,
                    success: false,
                    error: r.error,
                    errorType,
                    retryable,
                    input: r.input,
                };
            }
        }),
        ...(failed > 0 && {
            failedItems: results.filter((r) => !r.success).map((r) => r.input),
        }),
    };
}
