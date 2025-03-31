"use client";

import AuthForm from '@/components/AuthForm';
import { signInSchema } from '@/lib/validation';

export default function page() {
  return (
    <div className='flex justify-center my-5'>
      <AuthForm 
        type='SIGN_IN'
        schema={signInSchema}
        defaultValues={{
          email: "",
          password: ""
        }}
        onSubmit={() => {}}
      />
    </div>
  )
}
