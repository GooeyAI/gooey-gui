import Tippy from "@tippyjs/react";
import { useState } from "react";
import { OnChange } from "~/app";
import { RenderedChildren, TreeNode } from "~/renderer";

export default function GooeyPopover({
  content,
  children,
  onChange,
  state,
  ...props
}: {
  content: Array<TreeNode>;
  children: Array<TreeNode>;
  onChange: OnChange;
  state: Record<string, any>;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <Tippy
      visible={visible}
      onClickOutside={() => setVisible(false)}
      content={
        <div onClick={() => setVisible(false)}>
          <RenderedChildren
            children={content}
            onChange={onChange}
            state={state}
          />
        </div>
      }
      animation="scale"
      {...props}
    >
      <button
        type="button"
        className="border-0 bg-transparent"
        onClick={() => setVisible(!visible)}
      >
        <RenderedChildren
          children={children}
          onChange={onChange}
          state={state}
        />
      </button>
    </Tippy>
  );
}
