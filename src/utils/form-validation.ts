import { ZodError, ZodSchema } from "zod";

/**
 * Validates form data against a Zod schema
 * @param schema The Zod schema to validate against
 * @param data The data to validate
 * @returns An object containing validation results
 */
export function validateForm<T>(
  schema: ZodSchema,
  data: unknown
): {
  success: boolean;
  data?: T;
  errors?: Record<string, string>;
} {
  try {
    const validData = schema.parse(data);
    return {
      success: true,
      data: validData as T,
    };
  } catch (error) {
    if (error instanceof ZodError) {
      const formattedErrors: Record<string, string> = {};

      error.errors.forEach((err) => {
        if (err.path.length > 0) {
          const path = err.path.join(".");
          formattedErrors[path] = err.message;
        }
      });

      return {
        success: false,
        errors: formattedErrors,
      };
    }

    return {
      success: false,
      errors: { _form: "An unexpected error occurred" },
    };
  }
}

/**
 * Formats API validation errors from Zod
 * @param apiError The error response from the API
 * @returns A formatted error object
 */
export function formatApiValidationErrors(
  apiError: unknown
): Record<string, string> {
  if (!apiError || typeof apiError !== "object" || !("error" in apiError)) {
    return { _form: "An unexpected error occurred" };
  }

  const formattedErrors: Record<string, string> = {};

  Object.entries(
    (apiError as { error: Record<string, unknown> }).error
  ).forEach(([field, fieldErrors]) => {
    if (
      field === "_errors" &&
      Array.isArray(fieldErrors) &&
      fieldErrors.length > 0
    ) {
      formattedErrors._form = String(fieldErrors[0]);
    } else if (
      fieldErrors !== null &&
      typeof fieldErrors === "object" &&
      "_errors" in fieldErrors &&
      Array.isArray((fieldErrors as { _errors: unknown[] })._errors)
    ) {
      formattedErrors[field] = String(
        (fieldErrors as { _errors: unknown[] })._errors[0]
      );
    }
  });

  if (Object.keys(formattedErrors).length === 0) {
    formattedErrors._form = "Validation failed";
  }

  return formattedErrors;
}
