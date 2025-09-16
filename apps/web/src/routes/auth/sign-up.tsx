import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { TbEye, TbEyeClosed } from "react-icons/tb";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input, InputAddon, InputError } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BrandLink } from "@/components/ui/styled-texts";
import { cancelToastEl } from "@/components/ui/toaster";
import { signUpErrMaps } from "@/error-mappings/auth-error-mappings";
import { useInputRefs } from "@/hooks/use-input-refs";
import { apiErrorHandler } from "@/lib/api-error";
import { SignUpSchema } from "@/schemas/auth-schema";
import { $signUp } from "@/server/auth";

export const Route = createFileRoute("/auth/sign-up")({
  component: SignUpPage,
});

function SignUpPage() {
  const signUp = useServerFn($signUp);
  const navigate = useNavigate({ from: Route.fullPath });

  const [isPwdVisible, setIsPwdVisible] = useState(false);
  const [isConfirmPwdVisible, setIsConfirmPwdVisible] = useState(false);

  // Refs for focusing on input fields after validation errors
  const [nameInputRef, emailInputRef, pwdInputRef, confirmPwdInputRef] =
    useInputRefs(4);

  const signUpMutation = useMutation({
    mutationFn: signUp,
    onSuccess: () => {
      toast.success("Your account has been created!", cancelToastEl);
      form.reset();
      navigate({
        to: "/auth/sign-in",
      });
    },
    onError: (error) => {
      const apiError = apiErrorHandler(error, {
        defaultMessage: "An error occurred while signing up. Please try again.",
        errorMapping: signUpErrMaps,
      });
      toast.error(apiError.details, cancelToastEl);
    },
  });

  const form = useForm({
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
    validators: {
      onChange: SignUpSchema,
    },
    onSubmit: async ({ value }) => {
      signUpMutation.mutate({ data: value });
    },
    canSubmitWhenInvalid: true,
    onSubmitInvalid: ({ formApi }) => {
      const fieldStates = formApi.state.fieldMeta;
      if (fieldStates.name?.errorMap?.onChange) {
        nameInputRef?.current?.focus();
      } else if (fieldStates.email?.errorMap?.onChange) {
        emailInputRef?.current?.focus();
      } else if (fieldStates.password?.errorMap?.onChange) {
        pwdInputRef?.current?.focus();
      } else if (fieldStates.confirmPassword?.errorMap?.onChange) {
        confirmPwdInputRef?.current?.focus();
      }
    },
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="font-bold font-roboto text-3xl">Sign Up</h1>
      </div>

      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
      >
        <form.Field name="name">
          {(field) => (
            <div>
              <Label className="mb-1.5" htmlFor={field.name}>
                Name
              </Label>
              <Input
                aria-invalid={field.state.meta.errors.length > 0}
                disabled={signUpMutation.isPending}
                id={field.name}
                name={field.name}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder="John Doe"
                ref={nameInputRef}
                type="text"
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

        <form.Field name="email">
          {(field) => (
            <div>
              <Label className="mb-1.5" htmlFor={field.name}>
                Email
              </Label>
              <Input
                aria-invalid={field.state.meta.errors.length > 0}
                disabled={signUpMutation.isPending}
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

        <form.Field name="password">
          {(field) => (
            <div>
              <Label className="mb-1.5" htmlFor={field.name}>
                Password
              </Label>
              <div className="relative">
                <Input
                  aria-invalid={field.state.meta.errors.length > 0}
                  disabled={signUpMutation.isPending}
                  id={field.name}
                  name={field.name}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  ref={pwdInputRef}
                  type={isPwdVisible ? "text" : "password"}
                  value={field.state.value}
                />
                <InputAddon
                  aria-invalid={field.state.meta.errors.length > 0}
                  isVisible={isPwdVisible}
                  onClick={() => setIsPwdVisible((prev) => !prev)}
                >
                  {isPwdVisible ? (
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
                  disabled={signUpMutation.isPending}
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
              disabled={!isFormValid || signUpMutation.isPending}
              type="submit"
              variant={
                !isFormValid || signUpMutation.isPending
                  ? "secondary"
                  : "default"
              }
            >
              {signUpMutation.isPending
                ? "Creating account..."
                : "Create Account"}
            </Button>
          )}
        </form.Subscribe>

        <div className="self-center text-center text-neutral-600 text-sm dark:text-neutral-400">
          Already have an account?{" "}
          <BrandLink to="/auth/sign-in">Sign In</BrandLink>
        </div>
      </form>
    </div>
  );
}
