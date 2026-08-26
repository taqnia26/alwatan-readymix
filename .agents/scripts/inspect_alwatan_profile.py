from pathlib import Path

import fitz


PDF_PATH = Path("attached_assets/بروفايل_مصنع_الوطن_1787757411448.pdf")
OUTPUT_DIR = Path(".agents/outputs/alwatan-profile")


def main() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    document = fitz.open(PDF_PATH)
    print(f"pages={document.page_count}")

    text_sections: list[str] = []
    for index, page in enumerate(document):
        text_sections.append(f"\n===== PAGE {index + 1} =====\n{page.get_text()}")

    (OUTPUT_DIR / "profile-text.txt").write_text(
        "".join(text_sections),
        encoding="utf-8",
    )

    selected_pages = sorted(
        {
            0,
            1,
            max(0, document.page_count // 2),
            max(0, document.page_count - 3),
            max(0, document.page_count - 2),
            max(0, document.page_count - 1),
        }
    )

    for page_index in selected_pages:
        page = document[page_index]
        pixmap = page.get_pixmap(matrix=fitz.Matrix(1.5, 1.5), alpha=False)
        output_path = OUTPUT_DIR / f"page-{page_index + 1}.png"
        pixmap.save(output_path)
        print(f"rendered={output_path}")


if __name__ == "__main__":
    main()