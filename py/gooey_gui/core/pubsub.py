import hashlib
import json
import typing
from contextlib import contextmanager
from functools import lru_cache
from time import time

from loguru import logger

from .state import threadlocal

T = typing.TypeVar("T")


@lru_cache
def get_redis():
    import redis
    from decouple import config

    return redis.Redis.from_url(config("REDIS_URL", "redis://localhost:6379"))


def realtime_clear_subs():
    threadlocal.channels = []


def get_subscriptions() -> list[str]:
    try:
        return threadlocal.channels
    except AttributeError:
        threadlocal.channels = []
        return threadlocal.channels


def realtime_pull(channels: list[str]) -> list[typing.Any]:
    channels = [f"gooey-gui/state/{channel}" for channel in channels]
    threadlocal.channels = channels
    r = get_redis()
    out = [
        json.loads(value) if (value := r.get(channel)) else None for channel in channels
    ]
    return out


def realtime_push(channel: str, value: typing.Any = "ping", ex=None):
    from fastapi.encoders import jsonable_encoder

    channel = f"gooey-gui/state/{channel}"
    msg = json.dumps(jsonable_encoder(value))
    r = get_redis()
    r.set(channel, msg, ex=ex)
    r.publish(channel, json.dumps(time()))
    if isinstance(value, dict):
        run_status = value.get("__run_status")
        logger.info(f"publish {channel=} {run_status=}")
    else:
        logger.info(f"publish {channel=}")


@contextmanager
def realtime_subscribe(channel: str) -> typing.Generator:
    channel = f"gooey-gui/state/{channel}"
    r = get_redis()
    pubsub = r.pubsub()
    pubsub.subscribe(channel)
    logger.info(f"subscribe {channel=}")
    try:
        yield _realtime_sub_gen(channel, pubsub)
    finally:
        logger.info(f"unsubscribe {channel=}")
        pubsub.unsubscribe(channel)
        pubsub.close()


def _realtime_sub_gen(channel: str, pubsub: "redis.client.PubSub") -> typing.Generator:
    while True:
        message = pubsub.get_message(timeout=10)
        if not (message and message["type"] == "message"):
            continue
        r = get_redis()
        value = json.loads(r.get(channel))
        if isinstance(value, dict):
            run_status = value.get("__run_status")
            logger.info(f"realtime_subscribe: {channel=} {run_status=}")
        else:
            logger.info(f"realtime_subscribe: {channel=}")
        yield value


def md5_values(*values) -> str:
    strval = ".".join(map(repr, values))
    return hashlib.md5(strval.encode()).hexdigest()
