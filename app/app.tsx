import { withSentry } from "@sentry/remix";
import { useEffect, useRef } from "react";

import {
  ActionArgs,
  json,
  LinksFunction,
  LoaderArgs,
  redirect,
} from "@remix-run/node";
import type {
  ShouldRevalidateFunction,
  V2_MetaFunction,
} from "@remix-run/react";
import {
  Form,
  useActionData,
  useFetcher,
  useLoaderData,
  useNavigate,
  useSearchParams,
  useSubmit,
} from "@remix-run/react";
import path from "path";
import { useDebouncedCallback } from "use-debounce";
import { applyTransform, getTransforms, RenderedChildren } from "~/renderer";
import { useEventSourceNullOk } from "~/event-source";
import { handleRedirectResponse } from "~/handleRedirect";

import { gooeyGuiRouteHeader } from "~/consts";
import appStyles from "~/styles/app.css";
import customStyles from "~/styles/custom.css";
import settings from "./settings";

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
    ...require("~/dataTable.styles").links(),
    ...require("~/gooeyFileInput.styles").links(),
    ...require("~/components/GooeyPopover.styles").links(),
    { rel: "stylesheet", href: customStyles },
    { rel: "stylesheet", href: appStyles },
  ];
};

export async function loader({ request }: LoaderArgs) {
  return await callServer({ request });
}

export async function action({ request }: ActionArgs) {
  // proxy
  let contentType = request.headers.get("Content-Type");
  if (!contentType?.startsWith("application/x-www-form-urlencoded")) {
    let body = await request.arrayBuffer();
    return callServer({ request, body });
  }
  // proxy
  let body = await request.text();
  let formData = new URLSearchParams(body);
  if (!formData.has("__gooey_gui_request_body")) {
    return callServer({ request, body });
  }

  // parse request body
  let { __gooey_gui_request_body, ...inputs } = Object.fromEntries(formData);
  const {
    transforms,
    state,
    ...jsonBody
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
  jsonBody.state = { ...state, ...inputs };
  request.headers.set("Content-Type", "application/json");
  return callServer({ request, body: JSON.stringify(jsonBody) });
}

async function callServer({
  request,
  body,
}: {
  request: Request;
  body?: BodyInit | null;
}) {
  const requestUrl = new URL(request.url);
  const serverUrl = new URL(settings.SERVER_HOST!);
  serverUrl.pathname = path.join(serverUrl.pathname, requestUrl.pathname ?? "");
  serverUrl.search = requestUrl.search;

  request.headers.delete("Host");
  request.headers.set(gooeyGuiRouteHeader, "1");

  let response = await fetch(serverUrl, {
    method: request.method,
    redirect: "manual",
    body: body,
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

  if (response.headers.get(gooeyGuiRouteHeader)) {
    return response;
  } else {
    return json({
      base64Body: Buffer.from(await response.arrayBuffer()).toString("base64"),
      headers: Object.fromEntries(response.headers),
      status: response.status,
      statusText: response.statusText,
    });
  }
}

export const shouldRevalidate: ShouldRevalidateFunction = (args) => {
  if (
    // don't revalidate if its a form submit with successful response
    args.actionResult &&
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

function useRealtimeChannels({
  channels,
}: {
  channels: string[] | undefined | null;
}) {
  let url;
  if (channels && channels.length) {
    const params = new URLSearchParams(
      channels.map((name) => ["channels", name])
    );
    url = `/__/realtime/?${params}`;
  }
  return useEventSourceNullOk(url);
}

export type OnChange = (event?: {
  target: EventTarget | HTMLElement | null | undefined;
  currentTarget?: EventTarget | HTMLElement | null | undefined;
}) => void;

function base64Decode(base64EncodedString: string): string {
  return new TextDecoder().decode(
    Uint8Array.from(atob(base64EncodedString), (m) => m.charCodeAt(0))
  );
}

function App() {
  const [searchParams] = useSearchParams();
  const loaderData = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const { base64Body, children, state, channels } = actionData ?? loaderData;
  const formRef = useRef<HTMLFormElement>(null);
  const realtimeEvent = useRealtimeChannels({ channels });
  const fetcher = useFetcher();
  const submit = useSubmit();
  const navigate = useNavigate();

  if (typeof window !== "undefined") {
    // @ts-ignore
    window.gui = {
      session_state: state,
      navigate,
      fetcher,
      submit() {
        if (formRef.current) submit(formRef.current, ...arguments);
      },
      rerun() {
        if (formRef.current) submit(formRef.current);
      },
    };
  }

  useEffect(() => {
    if (!base64Body) return;
    let body = base64Decode(base64Body);
    let frag = document.createRange().createContextualFragment(body);
    document.documentElement.innerHTML = "";
    document.documentElement.appendChild(frag);
  }, [base64Body]);

  useEffect(() => {
    if (realtimeEvent && fetcher.state === "idle" && formRef.current) {
      submit(formRef.current);
    }
  }, [fetcher.state, realtimeEvent, submit]);

  const debouncedSubmit = useDebouncedCallback((form: HTMLFormElement) => {
    form.removeAttribute("debounceInProgress");
    submit(form);
  }, 500);

  const onChange: OnChange = (event) => {
    const target = event?.target;
    const form = event?.currentTarget || formRef?.current;
    if (!(form && form instanceof HTMLFormElement)) return;

    // ignore elements that have `data-submit-disabled` set
    if (
      target instanceof HTMLElement &&
      target.hasAttribute("data-submit-disabled")
    ) {
      return;
    }

    // debounce based on input type - generally text inputs are slow, everything else is fast
    if (
      (target instanceof HTMLInputElement && target.type === "text") ||
      target instanceof HTMLTextAreaElement
    ) {
      form.setAttribute("debounceInProgress", "true");
      debouncedSubmit(form);
    } else if (
      target instanceof HTMLInputElement &&
      target.type === "number" &&
      document.activeElement === target
    ) {
      // number inputs have annoying limits and step sizes that make them hard to edit unless we postpone autocorrection until focusout
      // debounce does not work here because the step size prevents key intermediate states while typing
      if (form.getAttribute("debounceInProgress") == "true") return;
      form.setAttribute("debounceInProgress", "true");
      target.addEventListener(
        "focusout",
        function () {
          form.removeAttribute("debounceInProgress");
          submit(form);
        },
        { once: true }
      );
    } else {
      submit(form);
    }
  };

  if (!children) return <></>;

  const transforms = getTransforms({ children });

  return (
    <div data-prismjs-copy="📋 Copy" data-prismjs-copy-success="✅ Copied!">
      <Form
        ref={formRef}
        id={"gooey-form"}
        action={"?" + searchParams}
        method="POST"
        onChange={onChange}
        noValidate
      >
        <RenderedChildren
          children={children}
          onChange={onChange}
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
