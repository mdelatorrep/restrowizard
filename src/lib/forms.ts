import { useForm, type DefaultValues, type FieldValues, type UseFormProps, type UseFormReturn, type Path } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { ZodType, ZodTypeDef } from "zod";

/**
 * Convenience wrapper around react-hook-form + zod.
 *
 * Usage:
 *   const Schema = z.object({ email: z.string().email() });
 *   const form = useZodForm(Schema, { defaultValues: { email: "" } });
 *   <form onSubmit={form.handleSubmit(onSubmit)}>...
 */
export function useZodForm<T extends FieldValues>(
  schema: ZodType<T, ZodTypeDef, unknown>,
  options?: Omit<UseFormProps<T>, "resolver"> & { defaultValues?: DefaultValues<T> },
): UseFormReturn<T> {
  return useForm<T>({
    mode: "onBlur",
    reValidateMode: "onChange",
    ...options,
    resolver: zodResolver(schema as any),
  });
}

export type { Path };
