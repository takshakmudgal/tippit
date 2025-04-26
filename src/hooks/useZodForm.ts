import { useState } from "react";
import { ZodSchema } from "zod";
import {
  validateForm,
  formatApiValidationErrors,
} from "@/utils/form-validation";

export function useZodForm<T extends Record<string, unknown>>(
  schema: ZodSchema,
  initialValues: T
) {
  const [formData, setFormData] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const setFieldValue = (field: keyof T, value: unknown) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    if (errors[field as string]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field as string];
        return newErrors;
      });
    }
  };

  const validateFormData = () => {
    const result = validateForm<T>(schema, formData);

    if (!result.success && result.errors) {
      setErrors(result.errors);
      return false;
    }

    return true;
  };

  const handleApiError = (apiError: unknown) => {
    const formattedErrors = formatApiValidationErrors(apiError);
    setErrors(formattedErrors);
  };

  const resetForm = () => {
    setFormData(initialValues);
    setErrors({});
  };

  return {
    formData,
    errors,
    isSubmitting,
    setIsSubmitting,
    handleChange,
    setFieldValue,
    validateFormData,
    handleApiError,
    resetForm,
    setErrors,
  };
}
