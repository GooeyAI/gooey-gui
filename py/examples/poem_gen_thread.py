import os

import openai
from fastapi import FastAPI

import gooey_gui as gui

app = FastAPI()


@gui.route(app, "/")
def root():
    gui.write("### Poem Generator")
    prompt = gui.text_input(
        "What kind of poem do you want to generate?", value="john lennon"
    )
    if gui.button("Generate 🪄"):
        # set the flag to indicate that the thread should be started
        gui.session_state["generating_poem"] = True

    if not gui.session_state.get("generating_poem"):
        # thread has not started yet, don't render anything
        return

    # start the thread, or if already running, return the result
    result = gui.run_in_thread(
        generate_poem_thread,
        args=[prompt],
        placeholder="Generating...",
        ## if cache=True, the thread will cache its return value and avoid from re-running multiple times for the same args
        # cache=True,
    )
    if result is None:
        # thread has not finished execution, don't render anything
        return

    # thread has finished execution, show result
    gui.write(result)

    # avoid re-running the thread
    gui.session_state["generating_poem"] = False


def generate_poem_thread(prompt: str) -> str:
    openai.api_key = os.getenv("OPENAI_API_KEY")

    completion = openai.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": "You are a brilliant poem writer."},
            {"role": "user", "content": prompt},
        ],
    )
    return completion.choices[0].message.content or ""
