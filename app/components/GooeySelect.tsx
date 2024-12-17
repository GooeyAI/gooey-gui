import { useEffect } from "react";
import type {
  CSSObjectWithLabel,
  OptionProps,
  SingleValueProps,
} from "react-select";
import Select, { components } from "react-select";
import { InputLabel } from "~/gooeyInput";
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
  let { defaultValue, name, label, styles, help, tooltipPlacement, ...args } =
    props;
  let [JsonFormInput, value, setValue] = useJsonFormInput({
    defaultValue,
    name,
    onChange,
    args,
  });

  // if the state value is changed by the server code, then update the value
  useEffect(() => {
    if (state && state[name] !== value) {
      setValue(state[name]);
    }
  }, [state, name]);

  let onSelectChange = (newValue: any) => {
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
    <div className={`gui-input gui-input-select ${args.className ?? ""}`}>
      <InputLabel
        label={label}
        help={help}
        tooltipPlacement={tooltipPlacement}
      />
      <JsonFormInput />
      <ClientOnlySuspense
        fallback={
          <div className="d-flex align-items-center" style={{ height: "38px" }}>
            <RenderedMarkdown
              body={
                (selectValue &&
                  selectValue.map((it: any) => it.label).join(" | ")) ||
                "Loading..."
              }
              className="container-margin-reset"
            />
          </div>
        }
      >
        {() => (
          <Select
            value={selectValue}
            onChange={onSelectChange}
            components={{ Option, SingleValue }}
            styles={{
              ...Object.fromEntries(
                Object.entries(styles ?? {}).map(([key, style]) => {
                  if (!style) return [key, undefined];
                  return [
                    key,
                    (base: CSSObjectWithLabel) => ({ ...base, ...style }),
                  ];
                })
              ),
            }}
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
