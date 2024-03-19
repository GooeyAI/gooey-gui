import React from "react";
import { marked } from "marked";
import { RenderedHTML } from "~/renderedHTML";

export function RenderedMarkdown({
  body,
  lineClamp,
  ...attrs
}: // allowUnsafeHTML,
{
  body: string;
  lineClamp?: number;
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
      lineClamp={lineClamp}
      className="gui-html-container gui-md-container"
      {...attrs}
    />
  );
}
