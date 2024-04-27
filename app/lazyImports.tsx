import React from "react";
import { ClientOnly } from "remix-utils";
import LoadingFallback from "./loadingfallback";

export function ClientOnlySuspense({
  children,
}: {
  children: () => React.ReactNode;
}) {
  return (
    <ClientOnly fallback={<LoadingFallback />}>
      {() => {
        return (
          <React.Suspense fallback={<LoadingFallback />}>
            {children()}
          </React.Suspense>
        );
      }}
    </ClientOnly>
  );
}
