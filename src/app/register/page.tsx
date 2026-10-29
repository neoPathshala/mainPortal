import { Metadata } from "next";
import { AuthPageClient } from "@/components/auth/AuthPageClient";

export const metadata: Metadata = {
  title: "Create Student Account | neoPathshala Academic Hub",
  description:
    "Register for a free neoPathshala account with 6-digit instant OTP verification to bookmark resources, track academic progress, and access lab repositories.",
};

export default function RegisterPage() {
  return <AuthPageClient initialMode="register" portalType="academic" />;
}
