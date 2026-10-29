export const authPolicyKey = 'platform:student-auth:v1';
export const authPolicyBooleanKeys = ['studentTwoFactor', 'studentTwoFactorRequired', 'studentRecoveryCodes', 'passwordLogin', 'otpLogin', 'passwordReset', 'loginRateLimit', 'otpSendRateLimit', 'passwordRequireMixedCase', 'passwordRequireNumber', 'passwordRequireSymbol', 'revokeOtherSessionsOnPasswordChange'] as const;
export const authPolicyNumberRules = {
 passwordMinLength: [12, 64], otpExpiryMinutes: [2, 30], otpResendSeconds: [15, 300],
 otpHourlyLimit: [1, 50], otpGlobalHourlyLimit: [10, 10000], verificationAttempts: [3, 10],
 loginRequestsPerIP: [10, 500], passwordAttemptsPerEmail: [5, 100],
} as const;
export type AuthPolicy = {devicePolicy: string} & Record<typeof authPolicyBooleanKeys[number], boolean> & Record<keyof typeof authPolicyNumberRules, number>;
export function defaultAuthPolicy(): AuthPolicy {
 return {devicePolicy:"1_web_1_app",studentTwoFactor:true,studentTwoFactorRequired:false,studentRecoveryCodes:true,passwordLogin:false, otpLogin:true, passwordReset:true, loginRateLimit:true, otpSendRateLimit:true,
 passwordRequireMixedCase:false, passwordRequireNumber:false, passwordRequireSymbol:false, revokeOtherSessionsOnPasswordChange:true,
 passwordMinLength:14, otpExpiryMinutes:10, otpResendSeconds:60, otpHourlyLimit:5, otpGlobalHourlyLimit:100,
 verificationAttempts:5, loginRequestsPerIP:60, passwordAttemptsPerEmail:20};
}
export function parseAuthPolicy(input: unknown): AuthPolicy {
 if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Choose valid sign-in settings.');
 const value = {...defaultAuthPolicy(), ...input} as Record<string, unknown>;
 const result = {} as AuthPolicy;
 if (typeof value.devicePolicy !== 'string' || !/^(1_web_1_app|1_device_only|unlimited|custom:([1-9]|[1-9][0-9]|100))$/.test(value.devicePolicy)) throw new Error('Choose a valid device limit (1–100).');
 result.devicePolicy = value.devicePolicy;
 for (const key of authPolicyBooleanKeys) {
  if (typeof value[key] !== 'boolean') throw new Error('Choose valid sign-in settings.');
  result[key] = value[key] as boolean;
 }
 for (const key of Object.keys(authPolicyNumberRules) as (keyof typeof authPolicyNumberRules)[]) {
  const [minimum, maximum] = authPolicyNumberRules[key];
  if (!Number.isInteger(value[key]) || Number(value[key]) < minimum || Number(value[key]) > maximum) throw new Error(`Choose ${key.replace(/([A-Z])/g, ' $1').toLowerCase()} between ${minimum} and ${maximum}.`);
  result[key] = value[key] as number;
 }
 if(result.studentTwoFactorRequired&&!result.studentTwoFactor)throw new Error('Keep student authenticator apps enabled when 2FA is required.');
 if (!result.passwordLogin && !result.otpLogin) throw new Error('Keep at least one sign-in method enabled.');
 if (!result.otpLogin && !result.passwordReset) throw new Error('Keep email recovery enabled when email-code sign-in is disabled.');
 if (result.otpGlobalHourlyLimit < result.otpHourlyLimit) throw new Error('Choose a platform code quota at least as large as the per-email quota.');
 return result;
}
export function passwordPolicyError(password: string, policy: AuthPolicy): string | null {
 if (password.length < policy.passwordMinLength || password.length > 256) return `Use a password between ${policy.passwordMinLength} and 256 characters.`;
 if (policy.passwordRequireMixedCase && (!/[a-z]/.test(password) || !/[A-Z]/.test(password))) return 'Use a password with uppercase and lowercase letters.';
 if (policy.passwordRequireNumber && !/[0-9]/.test(password)) return 'Use a password with a number.';
 if (policy.passwordRequireSymbol && !/[^a-zA-Z0-9\s]/.test(password)) return 'Use a password with a symbol.';
 return null;
}
