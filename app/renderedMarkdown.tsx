import { marked } from "marked";
import { RenderedHTML } from "~/renderedHTML";

export function RenderedMarkdown({
  body,
  lineClamp,
  className,
  ...attrs
}: // allowUnsafeHTML,
  {
    body: string;
    lineClamp?: number;
    className?: string;
    [attr: string]: any;
    // allowUnsafeHTML?: boolean;
  }) {
  if (!body) return <></>;
  let html = marked.parse(body, {
    gfm: true,
    headerIds: false,
    mangle: false,
    breaks: true,
  });

  return (
    <RenderedHTML
      key={body}
      body={html}
      lineClamp={lineClamp}
      className={className ?? "gui-html-container gui-md-container"}
      {...attrs}
    />
  );
}
