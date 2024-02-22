"use client";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormMessage,
} from "@/src/components/ui/form";
import Link from "next/link";
import Image from "next/image";
import DocCollabLogo from "@/public/DocCollabLogo.svg";
import { Input } from "@/src/components/ui/input";
import { Button } from "@/src/components/ui/button";
import Loader from "@/src/components/global/Loader";
import { actionForgotPassword } from "@/src/lib/server-actions/auth-actions";
import { Alert, AlertDescription, AlertTitle } from "@/src/components/ui/alert";
import { MailCheck } from "lucide-react";

const ForgotPasswordFormSchema = z.object({
  email: z.string().describe("Email").email({ message: "Invalid Email" }),
});

const ForgotPasswordPage = () => {
  const router = useRouter();
  const [submitError, setSubmitError] = useState("");
  const [confirmation, setConfirmation] = useState(false);
  const form = useForm<z.infer<typeof ForgotPasswordFormSchema>>({
    mode: "onChange",
    resolver: zodResolver(ForgotPasswordFormSchema),
    defaultValues: { email: "" },
  });

  const isLoading = form.formState.isSubmitting;
  const onSubmit: SubmitHandler<
    z.infer<typeof ForgotPasswordFormSchema>
  > = async (formData) => {
    const { error } = await actionForgotPassword(formData);
    if (error) {
      form.reset();
      setSubmitError(error.message);
      return;
    }
    setConfirmation(true);
  };
  return (
    <Form {...form}>
      <form
        onChange={() => {
          if (submitError) setSubmitError("");
        }}
        onSubmit={form.handleSubmit(onSubmit)}
        className="w-full sm:justify-center sm:w-[400px] space-y-6 flex flex-col"
      >
        <Link
          href="/"
          className="
        w-full
        flex
        justify-left
        items-center"
        >
          <Image
            src={DocCollabLogo}
            alt="DocCollab Logo"
            width={50}
            height={50}
          />
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
        <FormField
          disabled={isLoading}
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input type="email" placeholder="Email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {submitError && <FormMessage>{submitError}</FormMessage>}

        {confirmation ? (
          <>
            <Alert className="bg-primary cursor-not-allowed">
              <MailCheck className="h-4 w-4" />
              <AlertTitle>Check your email.</AlertTitle>
              <AlertDescription>
                A password reset email has been sent.
              </AlertDescription>
            </Alert>
          </>
        ) : (
          <Button
            type="submit"
            className="w-full p-6"
            size="lg"
            disabled={isLoading}
          >
            {!isLoading ? "Forgot Password" : <Loader />}
          </Button>
        )}
      </form>
    </Form>
  );
};

export default ForgotPasswordPage;
