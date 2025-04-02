"use client";

import { signUpSchema } from '@/lib/validation';
import AuthForm from '@/components/AuthForm';
import { signUp } from '@/lib/action/auth';

export default function page() {
  return (
    <div>
      <AuthForm 
        type='SIGN_UP'
        schema={signUpSchema}
        defaultValues={{
          email: "",
          password: "",
          fullName: "",
          universityId: 0,
          universityCard: ""
        }}
        onSubmit={signUp}
      />
    </div>
  );
};
