/** biome-ignore-all lint/correctness/useUniqueElementIds: needed */

import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { TbEye, TbEyeClosed } from "react-icons/tb";

import { Button } from "@/components/ui/button";
import { Input, InputAddon } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BrandLink } from "@/components/ui/styled-texts";

export const Route = createFileRoute("/auth/reset-password")({
  component: ResetPwdPage,
});

function ResetPwdPage() {
  const [isPwdVisible, setIsPwdVisible] = useState(false);
  const [isConfirmPwdVisible, setIsConfirmPwdVisible] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="font-bold font-roboto text-3xl">Reset Password</h1>
        <p>
          {`Enter your new password below. Make sure to choose a strong password
          that you haven't used before.`}
        </p>
      </div>

      <form className="flex flex-col gap-4">
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
        </div>

        {/* Confirm Password */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="confirmPassword">Confirm Password</Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              type={isConfirmPwdVisible ? "text" : "password"}
            />
            <InputAddon
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
        </div>

        <Button className="mt-2">Reset Password</Button>

        <div className="self-center text-center text-neutral-600 text-sm dark:text-neutral-400">
          Remembered your password?{" "}
          <BrandLink to="/auth/sign-in">Sign In</BrandLink>
        </div>
      </form>
    </div>
  );
}
