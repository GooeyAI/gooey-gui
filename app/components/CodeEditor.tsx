import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
import { indentUnit } from "@codemirror/language";
import { lintGutter, linter } from "@codemirror/lint";
import { dracula } from "@uiw/codemirror-theme-dracula";
import CodeMirror from "@uiw/react-codemirror";
import type { LintOptions } from "jshint";
import { JSHINT as jshint } from "jshint";
import type { OnChange } from "~/app";
import { InputLabel, useGooeyStringInput } from "~/gooeyInput";

const jsLinter = (lintOptions: LintOptions) => {
  return linter((view) => {
    const diagnostics: any = [];
    const codeText = view.state.doc.toJSON();
    jshint(codeText, lintOptions);
    const errors = jshint?.data()?.errors;

    if (errors && errors.length > 0) {
      errors.forEach((error) => {
        const selectedLine = view.state.doc.line(error.line);

        const diagnostic = {
          from: selectedLine.from,
          to: selectedLine.to,
          severity: "error",
          message: error.reason,
        };

        diagnostics.push(diagnostic);
      });
    }
    return diagnostics;
  });
};

export default function CodeEditor({
  props,
  state,
  onChange,
}: {
  props: Record<string, any>;
  onChange: OnChange;
  state: Record<string, any>;
}) {
  const {
    name,
    defaultValue,
    height,
    label,
    help,
    tooltipPlacement,
    language,
    ...args
  } = props;
  const [inputRef, value, setValue] = useGooeyStringInput<HTMLTextAreaElement>({
    state,
    name,
    defaultValue,
    args,
  });
  const handleChange = (val: string) => {
    setValue(val);
    // trigger the onChange event for Root Form
    // imitate the textarea onChange
    onChange({
      target: inputRef.current as HTMLElement,
    });
  };

  const lintOptions: LintOptions = {
    esversion: 11,
    browser: true,
    lastsemic: true,
    asi: true,
    expr: true,
  };

  let extensions = [lintGutter()];
  if (language === "javascript") {
    extensions.push(javascript(), jsLinter(lintOptions));
  } else if (language === "python") {
    extensions.push(python(), indentUnit.of("    "));
  }

  return (
    <div className="gui-input code-editor-wrapper position-relative">
      <InputLabel
        label={label}
        help={help}
        tooltipPlacement={tooltipPlacement}
      />
      <textarea
        data-gramm="false"
        data-gramm_editor="false"
        data-enable-grammarly="false"
        ref={inputRef}
        name={name}
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
        }}
      />
      <CodeMirror
        data-gramm="false"
        data-gramm_editor="false"
        data-enable-grammarly="false"
        theme={dracula}
        value={value}
        onChange={handleChange}
        extensions={extensions}
        {...args}
      />
    </div>
  );
}
