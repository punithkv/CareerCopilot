import fitz
def extract_text_from_pdf(file_path: str) -> str:
    document = fitz.open(file_path)
    text = []
    for page in document:
        page_text = page.get_text()
        if page_text.strip():
            text.append(page_text)
    document.close()
    return "\n".join(text)