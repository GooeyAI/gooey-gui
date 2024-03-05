import type { LinksFunction } from "@remix-run/node";
import type { ReactNode } from "react";
import React, { useEffect, useRef } from "react";
import Select from "react-select";
import { GooeyFileInput, links as fileInputLinks } from "~/gooeyFileInput";
import { RenderedMarkdown } from "~/renderedMarkdown";

import { useJsonFormInput } from "~/jsonFormInput";
import { JsonViewer } from "@textea/json-viewer";
import { Tab, TabList, TabPanel, TabPanels, Tabs } from "@reach/tabs";
import { Link } from "@remix-run/react";
import { RenderedHTML } from "~/renderedHTML";
import CountdownTimer from "./components/countdown";
import { DataTable, DataTableRaw, links as dataTableLinks } from "~/dataTable";
import { ClientOnly } from "remix-utils";
import download from "downloadjs";
import {
  GooeyCheckbox,
  GooeyInput,
  GooeyRadio,
  GooeyTextarea,
} from "~/gooeyInput";

export const links: LinksFunction = () => {
  return [...dataTableLinks(), ...fileInputLinks()];
};

type TreeNode = {
  name: string;
  props: Record<string, any>;
  children: Array<TreeNode>;
};

export function getTransforms({
  children,
}: {
  children: Array<TreeNode>;
}): Record<string, string> {
  let ret: Record<string, string> = {};
  for (const node of children) {
    const { name, props, children } = node;
    switch (name) {
      case "input":
        ret[props.name] = props.type;
        break;
      default:
        ret[props.name] = name;
        break;
    }
    if (!children) continue;
    ret = { ...ret, ...getTransforms({ children }) };
  }
  return ret;
}

export const applyTransform: Record<string, (val: FormDataEntryValue) => any> =
  {
    checkbox: Boolean,
    number: parseIntFloat,
    range: parseIntFloat,
    select: (val) => (val ? JSON.parse(`${val}`) : null),
    file: (val) => (val ? JSON.parse(`${val}`) : null),
  };

function parseIntFloat(val: FormDataEntryValue): number {
  let strVal = val.toString();
  const intVal = parseInt(strVal);
  const floatVal = parseFloat(strVal);
  if (floatVal == intVal) {
    return intVal;
  } else if (isNaN(floatVal)) {
    return 0;
  } else {
    return floatVal;
  }
}

function RenderedTreeNode({
  node,
  onChange,
  state,
}: {
  node: TreeNode;
  onChange: () => void;
  state: Record<string, any>;
}) {
  const { name, props, children } = node;

  switch (name) {
    case "":
      return (
        <RenderedChildren
          children={children}
          onChange={onChange}
          state={state}
        />
      );
    case "nav-tab-content":
      return (
        <div className="tab-content">
          <div className="tab-pane show active" role="tabpanel">
            <RenderedChildren
              children={children}
              onChange={onChange}
              state={state}
            />
          </div>
        </div>
      );
    case "data-table": {
      const { fileUrl, ...tableProps } = props;
      return <DataTable fileUrl={fileUrl}></DataTable>;
    }
    case "data-table-raw": {
      const { cells, ...tableProps } = props;
      return <DataTableRaw cells={cells}></DataTableRaw>;
    }
    case "nav-tabs":
      return (
        <ul
          className="nav justify-content-md-start justify-content-evenly nav-tabs"
          role="tablist"
          {...props}
        >
          <RenderedChildren
            children={children}
            onChange={onChange}
            state={state}
          />
        </ul>
      );
    case "nav-item": {
      const { to, active, ...args } = props;
      return (
        <Link to={to} {...args}>
          <li className="nav-item" role="presentation">
            <button
              className={`nav-link  p-2 px-md-3 py-md-2  mx-0 mx-md-2 ${
                active ? "active" : ""
              }`}
              type="button"
              role="tab"
              aria-controls="run"
              aria-selected="true"
            >
              <p className="mb-0">
                <RenderedChildren
                  children={children}
                  onChange={onChange}
                  state={state}
                />
              </p>
            </button>
          </li>
        </Link>
      );
    }
    case "pre": {
      const { body, ...args } = props;
      return (
        <pre className="gooey-output-text" {...args}>
          {body}
        </pre>
      );
    }
    case "ul": {
      return (
        <ul {...props}>
          <RenderedChildren
            children={children}
            onChange={onChange}
            state={state}
          />
        </ul>
      );
    }
    case "div": {
      return (
        <div {...props}>
          <RenderedChildren
            children={children}
            onChange={onChange}
            state={state}
          />
        </div>
      );
    }
    case "tabs":
      const tabs = children.map((elem) => (
        <Tab key={elem.props.label}>
          <RenderedMarkdown body={elem.props.label} state={state} />
        </Tab>
      ));
      const panels = children.map((elem) => (
        <TabPanel key={elem.props.label} {...elem.props}>
          <RenderedChildren
            children={elem.children}
            onChange={onChange}
            state={state}
          />
        </TabPanel>
      ));
      return (
        <Tabs {...props}>
          <TabList>{tabs}</TabList>
          <TabPanels>{panels}</TabPanels>
        </Tabs>
      );
    case "expander": {
      const { label, open, ...args } = props;
      return (
        <GuiExpander open={open} label={label} {...args}>
          <RenderedChildren
            children={children}
            onChange={onChange}
            state={state}
          />
        </GuiExpander>
      );
    }
    case "img": {
      const { caption, href, ...args } = props;
      let child = (
        <>
          <RenderedMarkdown body={caption} />
          <img
            className="gui-img"
            alt={caption}
            {...args}
            onClick={() => {
              if (href || args.src.startsWith("data:")) return;
              window.open(args.src);
            }}
          />
        </>
      );
      if (href) {
        child = (
          <Link to={href}>
            <div>{child}</div>
          </Link>
        );
      }
      return child;
    }
    case "video": {
      const { caption, ...args } = props;
      return (
        <>
          <RenderedMarkdown body={caption} />
          <video className="gui-video" controls {...args}></video>
        </>
      );
    }
    case "audio": {
      const { caption, ...args } = props;
      return (
        <>
          <RenderedMarkdown body={caption} />
          <audio className="gui-audio" controls {...args}></audio>
        </>
      );
    }
    case "html": {
      const { body, ...args } = props;
      return <RenderedHTML body={body} {...args} />;
    }
    case "markdown": {
      const { body, ...args } = props;
      return <RenderedMarkdown body={body} {...args} />;
    }
    case "textarea": {
      return <GooeyTextarea props={props} state={state} />;
    }
    case "input": {
      const className = `gui-input gui-input-${props.type}`;
      const id = inputId(props);
      switch (props.type) {
        case "range":
          return (
            <GooeySlider
              className={className}
              id={id}
              props={props}
              state={state}
            />
          );
        case "file":
          return (
            <GooeyFileInput
              name={props.name}
              label={props.label}
              accept={props.accept}
              multiple={props.multiple}
              onChange={onChange}
              defaultValue={props.defaultValue}
              uploadMeta={props.uploadMeta}
              state={state}
            />
          );
        case "checkbox":
          return (
            <GooeyCheckbox
              props={props}
              id={id}
              state={state}
              className={className}
            ></GooeyCheckbox>
          );
        case "radio":
          return (
            <GooeyRadio
              props={props}
              id={id}
              state={state}
              className={className}
            ></GooeyRadio>
          );
        default:
          return (
            <GooeyInput
              props={props}
              id={id}
              state={state}
              className={className}
            ></GooeyInput>
          );
      }
    }
    case "gui-button": {
      const { label, className, ...args } = props;
      return (
        <button
          type="button"
          className={`btn btn-theme ${className ?? ""}`}
          {...args}
        >
          <RenderedMarkdown body={label} />
        </button>
      );
    }
    case "download-button": {
      const { label, className, ...args } = props;
      return (
        <button
          type="button"
          className={`btn btn-theme ${className ?? ""}`}
          {...args}
          onClick={() => {
            console.log(download(args.url));
          }}
        >
          <RenderedMarkdown body={label} />
        </button>
      );
    }
    case "select":
      return <GuiSelect props={props} onChange={onChange} state={state} />;
    case "option": {
      const { label, ...args } = props;
      return (
        <option {...args}>{label && <RenderedMarkdown body={label} />}</option>
      );
    }
    case "json":
      return (
        <JsonViewer
          style={{
            overflow: "scroll",
            marginTop: "1rem",
          }}
          rootName={false}
          value={props.value}
          defaultInspectDepth={props.defaultInspectDepth}
          {...props}
        />
      );
    case "Link":
      return (
        <Link to={props.to} {...props}>
          <RenderedChildren
            children={children}
            onChange={onChange}
            state={state}
          />
        </Link>
      );
    case "tag": {
      const { __reactjsxelement, ...args } = props;
      return (
        <__reactjsxelement {...args}>
          <RenderedChildren
            children={children}
            onChange={onChange}
            state={state}
          />
        </__reactjsxelement>
      );
    }
    case "countdown-timer": {
      return (
        <CountdownTimer endTime={props.endTime} delayText={props.delayText}>
          <RenderedChildren
            children={children}
            onChange={onChange}
            state={state}
          />
        </CountdownTimer>
      );
    }
    case "script": {
      const { src, args } = props;
      return <ExecJs src={src} args={args}></ExecJs>;
    }
    case "plotly-chart": {
      const { chart, ...args } = props;
      return (
        <ClientOnly fallback={<p>Loading...</p>}>
          {() => {
            const Plot = require("react-plotly.js").default;
            return <Plot {...chart} style={{ width: "100%" }} />;
          }}
        </ClientOnly>
      );
    }
    default:
      return (
        <div>
          <pre>
            <code>{JSON.stringify(node)}</code>
          </pre>
        </div>
      );
  }
}

function ExecJs({ src, args }: { args: any; src: any }) {
  useEffect(() => {
    // eslint-disable-next-line no-new-func
    const fn = new Function(...Object.keys(args), src);
    fn(...Object.values(args));
  }, [src, args]);
  return null;
}

export function RenderedChildren({
  children,
  onChange,
  state,
}: {
  children: Array<TreeNode>;
  onChange: () => void;
  state: Record<string, any>;
}) {
  let elements = children.map((node, idx) => {
    let key;
    if (node.props.name) {
      key = inputId(node.props);
    } else {
      key = `idx:${idx}`;
    }
    return (
      <RenderedTreeNode
        key={key}
        node={node}
        onChange={onChange}
        state={state}
      />
    );
  });
  return <>{elements}</>;
}

function GuiSelect({
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
    args.isMulti ? value.includes(opt.value) : opt.value === value,
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
      {/*{JsonFormInput}*/}
      <Select value={selectValue} onChange={onSelectChange} {...args} />
    </div>
  );
}

function GooeySlider({
  className,
  id,
  props,
  state,
}: {
  className: string;
  id: string;
  props: Record<string, any>;
  state: Record<string, any>;
}) {
  const { label, ...args } = props;
  const ref1 = useRef<HTMLInputElement>(null);
  const ref2 = useRef<HTMLInputElement>(null);

  // if server changed the value, update both inputs
  useEffect(() => {
    for (const element of [ref1.current, ref2.current]) {
      if (!element) continue;
      if (state && state[props.name] !== element.value) {
        element.value = state[props.name];
      }
    }
  }, [state, props.name]);
  const numberArgs = (({ name, type, ...object }) => object)(args);
  return (
    <div className={className}>
      <label htmlFor={id}>
        <RenderedMarkdown className="flex-grow-1" body={label} />
      </label>
      <div className="d-flex justify-content-between align-items-center">
        <input
          ref={ref1}
          onChange={(e) => {
            if (ref2.current) ref2.current.value = e.target.value;
          }}
          {...numberArgs}
          type="number"
        />
        <input
          ref={ref2}
          onChange={(e) => {
            if (ref1.current) ref1.current.value = e.target.value;
          }}
          id={id}
          {...args}
        />
      </div>
    </div>
  );
}

export function GuiExpander({
  open,
  label,
  children,
  ...props
}: {
  open?: boolean;
  label: string;
  children: ReactNode;
  [key: string]: any;
}) {
  const [JsonFormInput, isOpen, setIsOpen] = useJsonFormInput({
    defaultValue: open,
    name: `gui-expander-${label}`,
  });
  return (
    <div className="gui-expander accordion">
      <JsonFormInput />
      {/*{JsonFormInput}*/}
      <div
        className={`gui-expander-header accordion-header accordion-button ${
          isOpen ? "" : "collapsed"
        }`}
        onClick={() => setIsOpen(!isOpen)}
        {...props}
      >
        <RenderedMarkdown body={label} />
      </div>
      <div
        className="gui-expander-body"
        style={{ display: isOpen ? "block" : "none" }}
      >
        {children}
      </div>
    </div>
  );
}

function inputId(props: Record<string, any>) {
  return `input:${props.name}:${props.value}`;
}
