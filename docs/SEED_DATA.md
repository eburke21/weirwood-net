# Seed Data — Weirwood.net

## Overview

The seed dataset contains **75 hand-curated prophecies** and **23 canonical events** from A Song of Ice and Fire (books 1-5 only).

## Data Sources

- **Primary:** The five published ASOIAF novels by George R.R. Martin
- **Reference:** ASOIAF wiki community for chapter numbering and prophecy cataloging
- **Scope:** Books only — no TV show content (HBO's Game of Thrones, House of the Dragon)

## Quality Checklist

Every prophecy entry is verified against this checklist:

- [ ] **Citation:** Accurate `source_chapter` in format "ASOS Catelyn VII" (book abbreviation + POV character + chapter number)
- [ ] **Description:** Paraphrased, not direct quotes from the books
- [ ] **Type:** Correct classification among 9 types (verbal_prophecy, dream_vision, flame_vision, song, house_words, physical_sign, greendream, house_of_undying, other)
- [ ] **Status:** Accurate fulfillment status (fulfilled, partially_fulfilled, unfulfilled, debated, subverted)
- [ ] **Evidence:** For fulfilled/partial entries, specific fulfillment evidence provided
- [ ] **Characters:** At least 1 subject character listed
- [ ] **Keywords:** 3-6 thematic keywords per entry
- [ ] **Notes:** Added for debated or complex prophecies explaining alternative interpretations

## Coverage

| Prophecy Type | Count | Examples |
|--------------|-------|---------|
| verbal_prophecy | 15 | Valonqar, Azor Ahai, Quaithe's warnings, Mirri Maz Duur |
| dream_vision | 10 | Daenerys's dragon dreams, Jaime's weirwood dream, Theon's feast |
| flame_vision | 7 | Melisandre's Snow visions, daggers in the dark, towers by the sea |
| song | 7 | Patchface songs, Ghost of High Heart visions |
| house_words | 5 | Stark, Targaryen, Greyjoy, Martell, Baratheon |
| physical_sign | 8 | Red comet, direwolf litter, dragon eggs, Dragonbinder |
| greendream | 7 | Jojen's dreams, Bran's weirwood visions |
| house_of_undying | 9 | All major visions from ACOK Daenerys IV |
| other | 7 | Narrative foreshadowing, Rains of Castamere |

## How to Add New Prophecies

1. Edit `backend/app/seed/prophecies.json`
2. Follow the JSON format:
```json
{
  "title": "Short label",
  "description": "Paraphrased description (NOT direct quotes)",
  "source_character": "Who delivers it",
  "source_chapter": "ASOS Catelyn VII",
  "source_book": 3,
  "prophecy_type": "verbal_prophecy",
  "status": "unfulfilled",
  "fulfillment_evidence": null,
  "subject_characters": ["Character Name"],
  "keywords": ["keyword1", "keyword2", "keyword3"],
  "notes": "Optional editorial notes"
}
```
3. Delete `backend/data/weirwood.db`
4. Restart the backend — new data will be seeded automatically

## Copyright Note

All prophecy descriptions are paraphrased from the original novels. No direct quotes are used. This project is for educational and portfolio purposes.
