import React, { forwardRef, useEffect, useRef, useState } from "react";
import parse, {
  attributesToProps,
  domToReact,
  Element,
  HTMLReactParserOptions,
  Text,
} from "html-react-parser";
import { useHydratedMemo } from "~/useHydrated";
import { Link } from "@remix-run/react";

export const RenderedHTML = forwardRef<
  HTMLSpanElement,
  {
    body: string;
    lineClamp?: number;
    [attr: string]: any;
  }
>(function RenderedHTML({ body, lineClamp, ...attrs }, ref) {
  const {
    renderLocalDt,
    renderLocalDtDateOptions,
    renderLocalDtTimeOptions,
    ...attrs2
  } = attrs;
  const [body2, setBody] = useState(body);

  useEffect(() => {
    if (!renderLocalDt) {
      if (body2 !== body) setBody(body);
      return;
    }
    const date = new Date(renderLocalDt);
    let yearToShow = "";
    if (date.getFullYear() != new Date().getFullYear()) {
      yearToShow = " " + date.getFullYear().toString();
    }
    const localeDateString = date.toLocaleDateString(
      "en-IN",
      renderLocalDtDateOptions,
    );
    const localTimeString = date
      .toLocaleTimeString("en-IN", renderLocalDtTimeOptions)
      .toUpperCase();
    setBody(localeDateString + yearToShow + ", " + localTimeString);
  }, [body, renderLocalDt, renderLocalDtDateOptions, renderLocalDtTimeOptions]);

  const parsedElements = parse(body2, reactParserOptions);
  return (
    <LineClamp lines={lineClamp} key={body.slice(0, 10)}>
      <span ref={ref} className="gui-html-container" {...attrs2}>
        {parsedElements}
      </span>
    </LineClamp>
  );
});

const reactParserOptions: HTMLReactParserOptions = {
  htmlparser2: {
    lowerCaseTags: false,
    lowerCaseAttributeNames: false,
  },
  replace: function (domNode) {
    if (!(domNode instanceof Element && domNode.attribs)) return;

    if (
      domNode.children.length &&
      domNode.children[0] instanceof Element &&
      domNode.children[0].name === "code" &&
      domNode.children[0].attribs.class?.includes("language-")
    ) {
      return (
        <RenderedPrismCode domNode={domNode} options={reactParserOptions} />
      );
    }

    if (typeof domNode.attribs["data-internal-link"] !== "undefined") {
      const href = domNode.attribs.href;
      delete domNode.attribs.href;
      return (
        <Link to={href} {...attributesToProps(domNode.attribs)}>
          {domToReact(domNode.children, reactParserOptions)}
        </Link>
      );
    }

    for (const [attr, value] of Object.entries(domNode.attribs)) {
      if (!attr.startsWith("on")) continue;
      // @ts-ignore
      domNode.attribs[attr] = (event: React.SyntheticEvent) => {
        // eslint-disable-next-line no-new-func
        const fn = new Function("event", value);
        return fn.call(event.currentTarget, event.nativeEvent);
      };
    }

    if (domNode.type === "script") {
      let body = getTextBody(domNode);
      return <InlineScript attrs={domNode.attribs} body={body} />;
    }
  },
};

function LineClamp({
  lines,
  children,
}: {
  lines?: number;
  children: React.ReactNode;
}) {
  const contentRef = useRef<HTMLSpanElement>(null);

  const [isClamped, setClamped] = useState(false);
  const [isExpanded, setExpanded] = useState(false);

  useEffect(() => {
    // Function that should be called on window resize
    function handleResize() {
      if (contentRef && contentRef.current) {
        setClamped(
          contentRef.current.scrollHeight > contentRef.current.clientHeight,
        );
      }
    }

    handleResize();

    // Add event listener to window resize
    window.addEventListener("resize", handleResize);

    // Remove event listener on cleanup
    return () => window.removeEventListener("resize", handleResize);
  }, []); // Empty array ensures that it would only run on mount

  if (!lines) {
    return <>{children}</>;
  }

  return (
    <span
      ref={contentRef}
      style={{
        ...(isExpanded
          ? {}
          : {
              display: "-webkit-box",
              WebkitLineClamp: lines,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              position: "relative",
            }),
      }}
    >
      {children}
      {isExpanded || !isClamped ? (
        <></>
      ) : (
        <span
          style={{
            position: "absolute",
            bottom: 0,
            right: 0,
            padding: "0 0 0 .4rem",
            lineHeight: "130%",
          }}
        >
          <button
            style={{
              border: "none",
              backgroundColor: "white",
              color: "rgba(0, 0, 0, 0.6)",
            }}
            type={"button"}
            onClick={() => {
              setExpanded(true);
            }}
          >
            …see more
          </button>
        </span>
      )}
    </span>
  );
}

function InlineScript({
  attrs,
  body,
}: {
  attrs?: Record<string, string>;
  body: string;
}) {
  const hydrated = useHydratedMemo();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    // create script tag
    const script = document.createElement("script");
    // add attribs
    for (const [attr, value] of Object.entries(attrs ?? {})) {
      script.setAttribute(attr, value);
    }
    // add inline script
    if (body) {
      script.appendChild(document.createTextNode(body));
    }
    ref.current.replaceChildren(script);
  }, []);

  if (hydrated) {
    return <div ref={ref} style={{ display: "none" }}></div>;
  } else {
    return (
      <script
        {...attributesToProps(attrs ?? {}, "script")}
        dangerouslySetInnerHTML={{ __html: body }}
      />
    );
  }
}

function RenderedPrismCode({
  domNode,
  options,
}: {
  domNode: Element;
  options: HTMLReactParserOptions;
}) {
  const ref = useRef<HTMLElement>(null);
  const body = getTextBody(domNode);
  useEffect(() => {
    // @ts-ignore
    if (!ref.current || !window.Prism) return;
    // @ts-ignore
    window.Prism.highlightElement(ref.current);
  }, [body]);
  // @ts-ignore
  domNode.children[0].attribs.ref = ref;
  return (
    <span className="gui-html-container">
      <pre {...attributesToProps(domNode.attribs)}>
        {domToReact(domNode.children, options)}
      </pre>
    </span>
  );
}

function getTextBody(domNode: Element) {
  let body = "";
  const child = domNode.children[0];
  if (child instanceof Text) {
    body = child.data;
  }
  return body;
}
