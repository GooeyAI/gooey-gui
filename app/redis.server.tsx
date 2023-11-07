import { createClient } from "redis";

declare global {
  var redis: ReturnType<typeof createClient>;
}
if (typeof global.redis === "undefined") {
  global.redis = createClient({
    url: process.env["REDIS_URL"],
  });
  global.redis.connect();
}

export default global.redis;
