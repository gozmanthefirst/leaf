import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input, InputError } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BrandLink } from "@/components/ui/styled-texts";
import { cancelToastEl } from "@/components/ui/toaster";
import { forgotPwdErrMaps } from "@/error-mappings/auth-error-mappings";
import { useInputRefs } from "@/hooks/use-input-refs";
import { apiErrorHandler } from "@/lib/api-error";
import { EmailSchema } from "@/schemas/auth-schema";
import { $forgotPwd } from "@/server/auth";

export const Route = createFileRoute("/auth/forgot-password")({
  component: ForgotPwdPage,
});

function ForgotPwdPage() {
  const forgotPwd = useServerFn($forgotPwd);
  const navigate = useNavigate({ from: Route.fullPath });

  // Refs for focusing on input fields after validation errors
  const [emailInputRef] = useInputRefs(1);

  const forgotPwdMutation = useMutation({
    mutationFn: forgotPwd,
    onSuccess: () => {
      toast.success(
        "Check your email for a password reset link!",
        cancelToastEl,
      );
      form.reset();
      navigate({
        to: "/auth/sign-in",
      });
    },
    onError: (error) => {
      const apiError = apiErrorHandler(error, {
        defaultMessage:
          "An error occurred while requesting a password reset email. Please try again.",
        errorMapping: forgotPwdErrMaps,
      });
      toast.error(apiError.details, cancelToastEl);
    },
  });

  const form = useForm({
    defaultValues: {
      email: "",
    },
    validators: {
      onChange: EmailSchema,
    },
    onSubmit: async ({ value }) => {
      forgotPwdMutation.mutate({ data: value });
    },
    canSubmitWhenInvalid: true,
    onSubmitInvalid: ({ formApi }) => {
      const fieldStates = formApi.state.fieldMeta;
      if (fieldStates.email?.errorMap?.onChange) {
        emailInputRef?.current?.focus();
      }
    },
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="font-bold font-roboto text-3xl">
          Forgot your password?
        </h1>
        <p className="text-neutral-600 dark:text-neutral-400">
          Enter your email address below and we will send you a link to reset
          your password.
        </p>
      </div>

      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
      >
        <form.Field name="email">
          {(field) => (
            <div>
              <Label className="mb-1.5" htmlFor={field.name}>
                Email
              </Label>
              <Input
                aria-invalid={field.state.meta.errors.length > 0}
                disabled={forgotPwdMutation.isPending}
                id={field.name}
                name={field.name}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder="johndoe@example.com"
                ref={emailInputRef}
                type="email"
                value={field.state.value}
              />
              {field.state.meta.errorMap.onChange ? (
                <InputError
                  error={
                    field.state.meta.errorMap.onChange[0]?.message ||
                    "Something went wrong"
                  }
                />
              ) : null}
            </div>
          )}
        </form.Field>

        <form.Subscribe selector={(state) => [state.isFormValid]}>
          {([isFormValid]) => (
            <Button
              className="mt-2"
              disabled={!isFormValid || forgotPwdMutation.isPending}
              type="submit"
              variant={
                !isFormValid || forgotPwdMutation.isPending
                  ? "secondary"
                  : "default"
              }
            >
              {forgotPwdMutation.isPending ? "Sending..." : "Send Reset Link"}
            </Button>
          )}
        </form.Subscribe>

        <div className="self-center text-center text-neutral-600 text-sm dark:text-neutral-400">
          Remembered your password?{" "}
          <BrandLink to="/auth/sign-in">Sign In</BrandLink>
        </div>
      </form>
    </div>
  );
}
