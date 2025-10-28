#!/usr/bin/env python3
"""
Simple PDF text extraction using PyPDF2
Usage: python pdf_parser.py <pdf_path> <output_json_path>
"""

import sys
import json
from pathlib import Path

try:
    from PyPDF2 import PdfReader
except ImportError:
    print('{"error": "PyPDF2 not installed. Run: pip install PyPDF2"}', file=sys.stderr)
    sys.exit(1)


def extract_text_from_pdf(pdf_path: str) -> dict:
    """Extract text from PDF file"""
    try:
        reader = PdfReader(pdf_path)
        num_pages = len(reader.pages)
        text = ''
        
        for page in reader.pages:
            text += page.extract_text() + '\n'
        
        word_count = len(text.split())
        
        return {
            'text': text.strip(),
            'pageCount': num_pages,
            'wordCount': word_count,
            'success': True
        }
    except Exception as e:
        return {
            'text': '',
            'pageCount': 0,
            'wordCount': 0,
            'success': False,
            'error': str(e)
        }


if __name__ == '__main__':
    if len(sys.argv) != 3:
        print('{"error": "Usage: python pdf_parser.py <pdf_path> <output_json_path>"}', file=sys.stderr)
        sys.exit(1)
    
    pdf_path = sys.argv[1]
    output_path = sys.argv[2]
    
    result = extract_text_from_pdf(pdf_path)
    
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(result, f, ensure_ascii=False, indent=2)
    
    sys.exit(0 if result['success'] else 1)

