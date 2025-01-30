import Audio from "@uppy/audio";
import type { UppyFile } from "@uppy/core";
import Uppy from "@uppy/core";
import { Dashboard } from "@uppy/react";
import Url from "@uppy/url";
import Webcam from "@uppy/webcam";
import XHR from "@uppy/xhr-upload";
import mime from "mime-types";
import React, { useEffect, useState } from "react";
import { InputLabel } from "./gooeyInput";
import { urlToFilename } from "./urlUtils";
import type { TooltipPlacement } from "./components/GooeyTooltip";

export function GooeyFileInput({
  name,
  label,
  accept,
  multiple,
  onChange,
  defaultValue,
  uploadMeta,
  state,
  help,
  tooltipPlacement,
}: {
  name: string;
  label: string;
  accept: string[] | undefined;
  multiple: boolean;
  onChange: () => void;
  defaultValue: string | string[] | undefined;
  uploadMeta: Record<string, string>;
  state: Record<string, any>;
  help?: string;
  tooltipPlacement?: TooltipPlacement;
}) {
  const [uppy, setUppy] = useState<Uppy | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [showClearAll, setShowClearAll] = useState(false);

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
      setShowClearAll(
        uploadUrls.length > 0 && _uppy.getState().totalProgress >= 100
      );
      onChange();
    };
    const onFileUploaded = (file: any) => {
      onFilesChanged();
      file = _uppy.getFile(file.id); // for some reason, the file object is not the same as the one in the uppy state
      loadPreview({
        url: file.uploadURL,
        uppy: _uppy,
        fileId: file.id,
        filename: file.name,
        preview: file.preview,
      });
    };
    const onFileAdded = (file: UppyFile) => {
      if (file.source != "Url") {
        setShowClearAll(false);
        return;
      }
      const url = file?.remote?.body?.url?.toString();
      if (!url) return;
      _uppy.setFileState(file.id, {
        progress: {
          uploadComplete: true,
          uploadStarted: true,
          percentage: 100,
          bytesUploaded: file.data.size,
        },
        uploadURL: url,
      });
      _uppy.setFileMeta(file.id, {
        name: urlToFilename(url),
      });
      (_uppy as any).calculateTotalProgress();
      onFilesChanged();
      loadPreview({
        url: url,
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
      .use(Url, { companionUrl: "/__/file-upload/" })
      .use(XHR, {
        endpoint: "/__/file-upload/",
        shouldRetry(xhr: XMLHttpRequest) {
          return [408, 429, 502, 503].includes(xhr.status);
        },
      })
      .on("file-added", onFileAdded)
      .on("upload-success", onFileUploaded)
      .on("file-removed", onFilesChanged);

    // only enable relevant plugins
    if (
      !accept ||
      accept.some(
        (a) =>
          a.startsWith("image") || a.startsWith("video") || a.startsWith("*")
      )
    ) {
      _uppy.use(Webcam);
    }
    if (
      !accept ||
      accept.some((a) => a.startsWith("audio") || a.startsWith("*"))
    ) {
      _uppy.use(Audio);
    }

    setShowClearAll(initUppy(defaultValue, _uppy));
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
      setShowClearAll(initUppy(state[name] || [], uppy));
      element.setAttribute("initDone", "true");
    }
  }, [state, name]);

  return (
    <div className="gui-input">
      <InputLabel
        label={label}
        help={help}
        tooltipPlacement={tooltipPlacement}
      />
      <input
        hidden
        ref={inputRef}
        name={name}
        defaultValue={JSON.stringify(defaultValue)}
      />
      {uppy ? (
        <div className="w-100 position-relative" style={{ zIndex: 0 }}>
          <Dashboard
            showRemoveButtonAfterComplete
            showLinkToFileUploadResult
            hideUploadButton
            uppy={uppy}
            height={258}
            width={"100%"}
            singleFileFullScreen={false}
            plugins={["Url", "Webcam", "Audio"]}
            // @ts-ignore
            doneButtonHandler={null}
          />
          {showClearAll ? (
            <button
              className="uppy-Dashboard--clear-all"
              role="button"
              onClick={() => uppy.cancelAll()}
            >
              🗑 Clear All
            </button>
          ) : null}
        </div>
      ) : (
        "Loading..."
      )}
    </div>
  );
}

function initUppy(
  defaultValue: string | string[] | undefined,
  uppy: Uppy
): boolean {
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
  const hasFiles = uppy.getFiles().length > 0;
  if (hasFiles) {
    uppy.setState({ totalProgress: 100 });
  }
  return hasFiles;
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
  if (uppy.getFile(fileId).meta.type?.startsWith("image/")) return;

  const response = await fetch(
    `https://metascraper.gooey.ai/fetchUrlMeta?url=${url}`
  );
  const data = await response.json();
  const { content_type: contentType, image } = data;
  const contentLength = response.headers.get("content-length");
  preview = contentType?.startsWith("image/") ? url : preview ? preview : image;

  if (!uppy.getFile(fileId)) return;
  uppy.setFileState(fileId, {
    size: contentLength ? parseInt(contentLength) : undefined,
    preview: preview,
  });
}
