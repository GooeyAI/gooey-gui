import { marked } from "marked";
import { RenderedHTML } from "~/renderedHTML";

export function RenderedMarkdown({
  body,
  lineClamp,
  lineClampExpand,
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
  });

  return (
    <RenderedHTML
      key={body}
      body={html}
      lineClamp={lineClamp}
      lineClampExpand={lineClampExpand}
      className="gui-html-container gui-md-container"
      {...attrs}
    />
  );
}
