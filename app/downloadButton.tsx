import { RenderedMarkdown } from "~/renderedMarkdown";
import React from "react";
import { urlToFilename } from "~/gooeyFileInput";

export function DownloadButton({
  label,
  className,
  url,
  ...props
}: {
  label: string;
  className?: string;
  url: string;
}) {
  const [isDownloading, setIsDownloading] = React.useState(false);
  return (
    <div
      className={`btn btn-theme ${className ?? ""}`}
      {...props}
      onClick={async () => {
        if (isDownloading) return;
        setIsDownloading(true);
        try {
          await download(url);
        } finally {
          setIsDownloading(false);
        }
      }}
    >
      {isDownloading ? (
        <div style={{ position: "relative", width: "0", height: "0" }}>
          <div style={{ position: "absolute", left: "30px", top: "-5px" }}>
            <div className="gooey-spinner"></div>
          </div>
        </div>
      ) : null}
      <div style={{ opacity: isDownloading ? 0.3 : 1 }}>
        <RenderedMarkdown body={label} />
      </div>
    </div>
  );
}

async function download(url: string) {
  let response = await fetch(url);
  let blob = await response.blob();
  let a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = urlToFilename(url);
  a.onclick = (e) => {
    e.stopPropagation();
    setTimeout(() => {
      URL.revokeObjectURL(url);
      a.remove();
    }, 250);
  };
  a.click();
}
