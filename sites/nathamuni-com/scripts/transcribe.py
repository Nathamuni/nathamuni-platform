"""Transcribe reel audio with faster-whisper. Runs on the GitHub Actions runner, never locally.

Usage: python transcribe.py <work_dir>
Reads  <work_dir>/manifest.json  [{"shortcode": ..., "wav": ...}, ...]
Writes <work_dir>/results.json   {shortcode: {status, lang, text, hook, speechSec}}

Results are flushed after every reel, so a run that hits the job time limit
still keeps what it finished.
"""
import json
import os
import sys
import time
import wave

import numpy as np
from faster_whisper import WhisperModel

MODEL = os.environ.get("WHISPER_MODEL", "large-v3")
HOOK_SECONDS = 5.0  # what the viewer hears before deciding to scroll
OK_LANGS = {"ta", "en"}  # Tanglish is detected as either; anything else is a misdetect

work = sys.argv[1]
manifest = json.load(open(os.path.join(work, "manifest.json")))
out_path = os.path.join(work, "results.json")
results = {}

if not manifest:
    json.dump(results, open(out_path, "w"))
    print("Nothing to transcribe.")
    sys.exit(0)

t0 = time.time()
model = WhisperModel(MODEL, device="cpu", compute_type="int8", cpu_threads=os.cpu_count() or 4)
print(f"Loaded {MODEL} in {time.time() - t0:.0f}s")


def load_wav(path):
    """16 kHz mono s16 WAV (made by ffmpeg in prep) -> float32 array.
    Bypasses faster-whisper's PyAV decoder, which breaks on newer PyAV releases."""
    with wave.open(path, "rb") as w:
        assert w.getframerate() == 16000 and w.getnchannels() == 1 and w.getsampwidth() == 2
        pcm = w.readframes(w.getnframes())
    return np.frombuffer(pcm, dtype=np.int16).astype(np.float32) / 32768.0


def run(wav, language=None):
    segs, info = model.transcribe(
        load_wav(wav), language=language, vad_filter=True, beam_size=5, condition_on_previous_text=False
    )
    return list(segs), info


for item in manifest:
    sc, wav = item["shortcode"], item["wav"]
    t = time.time()
    try:
        segs, info = run(wav)
        lang = info.language
        if segs and lang not in OK_LANGS:
            segs, info = run(wav, language="ta")
            lang = "ta"
        text = " ".join(s.text.strip() for s in segs).strip()
        if not text:
            results[sc] = {"status": "no-speech"}
        else:
            hook = " ".join(s.text.strip() for s in segs if s.start < HOOK_SECONDS).strip()
            results[sc] = {
                "status": "ok",
                "lang": lang,
                "text": text,
                "hook": hook or segs[0].text.strip(),
                "speechSec": round(sum(s.end - s.start for s in segs), 1),
            }
        print(f"{sc}: {results[sc]['status']} {lang} in {time.time() - t:.0f}s")
    except Exception as e:  # one bad file must not stop the batch
        results[sc] = {"status": "error", "error": str(e)[:200]}
        print(f"{sc}: error {e}")
    json.dump(results, open(out_path, "w"), ensure_ascii=False)

print(f"Done {len(results)} reels in {time.time() - t0:.0f}s")
if results and all(r["status"] == "error" for r in results.values()):
    print("Every reel failed: marking the job as failed so it shows red.")
    sys.exit(1)
