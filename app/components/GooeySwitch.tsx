import React from "react";
import { useGooeyCheckedInput } from "~/gooeyInput";
import { RenderedMarkdown } from "~/renderedMarkdown";

interface GooeySwitchProps {
  props: Record<string, any>;
  state: Record<string, any>;
}

const GooeySwitch: React.FC<GooeySwitchProps> = ({
  props,
  state,
}: GooeySwitchProps) => {
  const { label, name, defaultChecked, className = "" , ...args } = props;
  const inputRef = useGooeyCheckedInput({
    stateChecked: state[name],
    defaultChecked,
  });
  return (
    <div className={"d-flex justify-content-between align-items-center container-margin-reset py-2 " + className }>
      <RenderedMarkdown body={label} />
      <div className="gooey-switch-container">
        <input
          ref={inputRef}
          id={name}
          name={name}
          defaultChecked={defaultChecked}
          className="gooey-switch gooey-switch--shadow"
          {...args}
          type="checkbox"
        />
        <label htmlFor={name} />
      </div>
    </div>
  )
};

export default GooeySwitch;