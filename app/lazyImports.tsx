import React, { lazy } from "react";
import { ClientOnly } from "remix-utils";
import LoadingFallback from "./loadingfallback";

export function lazyImport<T>(loader: () => Promise<T>): T {
  return new Proxy(
    {},
    {
      get: (_, prop) => {
        const Component = lazy(() => {
          return loader().then((mod: any) => {
            if (prop == "default") {
              return mod;
            } else {
              return { default: mod[prop] };
            }
          });
        });

        return (props: any) => {
          return (
            <ClientOnlySuspense>
              {() => <Component {...props} />}
            </ClientOnlySuspense>
          );
        };
      },
    }
  ) as T;
}

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
