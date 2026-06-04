# burmeserecp.tech

An iOS-inspired text-to-speech web app powered by Edge TTS.

## Run locally

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app:app --reload
```

Then open `http://127.0.0.1:8000`.
