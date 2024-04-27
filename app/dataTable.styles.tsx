import glideappsStyles from "@glideapps/glide-data-grid/dist/index.css";
import type { LinksFunction } from "@remix-run/node";

export const links: LinksFunction = () => {
  return [{ rel: "stylesheet", href: glideappsStyles }];
};
