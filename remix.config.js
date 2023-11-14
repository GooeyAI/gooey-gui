const wixUrls = [
  "/",
  "/faq",
  "/pricing",
  "/privacy",
  "/terms",
  "/team/",
  "/jobs/",
];

const proxyUrls = [
  "/static/*",
  "/login/",
  "/logout/",
  "/account/",
  "/paypal/",
  "/payment-success/",
  "/favicon",
  "/favicon.ico",
  "/sitemap.xml/",
  "/2/*",
  "/__/*",
];

/** @type {import('@remix-run/dev').AppConfig} */
module.exports = {
  ignoredRouteFiles: ["**/.*", "**/*.module.css"],
  // appDirectory: "app",
  // assetsBuildDirectory: "public/build",
  // serverBuildPath: "build/index.js",
  // publicPath: "/build/",
  serverModuleFormat: "cjs",
  future: {
    v2_errorBoundary: true,
    v2_meta: true,
    v2_normalizeFormMethod: true,
    v2_routeConvention: true,
  },
  serverDependenciesToBundle: [
    /uppy/,
    /marked/,
    /nanoid/,
    /exifr/,
    /firebase-admin/,
    /glideapps/,
  ],
  routes(defineRoutes) {
    return defineRoutes((route) => {
      // A common use for this is catchall _routes.
      // - The first argument is the React Router path to match against
      // - The second is the relative filename of the route handler
      for (const path of wixUrls) {
        route(path, "wix.tsx", { id: path });
      }
      for (const path of proxyUrls) {
        route(path, "proxy.tsx", { id: path });
      }
      route("/__/realtime/*", "realtime.tsx");
      route("*", "app.tsx");
    });
  },
};
