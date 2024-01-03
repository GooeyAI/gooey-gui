import type { LinksFunction } from "@remix-run/node";
import Uppy from "@uppy/core";
import { Dashboard } from "@uppy/react";
import Webcam from "@uppy/webcam";
import React, { useEffect, useState } from "react";
import { RenderedMarkdown } from "~/renderedMarkdown";
import XHR from "@uppy/xhr-upload";
import Audio from "@uppy/audio";
import mime from "mime-types";
import coreStyle from "@uppy/core/dist/style.min.css";
import dashboardStyle from "@uppy/dashboard/dist/style.min.css";
import webcamStyle from "@uppy/webcam/dist/style.min.css";
import audioStyle from "@uppy/audio/dist/style.min.css";
import path from "path";
import { UIPlugin } from '@uppy/core';
import { PluginOptions } from '@uppy/core';
import { h, Component } from 'preact';

function UrlIcon() {
  return h("svg", {
    "aria-hidden": "true",
    focusable: "false",
    width: "32",
    height: "32",
    viewBox: "0 0 32 32"
  }, h("path", {
    d: "M23.637 15.312l-2.474 2.464a3.582 3.582 0 01-.577.491c-.907.657-1.897.986-2.968.986a4.925 4.925 0 01-3.959-1.971c-.248-.329-.164-.902.165-1.149.33-.247.907-.164 1.155.164 1.072 1.478 3.133 1.724 4.618.656a.642.642 0 00.33-.328l2.473-2.463c1.238-1.313 1.238-3.366-.082-4.597a3.348 3.348 0 00-4.618 0l-1.402 1.395a.799.799 0 01-1.154 0 .79.79 0 010-1.15l1.402-1.394a4.843 4.843 0 016.843 0c2.062 1.805 2.144 5.007.248 6.896zm-8.081 5.664l-1.402 1.395a3.348 3.348 0 01-4.618 0c-1.319-1.23-1.319-3.365-.082-4.596l2.475-2.464.328-.328c.743-.492 1.567-.739 2.475-.657.906.165 1.648.574 2.143 1.314.248.329.825.411 1.155.165.33-.248.412-.822.165-1.15-.825-1.068-1.98-1.724-3.216-1.888-1.238-.247-2.556.082-3.628.902l-.495.493-2.474 2.464c-1.897 1.969-1.814 5.09.083 6.977.99.904 2.226 1.396 3.463 1.396s2.473-.492 3.463-1.395l1.402-1.396a.79.79 0 000-1.15c-.33-.328-.908-.41-1.237-.082z",
    fill: "#FF753E",
    "fill-rule": "nonzero"
  }));
}

function addProtocolToURL(url: string) {
  const protocolRegex = /^[a-z0-9]+:\/\//;
  const defaultProtocol = 'http://';
  if (protocolRegex.test(url)) {
    return url;
  }
  return defaultProtocol + url;
}

function checkIfCorrectURL(url: any) {
  if (!url) return false;
  const protocol = url.match(/^([a-z0-9]+):\/\//)[1];
  if (protocol !== 'http' && protocol !== 'https') {
    return false;
  }
  return true;
}

function forEachDroppedOrPastedUrl(dataTransfer: any, isDropOrPaste: any, callback: any) {
  const items = [...dataTransfer.items];
  let urlItems;
  switch (isDropOrPaste) {
    case 'paste':
      {
        const atLeastOneFileIsDragged = items.some(item => item.kind === 'file');
        if (atLeastOneFileIsDragged) {
          return;
        }
        urlItems = items.filter(item => item.kind === 'string' && item.type === 'text/plain');
        break;
      }
    case 'drop':
      {
        urlItems = items.filter(item => item.kind === 'string' && item.type === 'text/uri-list');
        break;
      }
    default:
      {
        throw new Error(`isDropOrPaste must be either 'drop' or 'paste', but it's ${isDropOrPaste}`);
      }
  }
  urlItems.forEach(item => {
    item.getAsString((urlString: any) => callback(urlString));
  });
}

function _classPrivateFieldLooseBase(receiver: any, privateKey: any) { if (!Object.prototype.hasOwnProperty.call(receiver, privateKey)) { throw new TypeError("attempted to use private field on non-instance"); } return receiver; }
var id = 0;
function _classPrivateFieldLooseKey(name: any) { return "__private_" + id++ + "_" + name; }
var _handleSubmit = /*#__PURE__*/_classPrivateFieldLooseKey("handleSubmit");
class UrlUI extends Component {
  form: any;
  input: any;

  constructor(props: { addFile: any }) {
    super(props);
    this.form = document.createElement('form');
    Object.defineProperty(this, _handleSubmit, {
      writable: true,
      value: (ev: any) => {
        ev.preventDefault();
        const {
          addFile
        } = this.props as any;
        const preparedValue = this.input.value.trim();
        addFile(preparedValue);
      }
    });
    this.form.id = 1;
  }
  componentDidMount() {
    this.input.value = '';
    this.form.addEventListener('submit', _classPrivateFieldLooseBase(this, _handleSubmit)[_handleSubmit]);
    document.body.appendChild(this.form);
  }
  componentWillUnmount() {
    this.form.removeEventListener('submit', _classPrivateFieldLooseBase(this, _handleSubmit)[_handleSubmit]);
    document.body.removeChild(this.form);
  }
  render() {
    return h("div", {
      className: "uppy-Url"
    }, h("input", {
      className: "uppy-u-reset uppy-c-textInput uppy-Url-input",
      type: "text",
      "aria-label": 'Enter URL to import',
      placeholder: 'Enter any URL to import',
      ref: input => {
        this.input = input;
      },
      "data-uppy-super-focusable": true,
      form: this.form.id
    }), h("button", {
      className: "uppy-u-reset uppy-c-btn uppy-c-btn-primary uppy-Url-importButton",
      type: "submit",
      form: this.form.id
    }, 'import'));
  }
}

interface Options extends PluginOptions { 
  title?: string;
  target?: any;
}

class UrlUpload extends UIPlugin<Options> {
  opts: Options;
  title: string;
  icon: () => any;

  constructor(uppy: Uppy, opts: Options) {
    super(uppy, opts);
    this.uppy = uppy;
    this.opts = opts;
    this.id = this.opts.id || 'Url';
    this.title = this.opts.title || 'Link';
    this.type = 'acquirer';
    this.icon = () => h(UrlIcon, null);

    // Bind all event handlers for referencability
    this.getMeta = this.getMeta.bind(this);
    this.addFile = this.addFile.bind(this);
    this.handleRootDrop = this.handleRootDrop.bind(this);
    this.handleRootPaste = this.handleRootPaste.bind(this);
  }
  async getMeta(url: string) {
    const name = urlToFilename(url);
    const type = mime.lookup(name) || undefined;

    try {
      const parser = new DOMParser();
      const response = await fetch(url);
      var data = await response.text();
      const doc = parser.parseFromString(data, 'text/html');
      var title = doc.querySelector('title')?.textContent || name;
      var description = doc.querySelector('meta[name="description"]')?.getAttribute('content') || '';
      var image = doc.querySelector('meta[property="og:image"]')?.getAttribute('content') || url;
      var size = response.headers.get('content-length') || data.length * 8;
    } catch (err: any) {
      this.uppy.log(`[URL] Error when fetching metadata: ${err}`);
      title = name;
      size = 0;
      image = url;
      description = '';
      data = url;
    }

    return {
      title: title,
      name: name,
      type: type,
      size: 0,
      description: description,
      preview: image,
      data: new Blob([data]),
    };
  }
  async addFile(protocollessUrl: string, optionalMeta?: any) {
    if (optionalMeta === void 0) {
      optionalMeta = undefined;
    }
    const url = addProtocolToURL(protocollessUrl);
    if (!checkIfCorrectURL(url)) {
      this.uppy.log(`[URL] Incorrect URL entered: ${url}`);
      return undefined;
    }
    try {
      const meta = await this.getMeta(url);
      const tagFile: any = {
        name: `${meta.title} (${url})`,
        type: meta.type,
        data: meta.data,
        preview: meta.preview,
        meta: optionalMeta,
      };
      this.uppy.log('[URL] Adding remote file');
      try {
        const fileId = this.uppy.addFile(tagFile);
        this.uppy.setFileState(fileId, {
          progress: { uploadComplete: true, uploadStarted: true },
          uploadURL: url,
        });
        return fileId;
      } catch (err: any) {
        if (!err.isRestriction) {
          this.uppy.log(err);
        }
        return err;
      }
    } catch (err: any) {
      this.uppy.log(err);
      this.uppy.info({
        message: 'failedToFetch',
        details: err
      }, 'error', 4000);
      return err;
    }
  }
  handleRootDrop(e: any) {
    forEachDroppedOrPastedUrl(e.dataTransfer, 'drop', (url: string) => {
      this.uppy.log(`[URL] Adding file from dropped url: ${url}`);
      this.addFile(url);
    });
  }
  handleRootPaste(e: any) {
    forEachDroppedOrPastedUrl(e.clipboardData, 'paste', (url: string) => {
      this.uppy.log(`[URL] Adding file from pasted url: ${url}`);
      this.addFile(url);
    });
  }
  render() {
    return h(UrlUI as any, {
      addFile: this.addFile
    });
  }
  install() {
    const {
      target
    } = this.opts;
    if (target) {
      this.mount(target, this);
    }
  }
  uninstall() {
    this.unmount();
  }
}

export const links: LinksFunction = () => {
  return [
    { rel: "stylesheet", href: coreStyle },
    { rel: "stylesheet", href: dashboardStyle },
    { rel: "stylesheet", href: webcamStyle },
    { rel: "stylesheet", href: audioStyle },
  ];
};

export function GooeyFileInput({
  name,
  label,
  accept,
  multiple,
  onChange,
  defaultValue,
  uploadMeta,
}: {
  name: string;
  label: string;
  accept: string[];
  multiple: boolean;
  onChange: () => void;
  defaultValue: string | string[] | undefined;
  uploadMeta: Record<string, string>;
}) {
  const [uppy, setUppy] = useState<Uppy | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onFilesChanged = () => {
      const element = inputRef.current;
      if (!element) return;
      const uploadUrls = _uppy
        .getFiles()
        .map((file) => file.response?.uploadURL)
        .filter((url) => url);
      element.value =
        JSON.stringify(multiple ? uploadUrls : uploadUrls[0]) || "";
      onChange();
    };
    const _uppy: Uppy = new Uppy({
      id: name,
      allowMultipleUploadBatches: true,
      restrictions: {
        maxFileSize: 250 * 1024 * 1024,
        maxNumberOfFiles: multiple ? 50 : 1,
        // allowedFileTypes: accept,
      },
      locale: {
        strings: {
          uploadComplete: "",
          complete: "Uploaded",
        },
      },
      meta: uploadMeta,
    })
      .use(Webcam)
      .use(Audio)
      .use(UrlUpload as any, { })
      .use(XHR, { endpoint: "/__/file-upload/" })
      .on("upload-success", onFilesChanged)
      .on("file-removed", onFilesChanged);
    let urls = defaultValue;
    if (typeof urls === "string") {
      urls = [urls];
    }
    urls ||= [];
    for (let url of urls) {
      try {
        let filename;
        if (!isUserUploadedUrl(url)) {
          filename = urlToFilename(url);
        } else {
          filename = url;
        }
        const contentType = mime.lookup(filename) || undefined;
        const fileId = _uppy.addFile({
          name: filename,
          type: contentType,
          data: new Blob(),
          preview: contentType?.startsWith("image/") ? url : undefined,
        });
        _uppy.setFileState(fileId, {
          progress: { uploadComplete: true, uploadStarted: true },
          uploadURL: url,
        });
      } catch (e) {}
    }
    if (_uppy.getFiles().length) {
      _uppy.setState({
        totalProgress: 100,
      });
    }
    // only set this after initial files have been added
    _uppy.setOptions({
      autoProceed: true,
    });
    setUppy(_uppy);
  }, []);

  if (!uppy) return <></>;

  return (
    <div className="gui-input">
      {label ? (
        <label>
          <RenderedMarkdown body={label} />
        </label>
      ) : null}
      <input
        hidden
        ref={inputRef}
        name={name}
        defaultValue={JSON.stringify(defaultValue)}
      />
      <Dashboard
        showRemoveButtonAfterComplete
        showLinkToFileUploadResult
        hideUploadButton
        uppy={uppy}
        height={250}
        width={550}
        singleFileFullScreen={false}
        plugins={["Webcam", "Audio"]}
        // @ts-ignore
        doneButtonHandler={null}
      />
    </div>
  );
}

function urlToFilename(url: string) {
  let pathname = new URL(url).pathname;
  return decodeURIComponent(path.basename(pathname));
}

function isUserUploadedUrl(url: string) {
  return (
    url.includes(`storage.googleapis.com`) && url.includes(`daras_ai/media`)
  );
}
