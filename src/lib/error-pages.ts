export const ERROR_PAGES = {
  "400": { label: "Invalid request", title: "Something in that link isn’t right.", description: "The request could not be understood. Open the page again from your study space, or check the link for a typo.", icon: "file", action: "home" },
  "401": { label: "Sign-in required", title: "Your study space is waiting.", description: "Sign in to continue. If you were already signed in, your session may have expired.", icon: "lock", action: "login" },
  "403": { label: "Access restricted", title: "This page isn’t available to your account.", description: "You may need a different account or permission to open this page. Your other study materials are still available.", icon: "shield", action: "home" },
  "404": { label: "Page not found", title: "A little off the syllabus.", description: "We couldn’t find this page. The link may have changed, or the resource may no longer be available. Let’s get you back to learning.", icon: "book", action: "resources" },
  "408": { label: "Request timed out", title: "That took a little too long.", description: "The connection timed out before the page could load. Check your connection and give it another try.", icon: "clock", action: "retry" },
  "410": { label: "Resource removed", title: "This chapter has closed.", description: "This resource is no longer available at this address. Browse the resource library for current study materials.", icon: "book", action: "resources" },
  "429": { label: "Too many requests", title: "Let’s take a short pause.", description: "There have been too many requests in a short time. Wait a moment before trying again.", icon: "clock", action: "retry" },
  "500": { label: "Something went wrong", title: "A small interruption in your studies.", description: "We couldn’t load this page. Try again, or return to your study space and pick up from there.", icon: "tools", action: "retry" },
  "502": { label: "Connection interrupted", title: "We couldn’t reach the next step.", description: "A service we depend on returned an unexpected response. Please try again shortly.", icon: "cloud", action: "retry" },
  "503": { label: "Temporarily unavailable", title: "We’ll be back in a moment.", description: "This part of neoPathshala is temporarily unavailable. Please try again shortly, or contact us if the problem continues.", icon: "tools", action: "retry" },
  "504": { label: "Service timed out", title: "We’re waiting on a connection.", description: "A service took too long to respond. Give it a moment, then try loading the page again.", icon: "clock", action: "retry" },
  offline: { label: "You’re offline", title: "A pause, until you’re connected.", description: "Check your Wi-Fi or mobile data, then try again. Saved contact details are available offline after you’ve visited the contact page online.", icon: "wifi", action: "retry" },
} as const;

export type ErrorCode = keyof typeof ERROR_PAGES;
export function isErrorCode(value: string): value is ErrorCode {
  return Object.prototype.hasOwnProperty.call(ERROR_PAGES, value);
}
