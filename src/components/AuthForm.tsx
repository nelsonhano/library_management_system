"use client";

import { z, ZodType } from "zod";
import { zodResolver } from "@hookform/resolvers/zod"
import { DefaultValues, FieldValues, Path, SubmitHandler, useForm, UseFormReturn } from "react-hook-form";

interface AuthFormProps<T extends FieldValues>{
  schema: ZodType<T>;
  defaultValues: T;
  onSubmit: (data: T) => Promise<{success: boolean; error?: string }>;
  type: "SIGN_IN" | "SIGN_UP"
};

import { Button } from "@/components/ui/button";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormControl,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { FIELD_NAMES, FIELD_TYPES } from "@/constants";
import ImageUpload from "./ImageUpload";


const AuthForm = <T extends FieldValues>({ 
  type, 
  schema, 
  defaultValues, 
  onSubmit 
}: AuthFormProps<T>) => {
  const isSignIn = type === "SIGN_IN";

  const form: UseFormReturn<T> = useForm({
    resolver: zodResolver(schema),
    defaultValues: defaultValues as DefaultValues<T>,
  });

  const handleSubmit:SubmitHandler<T> = (data) => {
    console.log(data);
  };

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold text-white">
        { isSignIn ? "Welcome back to BookWise" : "Create your library account" }
      </h1>
      <p className="text-lime-100">
        {isSignIn ? 
        "Access the vast collection of resources, and stay updated":
        "Please complete all fields and upload a valid university ID to gain access to the librart"}
      </p>
      <Form {...form}>
        <form 
          onSubmit={form.handleSubmit(handleSubmit)} 
          className="space-y-6 w-full"
        >
          {Object.keys(defaultValues).map((eachField) => (
            <FormField
              key={eachField}
              control={form.control}
              name={eachField as Path<T>}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="capitalize">
                    {FIELD_NAMES[eachField as keyof typeof FIELD_NAMES]}
                  </FormLabel>
                  <FormControl>
                    {field.name === "universityCard" ? 
                    <ImageUpload 
                      onFileChange={field.onChange}
                    /> : 
                    <Input
                      required 
                      {...field}
                      type={
                          FIELD_TYPES[eachField as keyof typeof FIELD_TYPES]
                        }
                      className="form-input"
                    />
                    } 
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          ))}

        <Button 
          className="form-btn" 
          type="submit"
        >
          {isSignIn ? "Sign in" : "Sign up"}
        </Button>
        </form>
      </Form>

      <p className="text-center text-base font-medium">
        {isSignIn ? "New to BookWise? " : "Already have an account? "}

        <Link
          className="font-bold text-lime-100 underline" 
          href={isSignIn ? "/sign-up" : "sign-in"} 
        >
          {isSignIn ? "Create an account" : "Sign in"}
        </Link>
      </p>
    </div>
  );
};

export default AuthForm;

