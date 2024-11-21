import React from "react";
import Tippy, { useSingleton } from "@tippyjs/react";
import { RenderedMarkdown } from "~/renderedMarkdown";

interface GooeyTooltipProps {
  content: string;
  children?: React.ReactElement<any>;
  placement?: "left" | "right" | "top" | "bottom" | "auto";
}

const GooeyTooltip: React.FC<GooeyTooltipProps> = ({
  content,
  placement = "auto",
  children,
}) => {
  const [source, target] = useSingleton({
    overrides: ["placement"],
  });
  return (
    <>
      <Tippy singleton={source} delay={100} interactive />
      <Tippy
        singleton={target}
        placement={placement}
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
};

export const HelpTooltip = (props: Record<string, any>) => {
  return (
    <GooeyTooltip content={props?.content || ""}>
      <i
        role="button"
        className="fa-regular fa-circle-info position-absolute"
        style={{
          height: "16px",
          top: "50%",
          right: "-20px",
          transform: "translateY(calc(-50% - 3px))",
        }}
      />
    </GooeyTooltip>
  );
};

export default GooeyTooltip;
