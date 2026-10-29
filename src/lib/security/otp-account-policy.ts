type Account = { role: string; status: string; emergencyLockdown: boolean } | null;
export function canStudentSignIn(account: Account): boolean {
  return !!account && account.role === "STUDENT" && ["Active", "Verified"].includes(account.status) && !account.emergencyLockdown;
}
export function otpAccountPolicy(account: Account, purpose: string): { allowed: true } | { allowed: false; status: string; message: string } {
  if (!["register", "login", "reset"].includes(purpose)) return { allowed: false, status: "invalid_request", message: "Invalid request." };
  if (purpose === "register") {
    if (account) return { allowed: false, status: "already_registered", message: "This email is already registered. Please sign in." };
    return { allowed: true };
  }
  if (!account) return { allowed: false, status: "not_registered", message: "Account not registered. Please create an account first." };
  if (!canStudentSignIn(account)) return { allowed: false, status: "account_unavailable", message: "This account cannot sign in. Please contact support." };
  return { allowed: true };
}

// Account rejection must happen before reserving OTP quota or invoking SMTP.
export async function withEligibleOtpAccount<T>(account: Account, purpose: string, deliver: () => Promise<T>) {
  const policy = otpAccountPolicy(account, purpose);
  if (!policy.allowed) return { eligible: false as const, ...policy };
  return { eligible: true as const, result: await deliver() };
}
