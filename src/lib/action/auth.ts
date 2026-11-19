"use server";

import { redirect } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { users } from "@/database/schema";
import workFlowClient from "../workFlow";
import { db } from "@/database/drizzle";
import { signIn } from "../../../auth";
import { headers } from "next/headers";
import ratelimit from "../rateLimit";
import { eq, or } from "drizzle-orm";
import { AuthError } from "next-auth";
import { hash } from "bcryptjs";
import config from "../config";
import { signUpSchema } from "../validation";

const { env: { prodApiEndPoint }} = config;

export const signInWithCredentials = async (
    params: Pick<AuthCredentials, "email"|"password">
) => {
    const { email, password } = params;

    const ip = (await headers()).get("x-forwarded-for") || "127.0.0.1";
    let isRateLimited = false;
    try {
        const { success } = await ratelimit.limit(ip);
        if (!success) isRateLimited = true;
    } catch (error) {
        console.warn("Ratelimit check skipped due to error:", error);
    }
    if (isRateLimited) return redirect("/too-fast");

    try {
        const result = await signIn("credentials", {
            email,
            password,
            redirect: false
        });

        if (result?.error) {
            return { success: false, error: result.error }
        }

        return { success: true }
    } catch (error) {
        if (isRedirectError(error)) throw error;

        // next-auth v5 throws CredentialsSignin for a wrong email or password.
        if (error instanceof AuthError) {
            switch (error.type) {
                case "CredentialsSignin":
                    return { success: false, error: "Invalid email or password" };
                default:
                    return { success: false, error: "Authentication failed. Please check your credentials." };
            }
        }

        console.log(error, "Signin error");
        return { success: false, error: "Signin error" }
    }
};

export const signUp = async (params: AuthCredentials) => {
    // Server actions can be called directly, so validate on the server too.
    const parsed = signUpSchema.safeParse(params);
    if (!parsed.success) {
        return { success: false, error: "Invalid sign up details" }
    }

    const { fullName, email, password, universityId, universityCard } = parsed.data;

    const ip = (await headers()).get("x-forwarded-for") || "127.0.0.1";
    let isRateLimited = false;
    try {
        const { success } = await ratelimit.limit(ip);
        if (!success) isRateLimited = true;
    } catch (error) {
        console.warn("Ratelimit check skipped due to error:", error);
    }
    if (isRateLimited) return redirect("/too-fast");

    const existingUser = await db.select()
    .from(users)
    .where(or(eq(users.email, email), eq(users.universityId, universityId)))
    .limit(1);

    if (existingUser.length > 0) {
        return {
            success: false,
            error: existingUser[0].email === email
                ? "User already exists"
                : "University ID is already registered"
        }
    };

    const hashedPassword = await hash(password, 10);


    try {
        await db.insert(users).values({
            fullName,
            email,
            universityId,
            password: hashedPassword,
            universityCard
        });
    } catch (error) {
        console.log(error, "Signup error");
        return { success: false, error: "Signup error" }
    }

    // The account now exists. A failed onboarding email must not report
    // the whole sign up as failed (the user could never retry: "already exists").
    try {
        await workFlowClient.trigger({
            url: `${prodApiEndPoint}/api/workflows/onboarding`,
            body: {
                email,
                fullName,
            },
        });
    } catch (error) {
        console.log(error, "Onboarding workflow trigger failed");
    }

    await signInWithCredentials({ email, password });

    return { success: true }
};

// export const signIn = async (params: Pick<AuthCredentials>) => { };