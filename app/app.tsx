import type { FormEvent } from "react";
import React, { useEffect, useRef } from "react";
import { withSentry } from "@sentry/remix";

import type {
  ShouldRevalidateFunction,
  V2_MetaFunction,
} from "@remix-run/react";
import {
  Form,
  useActionData,
  useFetcher,
  useLoaderData,
  useSearchParams,
  useSubmit,
} from "@remix-run/react";
import {
  applyTransform,
  getTransforms,
  links as baseLinks,
  RenderedChildren,
} from "~/base";
import type { ActionArgs, LinksFunction, LoaderArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import process from "process";
import path from "path";
import { handleRedirectResponse } from "~/handleRedirect";
import { useEventSourceNullOk } from "~/event-source";
import { useDebouncedCallback } from "use-debounce";

import customStyles from "~/styles/custom.css";
import appStyles from "~/styles/app.css";

export const meta: V2_MetaFunction = ({ data }) => {
  return data.meta ?? [];
};

export const links: LinksFunction = () => {
  return [
    {
      rel: "stylesheet",
      href: "https://cdn.jsdelivr.net/npm/bootstrap@5.2.3/dist/css/bootstrap.min.css",
      integrity:
        "sha384-rbsA2VBKQhggwzxH7pPCaAqO46MgnOM80zW1RWuH61DGLwZJEdK2Kadq2F9CUG65",
      crossOrigin: "anonymous",
    },
    {
      rel: "stylesheet",
      href: "https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism.min.css",
      crossOrigin: "anonymous",
      referrerPolicy: "no-referrer",
    },
    {
      rel: "stylesheet",
      href: "https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/plugins/toolbar/prism-toolbar.min.css",
      crossOrigin: "anonymous",
      referrerPolicy: "no-referrer",
    },
    ...baseLinks(),
    { rel: "stylesheet", href: customStyles },
    { rel: "stylesheet", href: appStyles },
  ];
};

export async function loader({ params, request }: LoaderArgs) {
  return await callServer({ body: {}, params, request });
}

export async function action({ params, request }: ActionArgs) {
  // parse form data
  const { __gooey_gui_request_body, ...inputs } = Object.fromEntries(
    await request.formData(),
  );
  // parse request body
  const {
    transforms,
    state,
    ...body
  }: {
    transforms: Record<string, string>;
    state: Record<string, any>;
  } & Record<string, any> = JSON.parse(__gooey_gui_request_body.toString());
  // apply transforms
  for (let [field, inputType] of Object.entries(transforms)) {
    let toJson = applyTransform[inputType];
    if (!toJson) continue;
    inputs[field] = toJson(inputs[field]);
  }
  // update state with new form data
  body.state = { ...state, ...inputs };
  return callServer({ body, params, request });
}

async function callServer({
  body,
  params,
  request,
}: {
  body: Record<string, any>;
  params: Record<string, any>;
  request: Request;
}) {
  const requestUrl = new URL(request.url);
  const serverUrl = new URL(process.env["SERVER_HOST"]!);
  serverUrl.pathname = path.join(serverUrl.pathname, params["*"] ?? "");
  serverUrl.search = requestUrl.search;

  request.headers.set("Content-Type", "application/json");
  request.headers.delete("Host");

  const response = await fetch(serverUrl, {
    method: "POST",
    redirect: "manual",
    body: JSON.stringify(body),
    headers: request.headers,
  });

  const redirectUrl = handleRedirectResponse({ response });
  if (redirectUrl) {
    return redirect(redirectUrl, {
      headers: response.headers,
      status: response.status,
      statusText: response.statusText,
    });
  }

  if (!response.ok) {
    return await handleErrorResponse({ request, response }); 
  }

  return response;
}

async function handleErrorResponse({ request, response }) {
  const serverUrl = new URL(process.env["SERVER_HOST"]!);
  serverUrl.pathname = path.join(serverUrl.pathname, "/handleError/");

  let errorResponse = await fetch(serverUrl, {
    method: "POST",
    body: JSON.stringify({
        "status": response.status,
        "statusText": response.statusText,
    }),
    headers: request.headers,
  });

  const redirectUrl = handleRedirectResponse({ response: errorResponse });
  if (redirectUrl) {
    return redirect(redirectUrl, {
      headers: errorResponse.headers,
      status: errorResponse.status,
      statusText: errorResponse.statusText,
    });
  }

  return new Response(errorResponse.body, {
    headers: errorResponse.headers,
    status: response.status,
    statusText: errorResponse.statusText,
  });
}

export const shouldRevalidate: ShouldRevalidateFunction = (args) => {
  if (
    args.formMethod === "POST" &&
    args.currentUrl.toString() === args.nextUrl.toString()
  ) {
    return false;
  }
  if (typeof window !== "undefined") {
    // @ts-ignore
    window.hydrated = false;
  }
  return args.defaultShouldRevalidate;
};

function useRealtimeChannels({ channels }: { channels: string[] }) {
  let url;
  if (channels.length) {
    const params = new URLSearchParams(
      channels.map((name) => ["channels", name]),
    );
    url = `/__/realtime/?${params}`;
  }
  return useEventSourceNullOk(url);
}

function App() {
  const [searchParams] = useSearchParams();
  const loaderData = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const submit = useSubmit();
  const { children, state, channels } = actionData ?? loaderData;
  const formRef = useRef<HTMLFormElement>(null);
  const realtimeEvent = useRealtimeChannels({ channels });
  const fetcher = useFetcher();

  useEffect(() => {
    if (realtimeEvent && fetcher.state === "idle" && formRef.current) {
      submit(formRef.current);
    }
  }, [fetcher.state, realtimeEvent, submit]);

  const debouncedSubmit = useDebouncedCallback(submit, 500);

  const handleChange = (event: FormEvent<HTMLFormElement>) => {
    let target = event.target;
    // debounce based on input type - generally text inputs are slow, everything else is fast
    if (
      (target instanceof HTMLInputElement && target.type === "text") ||
      target instanceof HTMLTextAreaElement
    ) {
      debouncedSubmit(event.currentTarget);
    } else if (target instanceof HTMLInputElement && target.type === "number" && document.activeElement === target) {
      // number inputs have annoying limits and step sizes that make them hard to edit unless we postpone autocorrection until focusout
      // debounce does not work here because the step size prevents key intermediate states while typing
      const submitTarget = event.currentTarget;
      target.addEventListener("focusout", function() {
        submit(submitTarget);
      }, {once : true});
    } else {
      submit(event.currentTarget);
    }
  };

  const transforms = getTransforms({ children });

  return (
    <div data-prismjs-copy="📋 Copy" data-prismjs-copy-success="✅ Copied!">
      <Form
        ref={formRef}
        id={"gooey-form"}
        action={"?" + searchParams}
        method="POST"
        onChange={handleChange}
        noValidate
      >
        <RenderedChildren
          children={children}
          onChange={() => {
            if (formRef.current) submit(formRef.current);
          }}
          state={state}
        />
        <input
          type="hidden"
          name="__gooey_gui_request_body"
          value={JSON.stringify({ state, transforms })}
        />
      </Form>
      <script
        async
        defer
        data-manual
        src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-core.min.js"
        integrity="sha512-9khQRAUBYEJDCDVP2yw3LRUQvjJ0Pjx0EShmaQjcHa6AXiOv6qHQu9lCAIR8O+/D8FtaCoJ2c0Tf9Xo7hYH01Q=="
        crossOrigin="anonymous"
        referrerPolicy="no-referrer"
      />
      <script
        async
        defer
        src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/plugins/autoloader/prism-autoloader.min.js"
        integrity="sha512-SkmBfuA2hqjzEVpmnMt/LINrjop3GKWqsuLSSB3e7iBmYK7JuWw4ldmmxwD9mdm2IRTTi0OxSAfEGvgEi0i2Kw=="
        crossOrigin="anonymous"
        referrerPolicy="no-referrer"
      />
      <script
        async
        defer
        src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/plugins/toolbar/prism-toolbar.min.js"
        integrity="sha512-st608h+ZqzliahyzEpETxzU0f7z7a9acN6AFvYmHvpFhmcFuKT8a22TT5TpKpjDa3pt3Wv7Z3SdQBCBdDPhyWA=="
        crossOrigin="anonymous"
        referrerPolicy="no-referrer"
      />
      <script
        async
        defer
        src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/plugins/copy-to-clipboard/prism-copy-to-clipboard.min.js"
        integrity="sha512-/kVH1uXuObC0iYgxxCKY41JdWOkKOxorFVmip+YVifKsJ4Au/87EisD1wty7vxN2kAhnWh6Yc8o/dSAXj6Oz7A=="
        crossOrigin="anonymous"
        referrerPolicy="no-referrer"
      />
    </div>
  );
}

export default withSentry(App);
