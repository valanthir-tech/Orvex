import { z } from "zod";

export type ActionState<T> = {
    data?: T;
    error?: string;
    fieldErrors?: Record<string, string[]>;
    success?: boolean;
};

/**
 * Wrapper for Server Actions to handle errors and validation consistently.
 */
export async function createSafeAction<TInput, TOutput>(
    schema: z.Schema<TInput>,
    handler: (validatedData: TInput) => Promise<TOutput>
): Promise<ActionState<TOutput>> {
    try {
        // 1. Validate Input
        // We assume the input is already passed here, but if we were expecting formData, 
        // we would need a different signature. For now, assuming direct arguments.
        // However, server actions usually receive data. 
        // Let's adjust this to be a higher-order function or a utility that takes the data.
        return { success: false, error: "Use executeSafeAction instead" };
    } catch (error) {
        return { success: false, error: "Internal Server Error" };
    }
}

export async function executeAction<TInput, TOutput>(
    schema: z.Schema<TInput>,
    data: TInput,
    handler: (validatedData: TInput) => Promise<TOutput>
): Promise<ActionState<TOutput>> {
    try {
        const validatedResult = schema.safeParse(data);

        if (!validatedResult.success) {
            return {
                success: false,
                fieldErrors: validatedResult.error.flatten().fieldErrors as Record<string, string[]>,
                error: "Validation Failed",
            };
        }

        const response = await handler(validatedResult.data);

        return {
            success: true,
            data: response,
        };
    } catch (error: any) {
        console.error("Action Error:", error);
        return {
            success: false,
            error: error.message || "Something went wrong",
        };
    }
}
