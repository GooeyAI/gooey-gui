import React, { useEffect, useRef, useState } from "react";
import { RenderedMarkdown } from "~/renderedMarkdown";
import { HelpTooltip } from "./components/GooeyTooltip";

export function GooeyTextarea({
  props,
  state,
}: {
  props: Record<string, any>;
  state: Record<string, any>;
}) {
  const { label, name, defaultValue, help, tooltip_placement, ...args } = props;
  const [inputRef, value, setValue] = useGooeyStringInput<HTMLTextAreaElement>({
    state,
    name,
    defaultValue,
  });
  return (
    <div className="gui-input gui-input-textarea">
      {label && (
        <span className="d-inline-block position-relative">
          <label>
            <RenderedMarkdown body={label} />
          </label>
          {help && (
            <HelpTooltip content={help as string} placement={tooltip_placement} />
          )}
        </span>
      )}
      <div>
        <textarea
          ref={inputRef}
          name={name}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          {...args}
        />
      </div>
    </div>
  );
}

export function GooeyInput({
  props,
  id,
  state,
  className,
}: {
  props: Record<string, any>;
  id: string;
  state: Record<string, any>;
  className: string;
}) {
  const { label, name, defaultValue, help, tooltip_placement, ...args } = props;
  const [inputRef, value, setValue] = useGooeyStringInput<HTMLInputElement>({
    state,
    name,
    defaultValue,
  });
  return (
    <div className={className}>
      {label && (
        <span className="d-inline-block position-relative">
          <label htmlFor={id}>
            <RenderedMarkdown body={label} />
          </label>
          {help && (
            <HelpTooltip content={help as string} placement={tooltip_placement} />
          )}
        </span>
      )}
      <input
        ref={inputRef}
        id={id}
        name={name}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        {...args}
      />
    </div>
  );
}

export function useGooeyStringInput<
  E extends HTMLInputElement | HTMLTextAreaElement,
>({
  state,
  name,
  defaultValue,
}: {
  state: Record<string, any>;
  name: string;
  defaultValue: string;
}): [
  inputRef: React.RefObject<E>,
  value: string,
  setValue: (value: string) => void,
] {
  const inputRef = useRef<E>(null);

  // if the state value is changed by the server code, then update the value
  // we need to use this extra state variable because DOM limitations mean textarea values can't be updated directly (https://github.com/elm/virtual-dom/issues/115)
  // instead the React way is to have a value and onChange handler (https://react.dev/reference/react-dom/components/textarea)
  // but to avoid reloading the page on every change with onChange (gets very annoying when typing), we need to use this extra state variable with a useEffect
  const [value, setValue] = useState<string>(state[name] || defaultValue);

  useEffect(() => {
    const element = inputRef.current;
    if (
      state &&
      state[name] !== value &&
      element &&
      element.form &&
      !element.form.hasAttribute("debounceInProgress")
    ) {
      setValue(state[name] || defaultValue || "");
    }
  }, [state, name]);

  return [inputRef, value, setValue];
}

export function GooeyCheckbox({
  props,
  id,
  state,
  className,
}: {
  props: Record<string, any>;
  id: string;
  state: Record<string, any>;
  className: string;
}) {
  const { label, name, defaultChecked, help, tooltip_placement, ...args } = props;
  const inputRef = useGooeyCheckedInput({
    stateChecked: state[name],
    defaultChecked,
  });
  return (
    <div className={className}>
      <input
        ref={inputRef}
        id={id}
        name={name}
        defaultChecked={defaultChecked}
        {...args}
      />
      <span className="d-inline-block position-relative">
        <label htmlFor={id}>
          <RenderedMarkdown body={label} />
        </label>
        {help && (
          <HelpTooltip content={help as string} placement={tooltip_placement} />
        )}
      </span>
    </div>
  );
}

export function GooeyRadio({
  props,
  id,
  state,
  className,
}: {
  props: Record<string, any>;
  id: string;
  state: Record<string, any>;
  className: string;
}) {
  const { label, name, value, defaultChecked, help, tooltip_placement, ...args } = props;
  const inputRef = useGooeyCheckedInput({
    stateChecked: state[name] == value,
    defaultChecked,
  });

  return (
    <div className={className}>
      <input
        ref={inputRef}
        id={id}
        name={name}
        value={value}
        defaultChecked={defaultChecked}
        {...args}
      />
      <span className="d-inline-block position-relative">
        <label htmlFor={id}>
          <RenderedMarkdown body={label} />
        </label>
        {help && (
          <HelpTooltip content={help as string} placement={tooltip_placement} />
        )}
      </span>
    </div>
  );
}

export function useGooeyCheckedInput({
  stateChecked,
  defaultChecked,
}: {
  // state: Record<string, any>;
  // name: string;
  stateChecked: boolean;
  defaultChecked: boolean;
}): React.RefObject<HTMLInputElement> {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const element = inputRef.current;
    if (element && stateChecked !== element.checked) {
      element.checked = stateChecked || defaultChecked || false;
    }
  }, [stateChecked]);

  return inputRef;
}
