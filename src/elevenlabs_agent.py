"""Minimal ElevenLabs wrapper.
Works only if ELEVENLABS_API_KEY is set. Safe no-op fallback for demos/dev.
"""
from __future__ import annotations

import os
from dotenv import load_dotenv

load_dotenv()


def speak(text: str, voice: str = "Rachel") -> None:
    api_key = os.getenv("ELEVENLABS_API_KEY")
    if not api_key:
        print(f"[ElevenLabs disabled] {text}")
        return

    try:
        # Newer SDKs vary by version; import lazily and fail gracefully
        from elevenlabs import generate, play, set_api_key  # type: ignore
        set_api_key(api_key)
        audio = generate(text=text, voice=voice, model="eleven_monolingual_v1")
        play(audio)
    except Exception as e:
        print(f"[ElevenLabs error] {e}")
        print(f"Agent text: {text}")
