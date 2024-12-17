import React, { useEffect, useRef, useState } from "react";
import { loadEventHandlers } from "./gooeyInput";

export function useJsonFormInput<T>({
  defaultValue,
  name,
  onChange,
  encode = JSON.stringify,
  decode = JSON.parse,
  args,
}: {
  defaultValue: T;
  name: string;
  onChange?: () => void;
  encode?: (value: T) => string;
  decode?: (value: string) => T;
  args?: Record<string, any>;
}): [React.FunctionComponent, T, (value: T) => void] {
  const [value, setValue] = useState(defaultValue);
  const ref = useRef<HTMLInputElement>(null);

  loadEventHandlers(value, setValue, args);

  useEffect(() => {
    if (!ref.current) return;
    if (!ref.current.value) {
      // initialize html input value
      ref.current.value = value === undefined ? "" : encode(value);
    } else if (ref.current.value != encode(value)) {
      // restore value from html input
      setValue(decode(ref.current.value));
      onChange?.();
    }
  }, [encode, decode, name, value, onChange]);

  return [
    () => <input hidden ref={ref} name={name} />,
    value,
    (value: T) => {
      if (ref.current) {
        ref.current.value = value === undefined ? "" : encode(value);
      }
      setValue(value);
    },
  ];
}
