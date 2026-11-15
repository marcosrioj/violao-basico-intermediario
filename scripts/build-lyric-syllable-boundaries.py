"""Regenerate written syllable boundaries only; this does not measure vocal timing.

Requires Pyphen 0.17.2 in the Python environment used for this build script.
The application ships the results for supplied words, not the hyphenation package.
"""

import json
import re
from pathlib import Path

import pyphen

root = Path(__file__).resolve().parents[1]
hyphenator = pyphen.Pyphen(lang="pt_BR", left=1, right=1)
lines = []
for source in sorted((root / "src/content").glob("song-lyrics-[123].json")):
    for song in json.loads(source.read_text()).values():
        lines.extend(song["providedLines"])
words = sorted(set(re.findall(r"[^\W\d_]+(?:[’'][^\W\d_]+)*", " ".join(lines).lower())))
boundaries = {word: [int(offset) for offset in hyphenator.positions(word)] for word in words}
target = root / "src/content/lyric-syllable-boundaries.json"
target.write_text(json.dumps(boundaries, ensure_ascii=False, indent=2) + "\n")
print(f"Divisão escrita preparada para {len(words)} palavras; tempos vocais não inferidos.")
