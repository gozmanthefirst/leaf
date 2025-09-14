/** biome-ignore-all lint/correctness/useUniqueElementIds: needed */

import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { TbEye, TbEyeClosed } from "react-icons/tb";

import { Button } from "@/components/ui/button";
import { Input, InputAddon } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BrandLink } from "@/components/ui/styled-texts";

export const Route = createFileRoute("/auth/sign-in")({
  component: SignInPage,
});

function SignInPage() {
  const [isPwdVisible, setIsPwdVisible] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="font-bold font-roboto text-3xl">Sign In</h1>
      </div>

      <form className="flex flex-col gap-4">
        {/* Email */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" placeholder="johndoe@example.com" type="email" />
        </div>

        {/* Password */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input id="password" type={isPwdVisible ? "text" : "password"} />
            <InputAddon
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
          <BrandLink
            className="self-end text-xs outline outline-lime-500"
            to="/auth/forgot-password"
          >
            Forgot password?
          </BrandLink>
        </div>

        <Button className="mt-2">Sign In</Button>

        <div className="self-center text-center text-neutral-600 text-sm dark:text-neutral-400">
          Don't have an account?{" "}
          <BrandLink to="/auth/sign-up">Sign Up</BrandLink>
        </div>
      </form>
    </div>
  );
}
