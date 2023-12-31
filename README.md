## GooeyGUI - Write production grade web apps in pure Python

GooeyGUI is an alternative to Streamlit, Dash, and other Python UI frameworks. See what it's capable of at [/explore](https://gooey.ai/explore).

The main innovation in this framework is the complete removal of websockets.

You bring your own server, whether its fastapi, flask, or django - allowing you to be more flexible and scale horizontally like you would a classic website.

It also takes full advantage of SSR which means you get static HTML rendering and SEO goodness out of the box.

### Prerequisites
1. Install Node v18 (We recommend using [nvm](https://github.com/nvm-sh/nvm))

```bash
nvm install 18.12.0
```

2. Install Python 3.10+ (We recommend using [pyenv](https://github.com/pyenv/pyenv))

3. Install & start redis. 

E.g. on Mac - https://redis.io/docs/getting-started/installation/install-redis-on-mac-os/
```bash
brew install redis
brew services start redis
```

### Setup

1. Clone this repo

```bash
git clone https://github.com/GooeyAI/gooey-gui
```

2. Install node dependencies

```bash
cd gooey-gui
npm install
```

3. Install python dependencies

```bash
cd your-python-project
pip install gooey-gui
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
uvicorn main:app --reload
```

Run the Frontend:

```bash
cd gooey-gui
npm run dev
```

Open the browser at `localhost:3000` and you should see the following 🎉

<img width="341" alt="image" src="https://github-production-user-asset-6210df.s3.amazonaws.com/19492893/275203972-94dba9a2-7f49-44d9-8325-4e9338659b29.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAIWNJYAX4CSVEH53A%2F20231110%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20231110T182721Z&X-Amz-Expires=300&X-Amz-Signature=92875972a15c90cd68dfdc4963e312a1db643e30cbeceeae74b370943025c5a9&X-Amz-SignedHeaders=host&actor_id=12608604&key_id=0&repo_id=539671263">

### Adding interactivity

```py
@gui.route(app, "/temp")
def root():
    temperature = gui.slider("Temperature", 0, 100, 50)
    gui.write(f"The temperature is {temperature}")
```


### Sending realtime updates to frontend

Here's a simple counter that updates every second:

```py
from time import sleep


@gui.route(app, "/counter")
def poems():
    count, set_count = gui.use_state(0)

    start_counter = gui.button("Start Counter")
    if start_counter:
        for i in range(10):
            set_count(i)
            sleep(1)

    gui.write(f"### Count: {count}")
```

<img width="342" alt="image" src="https://github-production-user-asset-6210df.s3.amazonaws.com/19492893/275349761-519816ec-d773-4846-a62b-1a22d06fce74.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAIWNJYAX4CSVEH53A%2F20231110%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20231110T182825Z&X-Amz-Expires=300&X-Amz-Signature=be1bd6898b80ca6518af3d668e0ead5cc7953318916bc09c5ce66670383b528e&X-Amz-SignedHeaders=host&actor_id=12608604&key_id=0&repo_id=539671263">


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

@gui.route(app, "/counter")
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

<img width="406" alt="image" src="https://github-production-user-asset-6210df.s3.amazonaws.com/19492893/275349796-5a74bfdd-f7f2-4638-ad8f-05d0d40466a8.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAIWNJYAX4CSVEH53A%2F20231110%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20231110T185540Z&X-Amz-Expires=300&X-Amz-Signature=a1cf3189e04bc300c191139bc8b09bd10a0a830af3e743d9894f0f0a40717af0&X-Amz-SignedHeaders=host&actor_id=12608604&key_id=0&repo_id=539671263">

This works because by default fastapi uses a thread pool. 
So while that counter is running, the other threads are free to handle requests from the frontend.

In production, you can scale horizontally by running multiple instances of your server behind a load balancer, 
and using a task queue like celery to handle long-running tasks, or using [BackgroundTasks](https://fastapi.tiangolo.com/tutorial/background-tasks/) in FastAPI.

### OpenAI Streaming

It's pretty easy to integrate OpenAI's streaming API with GooeyUI. Let's build a poem generator.

```py
@gui.route(app, "/poems")
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

<img width="856" alt="image" src="https://github-production-user-asset-6210df.s3.amazonaws.com/19492893/275349990-c25bdf87-cab3-4d07-829b-5ddcda06be15.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAIWNJYAX4CSVEH53A%2F20231110%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20231110T185607Z&X-Amz-Expires=300&X-Amz-Signature=fd738900bbe3584ec40fe04c1782be23f1b8187273570d94a56ed433524e3e68&X-Amz-SignedHeaders=host&actor_id=12608604&key_id=0&repo_id=539671263">


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

<img width="558" alt="image" src="https://github-production-user-asset-6210df.s3.amazonaws.com/19492893/275350097-fe0d0245-ec82-452b-a14e-566311537414.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAIWNJYAX4CSVEH53A%2F20231110%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20231110T185702Z&X-Amz-Expires=300&X-Amz-Signature=1704cb14019d588cd131b5e26863d3a0499cf462b91590c6a6858c94072e21be&X-Amz-SignedHeaders=host&actor_id=12608604&key_id=0&repo_id=539671263">

