import React from "react";
import CodeMirror from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { useGooeyStringInput } from "~/gooeyInput";
import { useSubmit } from "@remix-run/react";
import { dracula } from "@uiw/codemirror-theme-dracula";

const CodeEditor = ({
  props,
  state,
}: {
  props: Record<string, any>;
  state: Record<string, any>;
}) => {
  const submit = useSubmit();
  const { name, defaultValue, height, ...restProps } = props;
  const [inputRef, value, setValue] = useGooeyStringInput<HTMLTextAreaElement>({
    state,
    name,
    defaultValue,
  });
  const handleChange = (val: string) => {
    setValue(val);
    const evt: Event = new Event("change", { bubbles: true });
    const form: HTMLElement | null = document.querySelector("#gooey-form");
    if (inputRef.current) {
      inputRef.current.value = val;
      if(form) form.dispatchEvent(evt);
      submit(form as HTMLFormElement);
    }
  };

  return (
    <div className='mb-4'>
      <textarea
        ref={inputRef}
        name={name}
        
        style={{ display: 'none' }}
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
        }}
      />
      <CodeMirror
        theme={dracula}
        value={value}
        id='gooey-code-editor'
        onChange={handleChange}
        extensions={[javascript()]}
        height={`${height}px` || "200px"}
        
        {...restProps}
      />
    </div>
  );
};

export default CodeEditor;
