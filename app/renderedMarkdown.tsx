import { marked } from "marked";
import { useRef } from "react";
import { RenderedHTML } from "~/renderedHTML";

const getDialog = (event: React.MouseEvent) => {
  return event.currentTarget.tagName === "DIALOG"
    ? event.currentTarget.closest("dialog")
    : (event.currentTarget.nextElementSibling as HTMLDialogElement);
};

export function GooeyTooltip(props: {
  text: string;
  direction?: "left";
  iconStyle?: Record<string, string>;
}) {
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const showTooltip = (event: React.MouseEvent) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    const dialog = getDialog(event);
    dialog!.show();
    event.preventDefault();
  };

  const hideTooltip = (event: React.MouseEvent) => {
    const dialog =getDialog(event);
    timerRef.current = setTimeout(() => dialog!.close(), 200);
    event.preventDefault();
  };

  return (
    <span
      className={
        "gui_tooltip" +
        (props.direction ? " gui_tooltip--" + props.direction : "")
      }
    >
      <i
        role="button"
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        className="fa-regular fa-circle-info"
        style={props.iconStyle}
      ></i>
      <dialog onMouseEnter={showTooltip} onMouseLeave={hideTooltip}>
        <input
          style={{
            width: "0",
            height: "0",
            minWidth: "0",
            border: "0",
            outline: "0",
            padding: "0",
            margin: "0",
          }}
        ></input>
        <RenderedMarkdown body={props.text} className="" />
      </dialog>
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
