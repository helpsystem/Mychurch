import os
import pandas as pd
from PyPDF2 import PdfReader

def read_pdf(pdf_path):
    reader = PdfReader(pdf_path)
    text = ""
    for page in reader.pages:
        text += page.extract_text()
    return text

def process_pdfs(directory):
    pdf_files = [f for f in os.listdir(directory) if f.endswith('.pdf')]
    data = []
    for pdf_file in pdf_files:
        pdf_path = os.path.join(directory, pdf_file)
        text = read_pdf(pdf_path)
        # Add text processing logic here
        data.append({'file_name': pdf_file, 'text_content': text})
    return data

if __name__ == "__main__":
    directory = "./pdfs"
    result = process_pdfs(directory)
    print(result)
