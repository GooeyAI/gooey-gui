import { marked } from "marked";
import { RenderedHTML } from "~/renderedHTML";

export function GooeyTooltip(props: {
  text: string;
  direction?: "left";
  iconStyle?: Record<string, string>;
}) {
  return (
    <span
      className={
        "gui_tooltip" +
        (props.direction
          ? " gui_tooltip--" + props.direction
          : " gui_tooltip--right")
      }
    >
      <i
        role="button"
        className="fa-regular fa-circle-info"
        style={{ height: "16px", ...props.iconStyle }}
      ></i>
      <span className="tooltip_text">
        <RenderedMarkdown body={props.text} className="" />
      </span>
    </span>
  );
}

export function RenderedMarkdown({
  body,
  lineClamp,
  className,
  tooltip,
  tooltip_direction,
  tooltip_iconStyle,
  ...attrs
}: // allowUnsafeHTML,
{
  body: string;
  lineClamp?: number;
  className?: string;
  tooltip?: string;
  tooltip_direction?: "left";
  tooltip_iconStyle?: Record<string, string>;
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
    >
      {tooltip && (
        <GooeyTooltip
          text={tooltip}
          direction={tooltip_direction}
          iconStyle={tooltip_iconStyle}
        />
      )}
    </RenderedHTML>
  );
}
