import mime from "mime-types";
import path from "path";
import Uppy from "@uppy/core";
import { UIPlugin } from '@uppy/core';
import { PluginOptions } from '@uppy/core';
import { h, Component } from 'preact';

function addProtocolToURL(url: string) {
  const protocolRegex = /^[a-z0-9]+:\/\//;
  const defaultProtocol = 'http://';
  if (protocolRegex.test(url)) {
    return url;
  }
  return defaultProtocol + url;
}

function checkIfCorrectURL(url?: string) {
  if (!url) return false;
  const match = url.match(/^([a-z0-9]+):\/\//);
  if (!match) return false;
  const protocol = match[1];
  if (protocol !== 'http' && protocol !== 'https') {
    return false;
  }
  return true;
}

function urlToFilename(url: string) {
  let pathname = new URL(url).pathname;
  return decodeURIComponent(path.basename(pathname));
}

export async function getMeta(url: string) {
  const name = urlToFilename(url);
  const type = mime.lookup(name) || "url/undefined";

  try {
    const parser = new DOMParser();
    const response = await fetch(url);
    var data = await response.text();
    const doc = parser.parseFromString(data, 'text/html');
    var title = doc.querySelector('title')?.textContent || name;
    var description = doc.querySelector('meta[name="description"]')?.getAttribute('content') || '';
    var image = doc.querySelector('meta[property="og:image"]')?.getAttribute('content') || (type?.startsWith("image/") ? url : undefined);
    var size = parseInt(response.headers.get('content-length') || "0") || data.length * 8;
  } catch (err: unknown) {
    console.error(err);
    const youtube_video_id = url?.match(/youtube\.com.*(\?v=|\/embed\/)(.{11})/)?.pop();
    if (youtube_video_id?.length == 11) {
      image = 'http://img.youtube.com/vi/'+youtube_video_id+'/0.jpg';
      title ||= "YouTube Video (" + youtube_video_id + ")";
    }
    title ||= name;
    size ||= 0;
    image ||= url;
    description ||= '';
    data ||= url;
  }

  return {
    title: title,
    name: name,
    type: type,
    size: size,
    description: description,
    preview: image,
    data: new Blob(['.'.repeat(size)]),
  };
}

function forEachDroppedOrPastedUrl(dataTransfer: DataTransfer, isDropOrPaste: string, callback: CallableFunction) {
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
    item.getAsString((urlString: string) => callback(urlString));
  });
}

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

class UrlUI extends Component {
  form: HTMLFormElement;
  input: HTMLInputElement | null;
  #handleSubmit: (this: HTMLFormElement, ev: SubmitEvent) => any;

  constructor(props: { addFile: CallableFunction }) {
    super(props);
    this.form = document.createElement('form');
    this.input = null;
    this.#handleSubmit = (ev: SubmitEvent) => {
      ev.preventDefault();
      const {
        addFile
      } = props;
      const preparedValue = this.input?.value.trim();
      addFile(preparedValue);
    }
    this.form.id = '1';
  }
  componentDidMount() {
    if (this.input) this.input.value = '';
    this.form.addEventListener('submit', this.#handleSubmit);
    document.body.appendChild(this.form);
  }
  componentWillUnmount() {
    this.form.removeEventListener('submit', this.#handleSubmit);
    document.body.removeChild(this.form);
  }
  render() {
    return h("div", {
      className: "uppy-Url",
      style: {textAlign: "center", width: "80%"}
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
      style: {marginTop: "8px"},
      type: "submit",
      form: this.form.id
    }, 'Import'));
  }
}

interface Options extends PluginOptions { 
  title?: string;
  target?: any;
}

export default class UrlUpload extends UIPlugin<Options> {
  opts: Options;
  title: string;
  icon: () => any;

  constructor(uppy: Uppy, opts: Options | undefined) {
    super(uppy, opts);
    this.uppy = uppy;
    this.opts = opts || {};
    this.id = this.opts.id || 'Url';
    this.title = this.opts.title || 'Link';
    this.type = 'acquirer';
    this.icon = () => h(UrlIcon, null);

    // Bind all event handlers for referencability
    this.addFile = this.addFile.bind(this);
    this.handleRootDrop = this.handleRootDrop.bind(this);
    this.handleRootPaste = this.handleRootPaste.bind(this);
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
      const meta = await getMeta(url);
      const tagFile: any = {
        name: `${meta.title}`,
        type: meta.type,
        data: meta.data,
        preview: meta.preview,
        meta: optionalMeta,
      };
      this.uppy.log('[URL] Adding new file');
      try {
        const fileId = this.uppy.addFile(tagFile);
        this.uppy.setFileState(fileId, {
          progress: { uploadComplete: true, uploadStarted: true },
          uploadURL: url,
        });
        this.uppy.emit('upload-success');
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
  handleRootDrop(e: DragEvent) {
    forEachDroppedOrPastedUrl(e.dataTransfer!, 'drop', (url: string) => {
      this.uppy.log(`[URL] Adding file from dropped url: ${url}`);
      this.addFile(url);
    });
  }
  handleRootPaste(e: ClipboardEvent) {
    forEachDroppedOrPastedUrl(e.clipboardData!, 'paste', (url: string) => {
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
