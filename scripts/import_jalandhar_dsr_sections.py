#!/usr/bin/env python3
"""Split the supplied Jalandhar DSR into portal-ready section PDFs.

The script also writes a compact manifest.  It intentionally keeps PDF
contents out of projectState: the portal stores only file URLs and metadata,
which avoids putting hundreds of megabytes of base64 data in the database.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

from pypdf import PdfReader, PdfWriter


# PDF page numbers are one-based.  Boundaries are taken from the PDF's table
# of contents and checked against the actual heading pages where TOC numbers
# overlap (Annexures G, I and J).
SECTIONS = [
    ("front-matter", "Front Matter (cover, contents and preface)", 1, 3, "frontMatter"),
    ("chapter-01-introduction", "Chapter 1 - Introduction", 4, 19, "chapter"),
    ("chapter-02-mining-overview", "Chapter 2 - Overview of Mining Activities", 20, 27, "chapter"),
    ("chapter-03-sediment-deposition", "Chapter 3 - Process of Deposition of Sediments", 28, 29, "chapter"),
    ("chapter-04-general-profile", "Chapter 4 - General Profile of the District", 30, 37, "chapter"),
    ("chapter-05-physiography", "Chapter 5 - Physiography of the District", 38, 46, "chapter"),
    ("chapter-06-geology", "Chapter 6 - Geology and Mineral Wealth", 47, 48, "chapter"),
    ("chapter-07-replenishment", "Chapter 7 - Estimation of Deposits and Replenishment Studies", 49, 62, "chapter"),
    ("chapter-08-transport", "Chapter 8 - Transport", 63, 63, "chapter"),
    ("chapter-09-remedial-measures", "Chapter 9 - Remedial Measures", 64, 68, "chapter"),
    ("chapter-10-conclusion", "Chapter 10 - Conclusion", 69, 69, "chapter"),
    ("plate-01-potential-sandbar-map", "Plate I - Potential Sandbar Map", 70, 131, "plate"),
    ("plate-02-elevation-long-section", "Plate II - Elevation and Longitudinal Cross-section", 132, 134, "plate"),
    ("plate-03-cross-sections", "Plate III - Cross-sections", 135, 213, "plate"),
    ("plate-04-route-map", "Plate IV - Route Map", 214, 256, "plate"),
    ("plate-05-layout-plan", "Plate V - Layout Plan", 257, 289, "plate"),
    ("annexure-a-emgsm", "Annexure A - EMGSM 2020", 290, 406, "annexure"),
    ("annexure-b-committee", "Annexure B - Sub-divisional Committee", 407, 409, "annexure"),
    ("annexure-c-site-photographs", "Annexure C - Site Photographs", 410, 419, "annexure"),
    ("annexure-d-visit-report", "Annexure D - Committee Visit Report", 420, 476, "annexure"),
    ("annexure-e-lab-data", "Annexure E - Specific Gravity and Bulk Density", 477, 491, "annexure"),
    ("annexure-f-sand-ghats", "Annexure F - Final Block Sand Ghats Coordinates", 492, 533, "annexure"),
    ("annexure-g-lithological-sections", "Annexure G - Lithological Sections", 534, 536, "annexure"),
    ("annexure-h-wildlife-certificate", "Annexure H - Wildlife/DFO Certificate", 537, 542, "annexure"),
    ("annexure-i-public-consultation", "Annexure I - Public Consultation", 543, 549, "annexure"),
    ("annexure-j-demand-supply", "Annexure J - Demand and Supply", 550, 559, "annexure"),
    ("annexure-k-executive-summary", "Annexure K - Executive Summary", 560, 570, "annexure"),
]


def split(source: Path, output: Path) -> list[dict]:
    reader = PdfReader(source)
    if len(reader.pages) != 570:
        raise ValueError(f"Expected 570 pages, found {len(reader.pages)}")

    output.mkdir(parents=True, exist_ok=True)
    manifest = []
    for slug, title, start, end, category in SECTIONS:
        writer = PdfWriter()
        for page_number in range(start - 1, end):
            writer.add_page(reader.pages[page_number])
        filename = f"{slug}.pdf"
        destination = output / filename
        with destination.open("wb") as stream:
            writer.write(stream)
        manifest.append({
            "id": slug,
            "title": title,
            "category": category,
            "file": filename,
            "pageStart": start,
            "pageEnd": end,
            "pageCount": end - start + 1,
            "bytes": destination.stat().st_size,
        })

    (output / "manifest.json").write_text(
        json.dumps({
            "sourceFile": source.name,
            "sourcePages": len(reader.pages),
            "district": "Jalandhar",
            "state": "Punjab",
            "year": "2025-26",
            "sections": manifest,
        }, indent=2),
        encoding="utf-8",
    )
    return manifest


def project_payload(manifest: list[dict], output: Path) -> dict:
    """Build the small API payload used to create the portal project."""
    urls = {
        entry["id"]: f"/uploads/jalandhar-dsr-2025-26/{entry['file']}"
        for entry in manifest
    }
    chapter_sections = [entry for entry in manifest if entry["category"] == "chapter"]
    plate_sections = [entry for entry in manifest if entry["category"] == "plate"]
    annexure_sections = [entry for entry in manifest if entry["category"] == "annexure"]
    state = {
        "frontMatter": {
            "title": "District Survey Report - Jalandhar",
            "district": "Jalandhar",
            "state": "Punjab",
            "year": "2025-26",
            "version": "Final Draft",
            "preparedBy": "Sub-Divisional Committee, Jalandhar District",
            "assistedBy": "RSP Green Development and Laboratories Pvt. Ltd.",
            "preface": "Imported from the supplied Jalandhar District Survey Report (November 2025). The original document is retained as 27 separately accessible PDF sections.",
        },
        "chapters": [
            {
                "id": index + 1,
                "name": section["title"],
                "summary": f"Imported from original PDF pages {section['pageStart']}-{section['pageEnd']}.",
                "fileName": section["file"],
                "fileSize": f"{section['bytes'] / 1024 / 1024:.1f} MB",
            }
            for index, section in enumerate(chapter_sections)
        ],
        "plates": [
            {"id": 101 + index, "name": section["title"], "summary": f"Imported PDF pages {section['pageStart']}-{section['pageEnd']}."}
            for index, section in enumerate(plate_sections)
        ],
        "importedSourceDocument": {
            "fileName": "JALANDHAR DSR 28.01.26.pdf",
            "pageCount": 570,
            "importedSections": len(manifest),
            "sourceUrl": "/uploads/jalandhar-dsr-2025-26/front-matter.pdf",
        },
        "sourceSections": [{**entry, "url": urls[entry["id"]]} for entry in manifest],
        "importedAnnexures": [
            {"name": section["title"], "fileName": section["file"], "url": urls[section["id"]], "pages": section["pageCount"]}
            for section in annexure_sections
        ],
    }
    payload = {
        "title": "District Survey Report - Jalandhar (Imported PDF)",
        "projectName": "District Survey Report - Jalandhar (Imported PDF)",
        "district": "Jalandhar",
        "year": "2025-26",
        "mineral": "Minor Minerals / Sand",
        "rivers": "Sutlej River",
        "status": "Ready for Review",
        "progress": 100,
        "projectState": json.dumps(state, ensure_ascii=False),
    }
    (output / "project-payload.json").write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8")
    return payload


def seed_project(projects_file: Path, payload: dict) -> None:
    """Upsert the imported project in the legacy portal's local data store."""
    projects = []
    if projects_file.exists():
        projects = json.loads(projects_file.read_text(encoding="utf-8-sig"))
    title = payload["projectName"]
    project = {
        "id": "jalandhar-dsr-2025-26-imported",
        **payload,
        "progress": 100,
        "status": "Ready for Review",
        "createdAt": "2026-07-13T00:00:00.000Z",
        "signatures": 0,
    }
    matching = [item for item in projects if item.get("projectName") == title]
    projects = [item for item in projects if item.get("projectName") != title]
    projects.insert(0, project)
    projects_file.write_text(json.dumps(projects, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Seeded project in {projects_file} ({len(matching)} prior copy/copies replaced)")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("source", type=Path)
    parser.add_argument("output", type=Path)
    parser.add_argument("--projects-file", type=Path)
    args = parser.parse_args()
    manifest = split(args.source, args.output)
    payload = project_payload(manifest, args.output)
    if args.projects_file:
        seed_project(args.projects_file, payload)
    print(f"Created {len(manifest)} section PDFs in {args.output}")


if __name__ == "__main__":
    main()
