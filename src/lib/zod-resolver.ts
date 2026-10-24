import { z } from "zod";
import type { Resolver, FieldValues, FieldErrors } from "react-hook-form";

/**
 * Resolver Zod ringan dan tangguh untuk React Hook Form.
 */
export function zodResolver<T extends FieldValues>(
  schema: z.ZodType<T>
): Resolver<T> {
  return async (values) => {
    const result = schema.safeParse(values);
    if (result.success) {
      return { values: result.data, errors: {} };
    }

    const errors: Record<string, { type: string; message: string }> = {};
    for (const issue of result.error.issues) {
      const path = issue.path.join(".") || "root";
      if (!errors[path]) {
        errors[path] = {
          type: issue.code,
          message: issue.message,
        };
      }
    }

    return {
      values: {},
      errors: errors as FieldErrors<T>,
    };
  };
}
