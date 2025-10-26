import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { zodValidator } from "@tanstack/zod-adapter";
import { Image } from "@unpic/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import z from "zod";

import { Button } from "@/components/ui/button";
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
      <div className="size-10">
        <Image
          alt="App Logo"
          background="auto"
          layout="fullWidth"
          priority
          src={"/logos/app-logo.png"}
        />
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="font-bold font-roboto text-3xl">Sign In</h1>
        </div>

        <div className="flex flex-col gap-4">
          <Button
            disabled={buttonState === "loading" || signInMutation.isPending}
            onClick={handleGoogleSignIn}
            type="button"
          >
            {buttonState === "loading"
              ? "Signing in..."
              : "Sign in with Google"}
          </Button>
        </div>
      </div>
    </div>
  );
}
