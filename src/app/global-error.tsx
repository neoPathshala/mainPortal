"use client";

import { ErrorPage } from "@/components/errors/ErrorPage";

export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  return <html lang="en"><head><title>Something went wrong | neoPathshala</title><meta name="viewport" content="width=device-width, initial-scale=1" /><meta name="robots" content="noindex" /></head><body style={{ margin: 0 }}><ErrorPage code="500" standalone reference={error.digest} error={error} /></body></html>;
}
