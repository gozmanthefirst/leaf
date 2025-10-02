import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { zodValidator } from "@tanstack/zod-adapter";
import { useEffect, useState } from "react";
import { TbEye, TbEyeClosed } from "react-icons/tb";
import { toast } from "sonner";
import z from "zod";

import { Button } from "@/components/ui/button";
import { Input, InputAddon, InputError } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BrandLink } from "@/components/ui/styled-texts";
import { cancelToastEl } from "@/components/ui/toaster";
import { signInErrMaps } from "@/error-mappings/auth-error-mappings";
import { useInputRefs } from "@/hooks/use-input-refs";
import { authClient } from "@/lib/better-auth-client";
import { apiErrorHandler } from "@/lib/handle-api-error";
import { SignInSchema } from "@/schemas/auth-schema";
import { $signIn } from "@/server/auth";

const SearchSchema = z.object({
  error: z.string().optional(),
  success: z.string().optional(),
});

export const Route = createFileRoute("/auth/sign-in")({
  validateSearch: zodValidator(SearchSchema),
  component: SignInPage,
});

function SignInPage() {
  const signIn = useServerFn($signIn);
  const { error, success } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });

  const [isPwdVisible, setIsPwdVisible] = useState(false);
  const [buttonState, setButtonState] = useState<"idle" | "loading">("idle");

  // Refs for focusing on input fields after validation errors
  const [emailInputRef, pwdInputRef] = useInputRefs(2);

  useEffect(() => {
    if (error) {
      setTimeout(() => {
        toast.error(error, cancelToastEl);
      });
    }
    if (success) {
      setTimeout(() => {
        toast.success(success, cancelToastEl);
      });
    }

    navigate({
      search: { error: undefined, success: undefined },
    });
  }, [error, success, navigate]);

  const signInMutation = useMutation({
    mutationFn: signIn,
    onSuccess: () => {
      toast.success("You've successfully signed in!", cancelToastEl);
      form.reset();
      navigate({
        to: "/",
        reloadDocument: true,
      });
    },
    onError: (error) => {
      const apiError = apiErrorHandler(error, {
        defaultMessage: "An error occurred while signing in. Please try again.",
        errorMapping: signInErrMaps,
      });
      toast.error(apiError.details, cancelToastEl);
    },
  });

  const handleGoogleSignIn = async () => {
    try {
      await authClient.signIn.social(
        {
          provider: "google",
        },
        {
          onRequest() {
            setButtonState("loading");
          },
          onError(ctx) {
            toast.error(ctx.error.message, cancelToastEl);
          },
        },
      );
    } catch (error) {
      if (process.env.NODE_ENV !== "production") {
        console.error(error);
      }
    } finally {
      setButtonState("idle");
    }
  };

  const form = useForm({
    defaultValues: {
      email: "",
      password: "",
    },
    validators: {
      onChange: SignInSchema,
    },
    onSubmit: async ({ value }) => {
      signInMutation.mutate({ data: value });
    },
    canSubmitWhenInvalid: true,
    onSubmitInvalid: ({ formApi }) => {
      const fieldStates = formApi.state.fieldMeta;
      if (fieldStates.email?.errorMap?.onChange) {
        emailInputRef?.current?.focus();
      } else if (fieldStates.password?.errorMap?.onChange) {
        pwdInputRef?.current?.focus();
      }
    },
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="font-bold font-roboto text-3xl">Sign In</h1>
      </div>

      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
      >
        <Button
          disabled={buttonState === "loading" || signInMutation.isPending}
          onClick={handleGoogleSignIn}
          variant={"secondary"}
        >
          {buttonState === "loading" ? "Signing in..." : "Sign in with Google"}
        </Button>

        <div className="flex items-center justify-center gap-4 text-neutral-500">
          <span className="h-px w-full bg-neutral-300 dark:bg-neutral-700/75" />
          <span>or</span>
          <span className="h-px w-full bg-neutral-300 dark:bg-neutral-700/75" />
        </div>

        <form.Field name="email">
          {(field) => (
            <div>
              <Label className="mb-1.5" htmlFor={field.name}>
                Email
              </Label>
              <Input
                aria-invalid={field.state.meta.errors.length > 0}
                disabled={signInMutation.isPending}
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
                  disabled={signInMutation.isPending}
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
              <div className="mt-1 flex justify-end">
                <BrandLink
                  className="self-end text-xs"
                  to="/auth/forgot-password"
                >
                  Forgot password?
                </BrandLink>
              </div>
            </div>
          )}
        </form.Field>

        <form.Subscribe selector={(state) => [state.isFormValid]}>
          {([isFormValid]) => (
            <Button
              className="mt-2"
              disabled={!isFormValid || signInMutation.isPending}
              type="submit"
              variant={
                !isFormValid || signInMutation.isPending
                  ? "secondary"
                  : "default"
              }
            >
              {signInMutation.isPending ? "Signing in..." : "Sign In"}
            </Button>
          )}
        </form.Subscribe>

        <div className="self-center text-center text-neutral-600 text-sm dark:text-neutral-400">
          Don't have an account?{" "}
          <BrandLink to="/auth/sign-up">Sign Up</BrandLink>
        </div>
      </form>
    </div>
  );
}
