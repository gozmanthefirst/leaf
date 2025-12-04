import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { zodValidator } from "@tanstack/zod-adapter";
import { Image } from "@unpic/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import z from "zod";

import { Button } from "@/components/ui/button";
import { cancelToastEl } from "@/components/ui/toaster";
import { authClient } from "@/lib/better-auth-client";

const SearchSchema = z.object({
  error: z.string().optional(),
  success: z.string().optional(),
});

export const Route = createFileRoute("/auth/sign-in")({
  validateSearch: zodValidator(SearchSchema),
  component: SignInPage,
});

function SignInPage() {
  const { error, success } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });

  const [buttonState, setButtonState] = useState<"idle" | "loading">("idle");

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
            disabled={buttonState === "loading"}
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
