import type { LinksFunction } from "@remix-run/node";
import Uppy from "@uppy/core";
import { Dashboard } from "@uppy/react";
import Webcam from "@uppy/webcam";
import React, { useEffect, useState } from "react";
import { RenderedMarkdown } from "~/renderedMarkdown";
import XHR from "@uppy/xhr-upload";
import Audio from "@uppy/audio";
import coreStyle from "@uppy/core/dist/style.min.css";
import dashboardStyle from "@uppy/dashboard/dist/style.min.css";
import webcamStyle from "@uppy/webcam/dist/style.min.css";
import audioStyle from "@uppy/audio/dist/style.min.css";
import UrlUpload, { getMeta } from "~/uppyUrlPlugin";

export const links: LinksFunction = () => {
  return [
    { rel: "stylesheet", href: coreStyle },
    { rel: "stylesheet", href: dashboardStyle },
    { rel: "stylesheet", href: webcamStyle },
    { rel: "stylesheet", href: audioStyle },
  ];
};

function fix_previews() {
  setTimeout(async () => {
    for (const el of document.getElementsByClassName("uppy-Dashboard-Item")) {
      // @ts-ignore
      const url = el.firstChild.firstChild.firstChild.href.replace("http://", "").replace("https://", "");
      const truncatedUrl = (url.length > 65) ? url.slice(0, 65 - 1) + '...' : url;
      // @ts-ignore
      el.childNodes[1].firstChild.firstChild.firstChild.textContent = el.childNodes[1].firstChild.firstChild.firstChild.title;
      // @ts-ignore
      const size = el.childNodes[1].firstChild.children[1].textContent.replace(truncatedUrl + " ", "").replace("(","").replace(")","");
      // @ts-ignore
      el.childNodes[1].firstChild.children[1].textContent = `${truncatedUrl} (${size})`;
      // @ts-ignore
      el.childNodes[1].firstChild.children[1].title = url;
    }
    for (const el of document.getElementsByClassName("uppy-DashboardContent-bar")) {
      // @ts-ignore
      if (el.children[1].style.display == "none") continue;
      // @ts-ignore
      el.firstChild.style.display = "none";
    }
  });
}

export function GooeyFileInput({
  name,
  label,
  accept,
  multiple,
  onChange,
  defaultValue,
  uploadMeta,
  allowBigPreview = undefined,
}: {
  name: string;
  label: string;
  accept: string[];
  multiple: boolean;
  onChange: () => void;
  defaultValue: string | string[] | undefined;
  uploadMeta: Record<string, string>;
  allowBigPreview: boolean | undefined;
}) {
  const [uppy, setUppy] = useState<Uppy | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const clearAllRef = React.useRef<HTMLButtonElement>(null);
  const selfRef = React.useRef<HTMLDivElement>(null);

  if (allowBigPreview === undefined) {
    allowBigPreview = !multiple;
  } 

  useEffect(() => {
    const onFilesChanged = () => {
      // @ts-ignore
      const element = inputRef.current;
      if (!element) return;
      const uploadUrls = _uppy
        .getFiles()
        .map((file) => (file as any).uploadURL || file.response?.uploadURL)
        .filter((url) => url);
      element.value =
        JSON.stringify(multiple ? uploadUrls : uploadUrls[0]) || "";
      onChange();
      fix_previews();
      if (uploadUrls.length) {
        clearAllRef.current?.style.setProperty("display", "block");
      } else {
        clearAllRef.current?.style.setProperty("display", "none");
      }
    };
    const _uppy: Uppy = new Uppy({
      id: name,
      allowMultipleUploadBatches: true,
      restrictions: {
        maxFileSize: 250 * 1024 * 1024,
        maxNumberOfFiles: multiple ? 50 : 1,
        allowedFileTypes: accept ? accept.concat(["url/undefined"]) : undefined,
      },
      locale: {
        strings: {
          uploadComplete: "",
          complete: "Uploaded",
        },
      },
      meta: uploadMeta,
    })
      .use(UrlUpload)
      .use(XHR, { endpoint: "/__/file-upload/" })
      .on("upload-success", onFilesChanged)
      .on("file-removed", onFilesChanged);

    // only enable relevant plugins
    if (!accept || accept.some((a) => a.startsWith("*"))) {
      _uppy.use(Webcam).use(Audio);
    } else {
      if (accept.some((a) => a.startsWith("image") || a.startsWith("video"))) {
        _uppy.use(Webcam);
      }
      if (accept.some((a) => a.startsWith("audio"))) {
        _uppy.use(Audio);
      }
    }

    // Add initial files
    let urls = defaultValue;
    if (typeof urls === "string") {
      urls = [urls];
    }
    urls ||= [];
    const allPromises = [];
    for (let url of urls) {
      try {
        const promise = getMeta(url);
        allPromises.push(promise);
          promise.then((meta) => {
          const fileId = _uppy.addFile({
            name: meta.title,
            type: meta.type,
            data: meta.data,
            preview: meta.preview,
          });
          _uppy.setFileState(fileId, {
            progress: { uploadComplete: true, uploadStarted: true },
            uploadURL: url,
          });
        });
      } catch (e) {}
    }
    Promise.all(allPromises).then(() => {
      if (_uppy.getFiles().length) {
        _uppy.setState({
          totalProgress: 100,
        });
        if (clearAllRef.current) {
          clearAllRef.current.style.display = "block";
        }
      }
      // only set this after initial files have been added
      _uppy.setOptions({
        autoProceed: true,
      });
      fix_previews();
    });
    setUppy(_uppy);
  }, []);

  useEffect(() => {
    // Set timeout is necessary to put this at the end of the event loop to ensure that the uppy instance is fully initialized
    setTimeout(() => {
      if (!selfRef.current) return;

      // Fix odd scroll behavior
      selfRef.current.addEventListener("scroll", fix_previews, true);

      // Allow resizing of the dashboard
      for (const contentToResize of selfRef.current.getElementsByClassName("uppy-Dashboard-inner") as HTMLCollectionOf<HTMLElement>) {
        const resizeable = contentToResize.firstElementChild as HTMLElement;
        if (!resizeable) continue;
        new ResizeObserver(() => {
          contentToResize.style.height = parseInt(resizeable.style.height) + 2 + "px";
          fix_previews();
          if (!allowBigPreview) {
            for (const class_name of ["uppy-size--md", "uppy-size--lg", "uppy-size--height-md"]) {
              selfRef.current?.querySelector('.' + class_name)?.classList.remove(class_name);
            }
          }
        }).observe(resizeable);
      }
    });
  }, [uppy]);

  if (!uppy) return <></>;
  return (
    <div className="gui-input" ref={selfRef}>
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
      <div style={{width: "100%", position: "relative"}}>
        <Dashboard
          showRemoveButtonAfterComplete
          showLinkToFileUploadResult
          hideUploadButton
          uppy={uppy}
          height={(defaultValue || "").length > 0 ? 280 : 180}
          width={"100%"}
          singleFileFullScreen={false}
          plugins={["Webcam", "Audio", "Url"]}
          // @ts-ignore
          doneButtonHandler={null}
        />
        <button 
          className="uppy-Dashboard__clear-all" 
          role="button"
          ref={clearAllRef}
          style={{display: "none"}}
          onClick={() => uppy.cancelAll()}>
            🗑 Clear All
        </button>
      </div>
    </div>
  );
}
