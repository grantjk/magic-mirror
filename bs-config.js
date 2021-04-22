import { createProxyMiddleware } from "http-proxy-middleware";

const apiProxy = createProxyMiddleware("/", {
  target: "http://localhost:8000",
  changeOrigin: true, // for vhosted sites
});

export const server = {
  // Start from key `10` in order to NOT overwrite the default 2 middleware provided
  // by `lite-server` or any future ones that might be added.
  // Reference: https://github.com/johnpapa/lite-server/blob/master/lib/config-defaults.js#L16
  middleware: {
    10: apiProxy,
  },
};
