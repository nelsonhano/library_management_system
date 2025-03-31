"use client";

import { signUpSchema } from '@/lib/validation';
import AuthForm from '@/components/AuthForm';

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
        onSubmit={() => {}}
      />
    </div>
  );
};
