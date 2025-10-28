import mammoth from 'mammoth';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

// Polyfill for DOMMatrix in serverless environments
if (typeof globalThis.DOMMatrix === 'undefined') {
  // @ts-ignore
  globalThis.DOMMatrix = class DOMMatrix {
    constructor(matrix?: number[]) {
      if (matrix) {
        this.a = matrix[0] ?? 1;
        this.b = matrix[1] ?? 0;
        this.c = matrix[2] ?? 0;
        this.d = matrix[3] ?? 1;
        this.e = matrix[4] ?? 0;
        this.f = matrix[5] ?? 0;
      } else {
        this.a = 1;
        this.b = 0;
        this.c = 0;
        this.d = 1;
        this.e = 0;
        this.f = 0;
      }
    }
    a: number;
    b: number;
    c: number;
    d: number;
    e: number;
    f: number;
  };
}

// pdf-parse will be imported dynamically when needed

export class DocumentParserService {
  /**
   * Parse a PDF document using Python script
   */
  async parsePDF(filePath: string): Promise<{ text: string; metadata: { pageCount?: number; wordCount: number } }> {
    try {
      console.log('Attempting to parse PDF:', filePath);
      
      // Use pdf-parse library (v1.1.1)
      const fileBuffer = await fs.readFile(filePath);
      const pdfParse = (await import('pdf-parse')).default;
      const data = await pdfParse(fileBuffer);
      
      console.log('PDF parsed successfully, pages:', data.numpages, 'text length:', data.text.length);
      
      return {
        text: data.text,
        metadata: {
          pageCount: data.numpages,
          wordCount: data.text.split(/\s+/).length,
        },
      };
    } catch (error) {
      console.error('PDF parsing error:', error);
      return {
        text: 'PDF içeriği çıkarılamadı. Lütfen PDF dosyasının metin içeriğini kopyalayıp döküman olarak yükleyin.',
        metadata: {
          pageCount: 0,
          wordCount: 0,
        },
      };
    }
  }

  /**
   * Parse a DOCX document and extract text
   */
  async parseDOCX(filePath: string): Promise<{ text: string; metadata: { pageCount?: number; wordCount: number } }> {
    try {
      const result = await mammoth.extractRawText({ path: filePath });
      const text = result.value;

      return {
        text,
        metadata: {
          wordCount: text.split(/\s+/).length,
        },
      };
    } catch (error) {
      throw new Error(`DOCX parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Parse document based on file extension
   */
  async parseDocument(filePath: string): Promise<{ text: string; metadata: { pageCount?: number; wordCount: number } }> {
    const ext = path.extname(filePath).toLowerCase();

    if (ext === '.pdf') {
      return this.parsePDF(filePath);
    } else if (ext === '.docx' || ext === '.doc') {
      // For .doc files, we'll try to extract text but it may not work perfectly
      return this.parseDOCX(filePath);
    } else {
      throw new Error(`Unsupported file format: ${ext}. Only PDF, DOCX, and DOC are supported.`);
    }
  }

  /**
   * Validate file extension
   */
  validateFileExtension(filename: string): boolean {
    const ext = path.extname(filename).toLowerCase();
    return ext === '.pdf' || ext === '.docx' || ext === '.doc';
  }

  /**
   * Validate file size (max 20MB)
   */
  async validateFileSize(filePath: string, maxSizeBytes: number = 20 * 1024 * 1024): Promise<boolean> {
    try {
      const stats = await fs.stat(filePath);
      return stats.size <= maxSizeBytes;
    } catch (error) {
      return false;
    }
  }
}

export const documentParser = new DocumentParserService();

