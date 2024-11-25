import React from "react";
import Tippy, { useSingleton } from "@tippyjs/react";
import { RenderedMarkdown } from "~/renderedMarkdown";

export type TooltipPlacement = "left" | "right" | "top" | "bottom" | "auto";

export function GooeyHelpIcon({
  content,
  placement,
}: {
  content: string;
  placement?: TooltipPlacement;
}) {
  return (
    <GooeyTooltip content={content} placement={placement}>
      <i
        role="button"
        className="fa-regular fa-circle-info position-absolute text-muted"
        style={{
          right: "-1.5rem",
          top: "1px",
        }}
      />
    </GooeyTooltip>
  );
}

export function GooeyTooltip({
  content,
  children,
  placement,
}: {
  content: string;
  children: React.ReactElement;
  placement?: TooltipPlacement;
}) {
  const [source, target] = useSingleton({
    overrides: ["placement"],
  });
  return (
    <>
      <Tippy singleton={source} delay={100} interactive />
      <Tippy
        singleton={target}
        placement={placement || "auto"}
        animation="scale"
        arrow
        content={
          <div className="bg-white p-2 b-1 shadow rounded container-margin-reset gooey-tooltip-box">
            <RenderedMarkdown body={content} />
          </div>
        }
      >
        {children}
      </Tippy>
    </>
  );
}
