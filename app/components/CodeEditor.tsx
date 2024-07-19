import CodeMirror from "@uiw/react-codemirror";
import { esLint, javascript } from "@codemirror/lang-javascript";
import { useGooeyStringInput } from "~/gooeyInput";
import { dracula } from "@uiw/codemirror-theme-dracula";
import { RenderedMarkdown } from "~/renderedMarkdown";
import { linter, lintGutter } from "@codemirror/lint";
import { Linter } from "eslint-linter-browserify";
import type esLintType from "eslint";

const LintConfig: esLintType.Linter.Config = {
  parserOptions: {
    ecmaVersion: 2019,
    sourceType: "module",
  },
  env: {
    browser: true,
    node: true,
  },
  extends: "eslint:recommended",
  rules: {
    // enable additional rules
    indent: ["off"],
    "linebreak-style": ["error", "unix"],
    "no-debugger": ["error"],
    quotes: ["error", "double"],
    semi: ["error", "always"],
    // override configuration set by extending "eslint:recommended"
    "no-empty": "warn",
    "no-undef": ["error"],
    "no-cond-assign": ["error", "always"],
    // disable rules from base configurations
    "for-direction": "off",
  },
};

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
        id="gooey-code-editor"
        onChange={handleChange}
        extensions={[
          javascript(),
          lintGutter(),
          linter(
            esLint(
              new Linter({
                configType: "eslintrc",
              }),
              LintConfig
            )
          ),
        ]}
        height={`${height}px` || "200px"}
        {...restProps}
      />
    </div>
  );
};

export default CodeEditor;
