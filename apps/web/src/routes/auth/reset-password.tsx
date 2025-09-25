import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { zodValidator } from "@tanstack/zod-adapter";
import { useState } from "react";
import { TbEye, TbEyeClosed } from "react-icons/tb";
import { toast } from "sonner";
import z from "zod";

import { Button } from "@/components/ui/button";
import { Input, InputAddon, InputError } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BrandLink } from "@/components/ui/styled-texts";
import { cancelToastEl } from "@/components/ui/toaster";
import { resetPwdErrMaps } from "@/error-mappings/auth-error-mappings";
import { useInputRefs } from "@/hooks/use-input-refs";
import { apiErrorHandler } from "@/lib/handle-api-error";
import { ResetPwdSchema } from "@/schemas/auth-schema";
import { $resetPwd } from "@/server/auth";

const SearchParamsSchema = z.object({
  token: z.string().prefault(""),
});

export const Route = createFileRoute("/auth/reset-password")({
  validateSearch: zodValidator(SearchParamsSchema),
  beforeLoad: ({ search }) => {
    if (!search.token) {
      throw redirect({
        to: "/auth/sign-in",
        replace: true,
      });
    }
  },
  component: ResetPwdPage,
});

function ResetPwdPage() {
  const resetPwd = useServerFn($resetPwd);
  const { token } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });

  const [isNewPwdVisible, setIsNewPwdVisible] = useState(false);
  const [isConfirmPwdVisible, setIsConfirmPwdVisible] = useState(false);

  // Refs for focusing on input fields after validation errors
  const [newPwdInputRef, confirmPwdInputRef] = useInputRefs(2);

  const resetPwdMutation = useMutation({
    mutationFn: resetPwd,
    onSuccess: () => {
      toast.success(
        "Your password has been successfully reset!",
        cancelToastEl,
      );
      form.reset();
      navigate({
        to: "/auth/sign-in",
        replace: true,
      });
    },
    onError: (error) => {
      const apiError = apiErrorHandler(error, {
        defaultMessage:
          "An error occurred while resetting your password. Please try again.",
        errorMapping: resetPwdErrMaps,
      });
      toast.error(apiError.details, cancelToastEl);
    },
  });

  const form = useForm({
    defaultValues: {
      token,
      newPassword: "",
      confirmPassword: "",
    },
    validators: {
      onChange: ResetPwdSchema,
    },
    onSubmit: async ({ value }) => {
      resetPwdMutation.mutate({ data: value });
    },
    canSubmitWhenInvalid: true,
    onSubmitInvalid: ({ formApi }) => {
      const fieldStates = formApi.state.fieldMeta;
      if (fieldStates.newPassword?.errorMap?.onChange) {
        newPwdInputRef?.current?.focus();
      } else if (fieldStates.confirmPassword?.errorMap?.onChange) {
        confirmPwdInputRef?.current?.focus();
      }
    },
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="font-bold font-roboto text-3xl">Reset Password</h1>
        <p>
          {`Enter your new password below. Make sure to choose a strong password
          that you haven't used before.`}
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
        <form.Field name="newPassword">
          {(field) => (
            <div>
              <Label className="mb-1.5" htmlFor={field.name}>
                New Password
              </Label>
              <div className="relative">
                <Input
                  aria-invalid={field.state.meta.errors.length > 0}
                  disabled={resetPwdMutation.isPending}
                  id={field.name}
                  name={field.name}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  ref={newPwdInputRef}
                  type={isNewPwdVisible ? "text" : "password"}
                  value={field.state.value}
                />
                <InputAddon
                  aria-invalid={field.state.meta.errors.length > 0}
                  isVisible={isNewPwdVisible}
                  onClick={() => setIsNewPwdVisible((prev) => !prev)}
                >
                  {isNewPwdVisible ? (
                    <TbEyeClosed className="size-4" />
                  ) : (
                    <TbEye className="size-4" />
                  )}
                </InputAddon>
              </div>
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

        <form.Field name="confirmPassword">
          {(field) => (
            <div>
              <Label className="mb-1.5" htmlFor={field.name}>
                Confirm Password
              </Label>
              <div className="relative">
                <Input
                  aria-invalid={field.state.meta.errors.length > 0}
                  disabled={resetPwdMutation.isPending}
                  id={field.name}
                  name={field.name}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  ref={confirmPwdInputRef}
                  type={isConfirmPwdVisible ? "text" : "password"}
                  value={field.state.value}
                />
                <InputAddon
                  aria-invalid={field.state.meta.errors.length > 0}
                  isVisible={isConfirmPwdVisible}
                  onClick={() => setIsConfirmPwdVisible((prev) => !prev)}
                >
                  {isConfirmPwdVisible ? (
                    <TbEyeClosed className="size-4" />
                  ) : (
                    <TbEye className="size-4" />
                  )}
                </InputAddon>
              </div>
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
              disabled={!isFormValid || resetPwdMutation.isPending}
              type="submit"
              variant={
                !isFormValid || resetPwdMutation.isPending
                  ? "secondary"
                  : "default"
              }
            >
              {resetPwdMutation.isPending
                ? "Resetting password..."
                : "Reset Password"}
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
