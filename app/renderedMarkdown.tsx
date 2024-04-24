import React from "react";
import { marked } from "marked";
import hljs from "highlight.js";
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
    breaks: true,
    highlight(code, lang) {
      if (lang && hljs.getLanguage(lang)) {
        try {
          return hljs.highlight(code, { language: lang }).value;
        } catch (_) { }
      }
      return hljs.highlightAuto(code).value;
    },
  });

  return (
    <RenderedHTML
      key={body}
      body={html}
      lineClamp={lineClamp}
      className="gui-html-container gui-md-container"
      {...attrs}
    />
  );
}
