import React, { useEffect, useRef } from "react";
import { marked } from "marked";
import { RenderedHTML } from "~/renderedHTML";

export function RenderedMarkdown({
  body,
  ...attrs
}: // allowUnsafeHTML,
{
  body: string;
  [attr: string]: any;
  // allowUnsafeHTML?: boolean;
}) {
  if (!body) return <></>;
  let html = marked.parse(body, {
    gfm: true,
    headerIds: false,
    mangle: false,
  });
  return (
    <RenderedHTML
      body={html}
      className="gui-html-container gui-md-container"
      {...attrs}
    />
  );
}
