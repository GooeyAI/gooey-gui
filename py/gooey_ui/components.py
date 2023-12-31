import base64
import hashlib
import math
import textwrap
import typing

from furl import furl

from gooey_ui import state

T = typing.TypeVar("T")
LabelVisibility = typing.Literal["visible", "collapsed"]


def _default_format(value: typing.Any) -> str:
    if value is None:
        return "---"
    return str(value)


def dummy(*args, **kwargs):
    return state.NestingCtx()


set_page_config = dummy
form = dummy
plotly_chart = dummy
dataframe = dummy


def nav_tabs():
    return _node("nav-tabs")


def nav_item(href: str, *, active: bool):
    return _node("nav-item", to=href, active="true" if active else None)


def nav_tab_content():
    return _node("nav-tab-content")


def div(**props) -> state.NestingCtx:
    return tag("div", **props)


def link(*, to: str, **props) -> state.NestingCtx:
    return _node("Link", to=to, **props)


def tag(tag_name: str, **props) -> state.NestingCtx:
    props["__reactjsxelement"] = tag_name
    return _node("tag", **props)


def html(body: str, **props):
    props["className"] = props.get("className", "") + " gui-html-container"
    return _node("html", body=body, **props)


def write(*objs: typing.Any, unsafe_allow_html=False, **props):
    for obj in objs:
        markdown(
            obj if isinstance(obj, str) else repr(obj),
            unsafe_allow_html=unsafe_allow_html,
            **props,
        )


def markdown(body: str, *, unsafe_allow_html=False, **props):
    if body is None:
        return _node("markdown", body="", **props)
    props["className"] = (
        props.get("className", "") + " gui-html-container gui-md-container"
    )
    return _node("markdown", body=dedent(body).strip(), **props)


def _node(name: str, **props):
    node = state.RenderTreeNode(name=name, props=props)
    node.mount()
    return state.NestingCtx(node)


def text(body: str, *, unsafe_allow_html=False, **props):
    state.RenderTreeNode(
        name="pre",
        props=dict(body=dedent(body), **props),
    ).mount()


def error(body: str, icon: str = "🔥", *, unsafe_allow_html=False):
    if not isinstance(body, str):
        body = repr(body)
    with div(
        style=dict(
            backgroundColor="rgba(255, 108, 108, 0.2)",
            padding="1rem",
            paddingBottom="0",
            marginBottom="0.5rem",
            borderRadius="0.25rem",
            display="flex",
            gap="0.5rem",
        )
    ):
        markdown(icon)
        with div():
            markdown(dedent(body), unsafe_allow_html=unsafe_allow_html)


def success(body: str, icon: str = "✅", *, unsafe_allow_html=False):
    if not isinstance(body, str):
        body = repr(body)
    with div(
        style=dict(
            backgroundColor="rgba(108, 255, 108, 0.2)",
            padding="1rem",
            paddingBottom="0",
            marginBottom="0.5rem",
            borderRadius="0.25rem",
            display="flex",
            gap="0.5rem",
        )
    ):
        markdown(icon)
        markdown(dedent(body), unsafe_allow_html=unsafe_allow_html)


def caption(body: str, **props):
    style = props.setdefault("style", {"fontSize": "0.9rem"})
    markdown(body, className="text-muted", **props)


def option_menu(*args, options, **kwargs):
    return tabs(options)


def tabs(labels: list[str]) -> list[state.NestingCtx]:
    parent = state.RenderTreeNode(
        name="tabs",
        children=[
            state.RenderTreeNode(
                name="tab",
                props=dict(label=dedent(label)),
            )
            for label in labels
        ],
    ).mount()
    return [state.NestingCtx(tab) for tab in parent.children]


def columns(
    spec,
    *,
    gap: str = None,
    responsive: bool = True,
    **props,
) -> tuple[state.NestingCtx, ...]:
    if isinstance(spec, int):
        spec = [1] * spec
    total_weight = sum(spec)
    props.setdefault("className", "row")
    with div(**props):
        return tuple(
            div(className=f"col-lg-{p} {'col-12' if responsive else f'col-{p}'}")
            for w in spec
            if (p := f"{round(w / total_weight * 12)}")
        )


def image(
    src,
    caption: str = None,
    alt: str = None,
    **props,
):
    try:
        import numpy as np

        is_np_img = isinstance(src, np.ndarray)
    except ImportError:
        is_np_img = False
    if is_np_img:
        if not src.shape:
            return
        # ensure image is not too large
        src = resize_img_scale(src, (128, 128))
        data = cv2.imencode(".png", src)[1].tobytes()
        # convert to base64
        b64 = base64.b64encode(data).decode("utf-8")
        src = "data:image/png;base64," + b64
    if not src:
        return
    state.RenderTreeNode(
        name="img",
        props=dict(
            src=src,
            caption=dedent(caption),
            alt=alt or caption,
            **props,
        ),
    ).mount()


def resize_img_scale(img_cv2, size: tuple[int, int]):
    from PIL import Image

    img_cv2 = bytes_to_cv2_img(img_bytes)
    img_pil = Image.fromarray(img_cv2)
    downscale_factor = get_downscale_factor(im_size=img_pil.size, max_size=size)
    if downscale_factor:
        img_pil = ImageOps.scale(img_pil, downscale_factor)
    return np.array(img_pil)


def get_downscale_factor(
    *, im_size: tuple[int, int], max_size: tuple[int, int]
) -> float | None:
    downscale_factor = math.sqrt(
        (max_size[0] * max_size[1]) / (im_size[0] * im_size[1])
    )
    if downscale_factor < 0.99:
        return downscale_factor
    else:
        return None


def video(src: str, caption: str = None):
    if not src:
        return
    if isinstance(src, str):
        # https://muffinman.io/blog/hack-for-ios-safari-to-display-html-video-thumbnail/
        f = furl(src)
        f.fragment.args["t"] = "0.001"
        src = f.url
    state.RenderTreeNode(
        name="video",
        props=dict(src=src, caption=dedent(caption)),
    ).mount()


def audio(src: str, caption: str = None):
    if not src:
        return
    state.RenderTreeNode(
        name="audio",
        props=dict(src=src, caption=dedent(caption)),
    ).mount()


def text_area(
    label: str,
    value: str = "",
    height: int = 100,
    key: str = None,
    help: str = None,
    placeholder: str = None,
    disabled: bool = False,
    label_visibility: LabelVisibility = "visible",
    **props,
) -> str:
    style = props.setdefault("style", {})
    if key:
        assert not value, "only one of value or key can be provided"
    else:
        key = md5_values(
            "textarea", label, height, help, value, placeholder, label_visibility
        )
    value = str(state.session_state.setdefault(key, value))
    if label_visibility != "visible":
        label = None
    if disabled:
        max_height = f"{height}px"
        rows = nrows_for_text(value, height, min_rows=1)
    else:
        max_height = "90vh"
        rows = nrows_for_text(value, height)
    style.setdefault("maxHeight", max_height)
    props.setdefault("rows", rows)
    state.RenderTreeNode(
        name="textarea",
        props=dict(
            name=key,
            label=dedent(label),
            defaultValue=value,
            help=help,
            placeholder=placeholder,
            disabled=disabled,
            **props,
        ),
    ).mount()
    return value or ""


def nrows_for_text(
    text: str,
    max_height_px: int,
    min_rows: int = 2,
    row_height_px: int = 30,
    row_width_px: int = 80,
) -> int:
    max_rows = max_height_px // row_height_px
    nrows = math.ceil(
        sum(len(line) / row_width_px for line in (text or "").strip().splitlines())
    )
    nrows = min(max(nrows, min_rows), max_rows)
    return nrows


def multiselect(
    label: str,
    options: typing.Sequence[T],
    format_func: typing.Callable[[T], typing.Any] = _default_format,
    key: str = None,
    help: str = None,
    allow_none: bool = False,
    *,
    disabled: bool = False,
) -> list[T]:
    if not options:
        return []
    options = list(options)
    if not key:
        key = md5_values("multiselect", label, options, help)
    value = state.session_state.get(key) or []
    if not isinstance(value, list):
        value = [value]
    value = [o if o in options else options[0] for o in value]
    if not allow_none and not value:
        value = [options[0]]
    state.session_state[key] = value
    state.RenderTreeNode(
        name="select",
        props=dict(
            name=key,
            label=dedent(label),
            help=help,
            isDisabled=disabled,
            isMulti=True,
            defaultValue=value,
            allow_none=allow_none,
            options=[
                {"value": option, "label": str(format_func(option))}
                for option in options
            ],
        ),
    ).mount()
    return value


def selectbox(
    label: str,
    options: typing.Sequence[T],
    format_func: typing.Callable[[T], typing.Any] = _default_format,
    key: str = None,
    help: str = None,
    *,
    disabled: bool = False,
    label_visibility: LabelVisibility = "visible",
    default_value: T = None,
) -> T | None:
    if not options:
        return None
    if label_visibility != "visible":
        label = None
    options = list(options)
    if not key:
        key = md5_values("select", label, options, help, label_visibility)
    value = state.session_state.get(key)
    if key not in state.session_state or value not in options:
        value = default_value or options[0]
    state.session_state.setdefault(key, value)
    state.RenderTreeNode(
        name="select",
        props=dict(
            name=key,
            label=dedent(label),
            help=help,
            isDisabled=disabled,
            defaultValue=value,
            options=[
                {"value": option, "label": str(format_func(option))}
                for option in options
            ],
        ),
    ).mount()
    return value


def button(
    label: str,
    key: str = None,
    help: str = None,
    *,
    type: typing.Literal["primary", "secondary"] = "secondary",
    disabled: bool = False,
    **props,
) -> bool:
    if not key:
        key = md5_values("button", label, help, type, props)
    state.RenderTreeNode(
        name="gui-button",
        props=dict(
            type="submit",
            value="yes",
            name=key,
            label=dedent(label),
            help=help,
            disabled=disabled,
            **props,
        ),
    ).mount()
    return bool(state.session_state.pop(key, False))


form_submit_button = button


def expander(label: str, *, expanded: bool = False, **props):
    node = state.RenderTreeNode(
        name="expander",
        props=dict(
            label=dedent(label),
            open=expanded,
            **props,
        ),
    )
    node.mount()
    return state.NestingCtx(node)


def file_uploader(
    label: str,
    accept: list[str] = None,
    accept_multiple_files=False,
    key: str = None,
    upload_key: str = None,
    help: str = None,
    *,
    disabled: bool = False,
    label_visibility: LabelVisibility = "visible",
    upload_meta: dict = None,
):
    if label_visibility != "visible":
        label = None
    key = upload_key or key
    if not key:
        key = md5_values(
            "file_uploader",
            label,
            accept,
            accept_multiple_files,
            help,
            label_visibility,
        )
    value = state.session_state.get(key)
    if not value:
        if accept_multiple_files:
            value = []
        else:
            value = ""
    state.session_state[key] = value
    state.RenderTreeNode(
        name="input",
        props=dict(
            type="file",
            name=key,
            label=dedent(label),
            help=help,
            disabled=disabled,
            accept=accept,
            multiple=accept_multiple_files,
            defaultValue=value,
            uploadMeta=upload_meta,
        ),
    ).mount()
    return value or ""


def json(value: typing.Any, expanded: bool = False, depth: int = 1):
    state.RenderTreeNode(
        name="json",
        props=dict(
            value=value,
            expanded=expanded,
            defaultInspectDepth=3 if expanded else depth,
        ),
    ).mount()


def data_table(file_url: str):
    return _node("data-table", fileUrl=file_url)


def table(df: "pd.DataFrame"):
    state.RenderTreeNode(
        name="table",
        children=[
            state.RenderTreeNode(
                name="thead",
                children=[
                    state.RenderTreeNode(
                        name="tr",
                        children=[
                            state.RenderTreeNode(
                                name="th",
                                children=[
                                    state.RenderTreeNode(
                                        name="markdown",
                                        props=dict(body=dedent(col)),
                                    ),
                                ],
                            )
                            for col in df.columns
                        ],
                    ),
                ],
            ),
            state.RenderTreeNode(
                name="tbody",
                children=[
                    state.RenderTreeNode(
                        name="tr",
                        children=[
                            state.RenderTreeNode(
                                name="td",
                                children=[
                                    state.RenderTreeNode(
                                        name="markdown",
                                        props=dict(body=dedent(str(value))),
                                    ),
                                ],
                            )
                            for value in row
                        ],
                    )
                    for row in df.itertuples(index=False)
                ],
            ),
        ],
    ).mount()


def radio(
    label: str,
    options: typing.Sequence[T],
    format_func: typing.Callable[[T], typing.Any] = _default_format,
    key: str = None,
    help: str = None,
    *,
    disabled: bool = False,
    label_visibility: LabelVisibility = "visible",
) -> T | None:
    if not options:
        return None
    options = list(options)
    if not key:
        key = md5_values("radio", label, options, help, label_visibility)
    value = state.session_state.get(key)
    if key not in state.session_state or value not in options:
        value = options[0]
    state.session_state.setdefault(key, value)
    if label_visibility != "visible":
        label = None
    markdown(label)
    for option in options:
        state.RenderTreeNode(
            name="input",
            props=dict(
                type="radio",
                name=key,
                label=dedent(str(format_func(option))),
                value=option,
                defaultChecked=bool(value == option),
                help=help,
                disabled=disabled,
            ),
        ).mount()
    return value


def text_input(
    label: str,
    value: str = "",
    max_chars: str = None,
    key: str = None,
    help: str = None,
    *,
    placeholder: str = None,
    disabled: bool = False,
    label_visibility: LabelVisibility = "visible",
    **props,
) -> str:
    value = _input_widget(
        input_type="text",
        label=label,
        value=value,
        key=key,
        help=help,
        disabled=disabled,
        label_visibility=label_visibility,
        maxLength=max_chars,
        placeholder=placeholder,
        **props,
    )
    return value or ""


def slider(
    label: str,
    min_value: float = None,
    max_value: float = None,
    value: float = None,
    step: float = None,
    key: str = None,
    help: str = None,
    *,
    disabled: bool = False,
) -> float:
    value = _input_widget(
        input_type="range",
        label=label,
        value=value,
        key=key,
        help=help,
        disabled=disabled,
        min=min_value,
        max=max_value,
        step=_step_value(min_value, max_value, step),
    )
    return value or 0


def number_input(
    label: str,
    min_value: float = None,
    max_value: float = None,
    value: float = None,
    step: float = None,
    key: str = None,
    help: str = None,
    *,
    disabled: bool = False,
) -> float:
    value = _input_widget(
        input_type="number",
        inputMode="decimal",
        label=label,
        value=value,
        key=key,
        help=help,
        disabled=disabled,
        min=min_value,
        max=max_value,
        step=_step_value(min_value, max_value, step),
    )
    return value or 0


def _step_value(
    min_value: float | None, max_value: float | None, step: float | None
) -> float:
    if step:
        return step
    elif isinstance(min_value, float) or isinstance(max_value, float):
        return 0.1
    else:
        return 1


def checkbox(
    label: str,
    value: bool = False,
    key: str = None,
    help: str = None,
    *,
    disabled: bool = False,
    label_visibility: LabelVisibility = "visible",
) -> bool:
    value = _input_widget(
        input_type="checkbox",
        label=label,
        value=value,
        key=key,
        help=help,
        disabled=disabled,
        label_visibility=label_visibility,
        default_value_attr="defaultChecked",
    )
    return bool(value)


def _input_widget(
    *,
    input_type: str,
    label: str,
    value: typing.Any = None,
    key: str = None,
    help: str = None,
    disabled: bool = False,
    label_visibility: LabelVisibility = "visible",
    default_value_attr: str = "defaultValue",
    **kwargs,
) -> typing.Any:
    # if key:
    #     assert not value, "only one of value or key can be provided"
    # else:
    if not key:
        key = md5_values("input", input_type, label, help, label_visibility)
    value = state.session_state.setdefault(key, value)
    if label_visibility != "visible":
        label = None
    state.RenderTreeNode(
        name="input",
        props={
            "type": input_type,
            "name": key,
            "label": dedent(label),
            default_value_attr: value,
            "help": help,
            "disabled": disabled,
            **kwargs,
        },
    ).mount()
    return value


def dedent(text: str | None) -> str | None:
    if not text:
        return text
    return textwrap.dedent(text)


def spinner(text: str, scroll_into_view=True):
    if scroll_into_view:
        # language=HTML
        script = """
<script>
window.waitUntilHydrated.then(() => {
    document.querySelector(".gooey-spinner-top").scrollIntoView();
});
</script>
        """
    else:
        script = ""

    html(
        # language=HTML
        f"""
<div class="gooey-spinner-top" style="padding-top: 8px; padding-bottom: 8px;">
    <div class="gooey-spinner"></div>
    <div class="gooey-spinner-text">{text}</div>
</div>
{script}
        """
    )


def md5_values(name, *values) -> str:
    strval = ".".join(map(repr, values))
    return name + "/" + hashlib.md5(strval.encode()).hexdigest()
