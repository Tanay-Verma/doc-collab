"use client";
import { Button } from "@/src/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormMessage,
} from "@/src/components/ui/form";
import { Input } from "@/src/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import clsx from "clsx";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import Logo from "@/public/DocCollabLogo.svg";
import Loader from "@/src/components/global/Loader";
import { Alert, AlertDescription, AlertTitle } from "@/src/components/ui/alert";
import { KeyRound, MailCheck } from "lucide-react";
import { FormSchema } from "@/src/lib/types";
import {
  actionResetPassword,
  actionSignUpUser,
} from "@/src/lib/server-actions/auth-actions";

const ResetPasswordFormSchema = z
  .object({
    password: z
      .string()
      .describe("Password")
      .min(6, "Password must be minimum 6 characters"),
    confirmPassword: z
      .string()
      .describe("Confirm Password")
      .min(6, "Password must be minimum 6 characters"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

const ResetPasswordPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [submitError, setSubmitError] = useState("");
  const [confirmation, setConfirmation] = useState(false);
  const [timerValue, setTimerValue] = useState(10);
  const timerRef = useRef<NodeJS.Timeout>();

  const form = useForm<z.infer<typeof ResetPasswordFormSchema>>({
    mode: "onChange",
    resolver: zodResolver(ResetPasswordFormSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  const isLoading = form.formState.isSubmitting;
  const onSubmit = async ({
    password,
  }: Pick<z.infer<typeof FormSchema>, "password">) => {
    const { error } = await actionResetPassword({ password });
    if (error) {
      setSubmitError(error.message);
      form.reset();
      return;
    }
    setConfirmation(true);
  };

  useEffect(() => {
    if (confirmation) {
      timerRef.current = setInterval(() => {
        setTimerValue((prevValue) => prevValue - 1);
      }, 1000);
    }

    if (timerValue === 0) {
      clearInterval(timerRef.current);
      console.log("Redirecting to dashboard...");
      router.replace("/dashboard");
    }

    return () => clearInterval(timerRef.current);
  }, [confirmation, router, timerValue]);

  return (
    <Form {...form}>
      <form
        onChange={() => {
          if (submitError) setSubmitError("");
        }}
        onSubmit={form.handleSubmit(onSubmit)}
        className="w-full sm:justify-center sm:w-[400px]
      space-y-6 flex
      flex-col"
      >
        <Link
          href="/"
          className="
        w-full
        flex
        justify-left
        items-center"
        >
          <Image src={Logo} alt="DocCollab Logo" width={50} height={50} />
          <span
            className="font-semibold
            dark:text-white text-4xl first-letter:ml-2"
          >
            Doc Collab.
          </span>
        </Link>
        <FormDescription
          className="
        text-foreground/60"
        >
          An all-In-One Collaboration and Productivity Platform
        </FormDescription>
        {!confirmation && (
          <>
            <FormField
              disabled={isLoading}
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input type="password" placeholder="Password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              disabled={isLoading}
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Confirm Password"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full p-6" disabled={isLoading}>
              {!isLoading ? "Reset Password" : <Loader />}
            </Button>
          </>
        )}
        {submitError && <FormMessage>{submitError}</FormMessage>}
        {confirmation && (
          <>
            <Alert className="bg-primary cursor-not-allowed">
              <KeyRound />
              <AlertTitle>Password reset was successful</AlertTitle>
              <AlertDescription>
                Redirecting to the dashboard in {timerValue}
              </AlertDescription>
            </Alert>
          </>
        )}
      </form>
    </Form>
  );
};

export default ResetPasswordPage;
