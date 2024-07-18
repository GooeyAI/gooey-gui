import React from "react";
import CodeMirror from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { useGooeyStringInput } from "~/gooeyInput";
import { dracula } from "@uiw/codemirror-theme-dracula";
import { RenderedMarkdown } from "~/renderedMarkdown";

const CodeEditor = ({
  props,
  state,
  onChange,
}: {
  props: Record<string, any>;
  onChange: (e: any) => void;
  state: Record<string, any>;
}) => {
  const { name, defaultValue, height, label, ...restProps } = props;
  const [inputRef, value, setValue] = useGooeyStringInput<HTMLTextAreaElement>({
    state,
    name,
    defaultValue,
  });

  const handleChange = (val: string) => {
    setValue(val);
    // trigger the onChange event for Root Form
    // imitate the textarea onChange
    onChange({ target: inputRef.current });
  };

  return (
    <div
      className="mb-4 code-editor-wrapper position-relative"
      style={{ minHeight: height + 80 + "px" }}
    >
      {label && (
        <label>
          <RenderedMarkdown body={label} />
        </label>
      )}
      <textarea
        ref={inputRef}
        name={name}
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
