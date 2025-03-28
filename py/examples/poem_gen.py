import os

import openai
from fastapi import FastAPI

import gooey_gui as gui

app = FastAPI()


@gui.route(app, "/")
def poems():
    text, set_text = gui.use_state("")

    gui.write("### Poem Generator")

    prompt = gui.text_input(
        "What kind of poem do you want to generate?", value="john lennon"
    )

    if gui.button("Generate 🪄"):
        set_text("Starting...")
        generate_poem(prompt, set_text)

    gui.write(text)


def generate_poem(prompt, set_text):
    openai.api_key = os.getenv("OPENAI_API_KEY")

    completion = openai.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": "You are a brilliant poem writer."},
            {"role": "user", "content": prompt},
        ],
        stream=True,
    )

    text = ""
    for i, chunk in enumerate(completion):
        text += chunk.choices[0].delta.content or ""
        if i % 50 == 1:  # stream to user every 50 chunks
            set_text(text + "...")

    set_text(text)  # final result
