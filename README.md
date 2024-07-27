## GooeyGUI - Write production grade web apps in pure Python

GooeyGUI is an alternative to Streamlit, Dash, and other Python UI frameworks. See what it's capable of at [gooey.ai/explore](https://gooey.ai/explore).

The main innovation in this framework is the complete removal of websockets.

You bring your own server, whether its fastapi, flask, or django - allowing you to be more flexible and scale horizontally like you would a classic website.

It also takes full advantage of SSR which means you get static HTML rendering and SEO goodness out of the box.

Check out all available components at [gooey.ai/GuiComponents](https://gooey.ai/GuiComponents/).

### Prerequisites

1. Install Node v20 (We recommend using [nvm](https://github.com/nvm-sh/nvm))

2. Install Python 3.10+ (We recommend using [pyenv](https://github.com/pyenv/pyenv))

### Installation

1. Clone this repo

```bash
git clone https://github.com/GooeyAI/gooey-gui
```

2. Install python dependencies

```bash
pip install gooey-gui
```

3. Install & Start the frontend server

```bash
npx gooey-gui
```

or alternatively:

```bash
npm i gooey-gui
npm exec gooey-gui-serve
```

### Usage

```python
from fastapi import FastAPI
import gooey_gui as gui

app = FastAPI()

@gui.route(app, "/")
def root():
    gui.write("""
    # My first app
    Hello *world!*
    """)
```

Copy that to a file main.py.

Run the python server:

```bash
cd your-python-project
uvicorn main:app --port 8080 --reload
```

Open the browser at [localhost:3000](http://localhost:3000/3000) and you should see the following 🎉

<img width="444" alt="image" src="https://github.com/user-attachments/assets/09741704-9d3d-43c1-8fcf-f3e5b0f82b06">

### Adding interactivity

```py
@gui.route(app, "/temp")
def root():
    temperature = gui.slider("Temperature", 0, 100, 50)
    gui.write(f"The temperature is {temperature}")
```

<img width="994" alt="image" src="https://github.com/user-attachments/assets/5432431d-98f4-4088-a224-b2b2b807a303">

### Sending realtime updates to frontend

To enable realtime updates, install & start redis.

E.g. on Mac - https://redis.io/docs/getting-started/installation/install-redis-on-mac-os/

```bash
brew install redis
brew services start redis
```

Here's a simple counter that updates every second:

```py
from time import sleep


@gui.route(app, "/")
def poems():
    count, set_count = gui.use_state(0)

    start_counter = gui.button("Start Counter")
    if start_counter:
        for i in range(10):
            set_count(i)
            sleep(1)

    gui.write(f"### Count: {count}")
```

<img width="517" alt="image" src="https://github.com/user-attachments/assets/ac4638bf-cbd2-4c97-b30c-aec2d0bc0533">

Let's break this down:

First, we create a state variable called `count` and a setter function called `set_count`.
`gui.use_state(<default>)` is similar in spirit to React's useState, but the implementation uses redis pubsub & server sent events to send updates to the frontend.

```py
count, set_count = gui.use_state(0)
```

Next, we create a button called using `gui.button()` which returns `True` when the button is clicked.

```py
start_counter = gui.button("Start Counter")
```

If the button is clicked, we start our blocking loop, that updates the count every second.

```py
if start_counter:
    for i in range(10):
        set_count(i)
        sleep(1)
```

Finally, we render the count using `gui.write()`

```py
gui.write(f"### Count: {count}")
```

### GooeyUI is always interactive

Unlike other UI frameworks that block the main loop of your app, GooeyUI always keeps your app interactive.

Let's add a text input and show the value of the text input below it. Try typing something while the counter is running.

```py
from time import sleep

@gui.route(app, "/")
def poems():
    count, set_count = gui.use_state(0)

    start_counter = gui.button("Start Counter")
    if start_counter:
        for i in range(10):
            set_count(i)
            sleep(1)

    gui.write(f"### Count: {count}")

    text = gui.text_input("Type Something here...")
    gui.write("**You typed:** " + text)
```

<img width="636" alt="image" src="https://github.com/user-attachments/assets/c3a4aaad-779d-44ef-9a2e-2d76445fa5f4">

This works because by default fastapi uses a thread pool.
So while that counter is running, the other threads are free to handle requests from the frontend.

In production, you can scale horizontally by running multiple instances of your server behind a load balancer,
and using a task queue like celery to handle long-running tasks, or using [BackgroundTasks](https://fastapi.tiangolo.com/tutorial/background-tasks/) in FastAPI.

### OpenAI Streaming

It's pretty easy to integrate OpenAI's streaming API with GooeyUI. Let's build a poem generator.

```py
@gui.route(app, "/")
def poems():
    text, set_text = gui.use_state("")

    gui.write("### Poem Generator")

    prompt = gui.text_input("What kind of poem do you want to generate?", value="john lennon")

    if gui.button("Generate 🪄"):
        set_text("Starting...")
        generate_poem(prompt, set_text)

    gui.write(text)


def generate_poem(prompt, set_text):
    openai.api_key = os.getenv("OPENAI_API_KEY")

    completion = openai.ChatCompletion.create(
      model="gpt-3.5-turbo",
      messages=[
        {"role": "system", "content": "You are a brilliant poem writer."},
        {"role": "user", "content": prompt}
      ],
      stream=True,
    )

    text = ""
    for i, chunk in enumerate(completion):
        text += chunk.choices[0].delta.get("content", "")
        if i % 50 == 1: # stream to user every 50 chunks
            set_text(text + "...")

    set_text(text) # final result
```

### File uploads

```py
from fastapi.staticfiles import StaticFiles
from starlette.datastructures import FormData
from starlette.requests import Request
from fastapi import Depends

if not os.path.exists("static"):
    os.mkdir("static")

app.mount("/static", StaticFiles(directory="static"), name="static")

async def request_form_files(request: Request) -> FormData:
    return await request.form()

@app.post("/__/file-upload/")
def file_upload(form_data: FormData = Depends(request_form_files)):
    file = form_data["file"]
    data = file.file.read()
    filename = file.filename
    with open("static/" + filename, "wb") as f:
        f.write(data)
    return {"url": "http://localhost:8000/static/" + filename}


@gui.route(app, "/img")
def upload():
    uploaded_file = gui.file_uploader("Upload an image", accept=["image/*"])
    if uploaded_file is not None:
        gui.image(uploaded_file)
```

<img width="548" alt="image" src="https://github.com/user-attachments/assets/0cd5cb1d-ebdc-4815-821d-ac6118d9e6fe">
