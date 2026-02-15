import { SignInForm } from "@/components/auth/SignInForm";
import { absoluteUrl } from "@/lib/seo";
import { type Metadata } from "next";

type SignInPageProps = {
  searchParams: Promise<{
    redirect?: string;
  }>;
};

const resolveCallbackUrl = (candidate?: string) => {
  if (!candidate) {
    return "/";
  }

  if (!candidate.startsWith("/") || candidate.startsWith("//")) {
    return "/";
  }

  return candidate;
};

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to manage your saved recipes.",
  alternates: {
    canonical: "/sign-in",
  },
  robots: {
    index: false,
    follow: false,
  },
  openGraph: {
    type: "website",
    url: absoluteUrl("/sign-in"),
    title: "Sign In | Recipe Hub",
    description: "Sign in to manage your saved recipes.",
  },
};

export default async function SignInPage({
  searchParams,
}: Readonly<SignInPageProps>) {
  const params = await searchParams;
  const callbackUrl = resolveCallbackUrl(params.redirect);

  return <SignInForm callbackUrl={callbackUrl} />;
}
