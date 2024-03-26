import { useNavigation } from "@remix-run/react";
import React, { useEffect, useMemo } from "react";

// language=JavaScript
const hydrationUtil = `
    window.waitUntilHydrated = new Promise(resolve =>
          window.hydrated ? resolve() : window.addEventListener("hydrated", resolve)
    );
`;

/** a hook that lets everyone know when the page is done hydrating **/
export function HydrationUtils() {
  const navigation = useNavigation();
  const isBrowser = typeof window !== "undefined";
  const isHydrated = isBrowser && window.hydrated;

  useEffect(() => {
    if (!isBrowser || isHydrated || navigation.state !== "idle") return;
    window.hydrated = true;
    setTimeout(() => {
      window.dispatchEvent(new Event("hydrated"));
    });
  }, [isBrowser, isHydrated, navigation.state]);

  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: hydrationUtil }} />
    </>
  );
}

let hydrated = false;

export function useHydratedMemo() {
  useEffect(() => {
    hydrated = true;
  }, []);
  return useMemo(() => hydrated, []);
}
