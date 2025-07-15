import { SignUp } from '@clerk/nextjs';

export default function RegisterPage() {
  return (
    <div className="flex h-dvh w-screen items-start pt-12 md:pt-0 md:items-center justify-center bg-background">
      <SignUp 
        appearance={{
          elements: {
            rootBox: "mx-auto",
            card: "bg-background border border-border shadow-lg",
          },
        }}
        routing="hash"
        signInUrl="/login"
        redirectUrl="/onboarding/welcome"
        afterSignUpUrl="/onboarding/welcome"
      />
    </div>
  );
}
