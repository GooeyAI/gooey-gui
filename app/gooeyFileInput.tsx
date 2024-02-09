import { LinksFunction } from "@remix-run/node";
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
  state,
}: {
  name: string;
  label: string;
  accept: string[];
  multiple: boolean;
  onChange: () => void;
  defaultValue: string | string[] | undefined;
  uploadMeta: Record<string, string>;
  state: Record<string, any>;
}) {
  const [uppy, setUppy] = useState<Uppy | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onFilesChanged = () => {
      const element = inputRef.current;
      if (!element || !_uppy || !element.hasAttribute("initDone")) return;
      const uploadUrls = _uppy
        .getFiles()
        .map((file: any) => file.uploadURL)
        .filter((url) => url);
      element.value =
        JSON.stringify(multiple ? uploadUrls : uploadUrls[0]) || "";
      onChange();
    };
    const onFileAdded = (file: any) => {
      onFilesChanged();
      loadPreview({
        url: file.uploadURL,
        uppy: _uppy,
        fileId: file.id,
        filename: file.name,
        preview: file.preview,
      });
    };
    const _uppy: Uppy = new Uppy({
      id: name,
      allowMultipleUploadBatches: true,
      restrictions: {
        maxFileSize: 250 * 1024 * 1024,
        maxNumberOfFiles: multiple ? 500 : 1,
        allowedFileTypes: accept ? accept.concat(["url/undefined"]) : undefined,
      },
      locale: {
        strings: {
          uploadComplete: "",
          complete: "Uploaded",
        },
      },
      meta: uploadMeta,
      autoProceed: true,
    })
      .use(Webcam)
      .use(Audio)
      .use(XHR, { endpoint: "/__/file-upload/" })
      .on("upload-success", onFileAdded)
      .on("file-removed", onFilesChanged);
    initUppy(defaultValue, _uppy);
    inputRef.current?.setAttribute("initDone", "true");
    setUppy(_uppy);
    // Clean up event handlers etc.
    return () => {
      _uppy.close();
    };
  }, []);

  // if the server value changes, update the uppy state
  useEffect(() => {
    const element = inputRef.current;
    if (uppy && element && JSON.stringify(state[name]) != element.value) {
      element.value = JSON.stringify(state[name]) || "";
      element.removeAttribute("initDone");
      initUppy(state[name] || [], uppy);
      element.setAttribute("initDone", "true");
    }
  }, [state, name]);

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
      {uppy ? (
        <Dashboard
          showRemoveButtonAfterComplete
          showLinkToFileUploadResult
          hideUploadButton
          uppy={uppy}
          height={250}
          width={576}
          singleFileFullScreen={false}
          plugins={["Webcam", "Audio"]}
          // @ts-ignore
          doneButtonHandler={null}
        />
      ) : null}
    </div>
  );
}

function initUppy(defaultValue: string | string[] | undefined, uppy: Uppy) {
  for (const file of uppy.getFiles()) {
    uppy.removeFile(file.id);
  }
  let urls = defaultValue;
  if (typeof urls === "string") {
    urls = [urls];
  }
  urls ||= [];
  for (let url of urls) {
    let filename;
    try {
      filename = urlToFilename(url);
    } catch (e) {
      continue;
    }
    const contentType = mime.lookup(filename) || "url/undefined";
    const preview = contentType?.startsWith("image/") ? url : undefined;
    let fileId;
    try {
      fileId = uppy.addFile({
        name: filename,
        type: contentType,
        data: new Blob(),
        preview: preview,
        meta: {
          relativePath: new Date().toISOString(), // this is a hack to make the file unique
        },
      });
    } catch (e) {
      console.error(e);
      continue;
    }
    uppy.setFileState(fileId, {
      progress: { uploadComplete: true, uploadStarted: true, percentage: 100 },
      uploadURL: url,
      size: undefined,
    });
    loadPreview({ url, uppy, fileId, filename, preview });
  }
  if (uppy.getFiles().length) {
    uppy.setState({
      totalProgress: 100,
    });
  }
}

async function loadPreview({
  url,
  uppy,
  fileId,
  filename,
  preview,
}: {
  url: string;
  uppy: Uppy;
  fileId: string;
  filename?: string;
  preview?: string;
}) {
  const response = await fetch(url);
  const contentType = response.headers.get("content-type") || "url/undefined";
  const contentLength = response.headers.get("content-length");
  const text = await textResponseHead({ response });

  preview = contentType?.startsWith("image/") ? url : preview;

  if (text && contentType?.startsWith("text/html")) {
    const doc = new DOMParser().parseFromString(text, "text/html");

    filename =
      doc.querySelector('meta[property="og:title"]')?.getAttribute("content") ||
      doc.querySelector("title")?.textContent ||
      filename;

    preview =
      doc.querySelector('meta[property="og:image"]')?.getAttribute("content") ||
      preview;

    uppy.setFileMeta(fileId, {
      name: filename,
    });
  }

  uppy.setFileState(fileId, {
    size: contentLength ? parseInt(contentLength) : undefined,
    preview: preview,
  });
}

/**
 * Read the first n characters of a response body as text
 */
async function textResponseHead({
  response,
  n = 10240,
}: {
  response: Response;
  n?: number;
}) {
  const reader = response.body?.getReader();
  if (!reader) return "";
  let text = "";
  const utf8Decoder = new TextDecoder("utf-8");
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    text += utf8Decoder.decode(value, { stream: true });
    if (text.length > n) {
      await reader.cancel();
      break;
    }
  }
  return text;
}

function urlToFilename(_url: string) {
  const url = new URL(_url);
  if (isUserUploadedUrl(_url)) {
    return decodeURIComponent(path.basename(url.pathname));
  } else {
    return `${url.hostname}${url.pathname}${url.search}`;
  }
}

function isUserUploadedUrl(url: string) {
  return (
    url.includes(`storage.googleapis.com`) && url.includes(`daras_ai/media`)
  );
}
