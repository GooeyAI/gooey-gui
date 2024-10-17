import React from "react";
import { useGooeyCheckedInput } from "~/gooeyInput";
import { RenderedMarkdown } from "~/renderedMarkdown";

interface GooeySwitchProps {
  props: Record<string, any>;
  id: string;
  state: Record<string, any>;
  className: string;
}

const GooeySwitch: React.FC<GooeySwitchProps> = ({
  props,
  id,
  state,
  className,
}: GooeySwitchProps) => {
  const { label, name, defaultChecked, ...args } = props;
  const inputRef = useGooeyCheckedInput({
    stateChecked: state[name],
    defaultChecked,
  });
  return (
    <div className={className+ " d-flex justify-content-between align-items-center"}>
      <RenderedMarkdown body={label} />
      <div className="gooey-switch-container">
        <input
          ref={inputRef}
          id={id}
          name={name}
          defaultChecked={defaultChecked}
          className="gooey-switch gooey-switch--shadow"
          {...args}
          type="checkbox"
        />
        <label htmlFor={id} />
      </div>
    </div>
  )
};

export default GooeySwitch;