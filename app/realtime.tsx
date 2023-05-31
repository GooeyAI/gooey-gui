import type { LoaderArgs } from "@remix-run/node";
import { eventStream } from "remix-utils";
import { redis } from "~/redis.server";

export async function loader({ params, request }: LoaderArgs) {
  const requestUrl = new URL(request.url);
  const channels = requestUrl.searchParams.getAll("channels");
  if (!channels.length) {
    return new Response(null, { status: 204 });
  }
  return eventStream(request.signal, (send) => {
    let closed = false;
    function onMsg() {
      if (closed) return;
      send({ data: Date.now().toString() });
    }
    const subscriber = createSubscriber(channels, onMsg);
    return () => {
      closed = true;
      subscriber.unsubscribe();
    };
  });
}

function createSubscriber(channels: string[], onMsg: () => void) {
  const subscriber = redis.duplicate();
  subscriber.on("error", (err) => console.error(err));
  subscriber.on("connect", async () => {
    console.log("Connected to redis", channels);
    // attempt to fix the slow joiner syndrome
    if (await redis.exists(channels)) onMsg();
  });
  subscriber.connect();
  subscriber.subscribe(channels, (msg, channel) => {
    console.log("onMsg", channel, msg);
    onMsg();
  });
  return subscriber;
}
