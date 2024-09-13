import { useEffect } from "react";
import type { OptionProps, SingleValueProps } from "react-select";
import Select, { components } from "react-select";
import { useJsonFormInput } from "~/jsonFormInput";
import { ClientOnlySuspense } from "~/lazyImports";
import { RenderedMarkdown } from "~/renderedMarkdown";

export default function GooeySelect({
  props,
  onChange,
  state,
}: {
  props: Record<string, any>;
  onChange: () => void;
  state: Record<string, any>;
}) {
  const { defaultValue, name, label, ...args } = props;
  const [JsonFormInput, value, setValue] = useJsonFormInput({
    defaultValue,
    name,
    onChange,
  });

  // if the state value is changed by the server code, then update the value
  useEffect(() => {
    if (state && state[name] !== value) {
      setValue(state[name]);
    }
  }, [state, name]);

  const onSelectChange = (newValue: any) => {
    if (newValue === undefined) return;
    if (!newValue) {
      setValue(newValue);
    } else if (args.isMulti) {
      setValue(newValue.map((opt: any) => opt.value));
    } else {
      setValue(newValue.value);
    }
    onChange();
  };

  let selectValue = args.options.filter((opt: any) =>
    args.isMulti ? value.includes(opt.value) : opt.value === value
  );
  // if selectedValue is not in options, then set it to the first option
  useEffect(() => {
    if (!selectValue.length && !args.allow_none) {
      setValue(args.isMulti ? [args.options[0].value] : args.options[0].value);
    }
  }, [args.isMulti, args.options, selectValue, setValue]);

  return (
    <div className="gui-input gui-input-select">
      {label && (
        <label htmlFor={name}>
          <RenderedMarkdown body={label} />
        </label>
      )}
      <JsonFormInput />
      <ClientOnlySuspense
        fallback={
          <div
            className="d-flex align-items-center justify-content-center"
            style={{ height: "38px" }}
          >
            Loading...
          </div>
        }
      >
        {() => (
          <Select
            value={selectValue}
            onChange={onSelectChange}
            components={{ Option, SingleValue }}
            {...args}
          />
        )}
      </ClientOnlySuspense>
    </div>
  );
}
const Option = (props: OptionProps) => (
  <components.Option
    {...props}
    children={
      <RenderedMarkdown body={props.label} className="container-margin-reset" />
    }
  />
);

const SingleValue = ({ children, ...props }: SingleValueProps) => (
  <components.SingleValue {...props}>
    {children ? (
      <RenderedMarkdown
        body={children.toString()}
        className="container-margin-reset"
      />
    ) : null}
  </components.SingleValue>
);
