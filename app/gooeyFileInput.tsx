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
        allowedFileTypes: accept,
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
      .use(XHR, { endpoint: "/__/file-upload/" })
      .on("upload-success", onFilesChanged)
      .on("file-removed", onFilesChanged);
    initUppy(defaultValue, _uppy);
    setUppy(_uppy);
    // Clean up event handlers etc.
    return () => {
      _uppy.close();
    };
  }, []);

  // if the server value changes, update the uppy state
  useEffect(() => {
    const element = inputRef.current;
    if (!uppy || !element || JSON.stringify(state[name]) == element?.value || state[name] == element?.value) return;
    for (const file of uppy.getFiles()) {
      uppy.removeFile(file.id);
    }
    initUppy(state[name] || [], uppy);
    // JS event loop hack to make sure the value is set before onChange is called
    setTimeout(() => {
      element.value = JSON.stringify(state[name]) || "";
      onChange();
    });
  }, [state[name]]);

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

function initUppy(defaultValue: string | string[] | undefined, uppy: Uppy) {
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
      const fileId = uppy.addFile({
        name: filename,
        type: contentType,
        data: new Blob(),
        preview: contentType?.startsWith("image/") ? url : undefined,
      });
      uppy.setFileState(fileId, {
        progress: { uploadComplete: true, uploadStarted: true },
        uploadURL: url,
      });
    } catch (e) { }
  }
  if (uppy.getFiles().length) {
    uppy.setState({
      totalProgress: 100,
    });
  }
  // only set this after initial files have been added
  uppy.setOptions({
    autoProceed: true,
  });
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
