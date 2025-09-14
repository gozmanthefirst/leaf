/** biome-ignore-all lint/correctness/useUniqueElementIds: needed */

import { createFileRoute } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BrandLink } from "@/components/ui/styled-texts";

export const Route = createFileRoute("/auth/forgot-password")({
  component: ForgotPwdPage,
});

function ForgotPwdPage() {
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

      <form className="flex flex-col gap-4">
        {/* Email */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" placeholder="johndoe@example.com" type="email" />
        </div>

        <Button className="mt-2">Continue</Button>

        <div className="self-center text-center text-neutral-600 text-sm dark:text-neutral-400">
          Remembered your password?{" "}
          <BrandLink to="/auth/sign-in">Sign In</BrandLink>
        </div>
      </form>
    </div>
  );
}
