import { SignIn } from '@clerk/nextjs';

export default function LoginPage() {
  return (
    <div className="flex h-dvh w-screen items-start pt-12 md:pt-0 md:items-center justify-center bg-background">
      <SignIn 
        appearance={{
          elements: {
            rootBox: "mx-auto",
            card: "bg-background border border-border shadow-lg",
          },
        }}
        routing="hash"
        signUpUrl="/register"
        fallbackRedirectUrl="/"
      />
    </div>
  );
}
