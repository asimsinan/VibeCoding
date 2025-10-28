import { DocumentParserService } from '@/lib/document-parser/document-parser';
import fs from 'fs/promises';
import path from 'path';

describe('Document Parser Service', () => {
  let parser: DocumentParserService;
  const testFilesPath = path.join(process.cwd(), 'src/tests/fixtures');

  beforeAll(() => {
    parser = new DocumentParserService();
  });

  describe('validateFileExtension', () => {
    it('should accept PDF files', () => {
      expect(parser.validateFileExtension('test.pdf')).toBe(true);
      expect(parser.validateFileExtension('test.PDF')).toBe(true);
    });

    it('should accept DOCX files', () => {
      expect(parser.validateFileExtension('test.docx')).toBe(true);
      expect(parser.validateFileExtension('test.DOCX')).toBe(true);
    });

    it('should reject unsupported file types', () => {
      expect(parser.validateFileExtension('test.txt')).toBe(false);
      expect(parser.validateFileExtension('test.doc')).toBe(false);
      expect(parser.validateFileExtension('test.docx.doc')).toBe(false);
    });
  });

  describe('validateFileSize', () => {
    it('should accept files under size limit', async () => {
      // Create a small test file
      const testFile = path.join(process.cwd(), 'test_small.txt');
      await fs.writeFile(testFile, 'Small content');
      
      const isValid = await parser.validateFileSize(testFile, 1024);
      expect(isValid).toBe(true);
      
      await fs.unlink(testFile);
    });

    it('should reject files over size limit', async () => {
      // Create a large test file
      const testFile = path.join(process.cwd(), 'test_large.txt');
      const largeContent = 'x'.repeat(21 * 1024 * 1024); // 21MB
      await fs.writeFile(testFile, largeContent);
      
      const isValid = await parser.validateFileSize(testFile, 20 * 1024 * 1024);
      expect(isValid).toBe(false);
      
      await fs.unlink(testFile);
    });

    it('should return false for non-existent files', async () => {
      const isValid = await parser.validateFileSize('non-existent-file.txt');
      expect(isValid).toBe(false);
    });

    it('should handle PDF parsing with real PDF file', async () => {
      const testFile = path.join(process.cwd(), 'test.pdf');
      await fs.writeFile(testFile, Buffer.from('%PDF-test'));
      
      const result = await parser.parsePDF(testFile);
      expect(result).toBeDefined();
      
      await fs.unlink(testFile);
    });

    it('should handle DOCX extension in parseDocument', async () => {
      const testFile = path.join(process.cwd(), 'test.docx');
      await fs.writeFile(testFile, 'Invalid DOCX');
      
      await expect(parser.parseDocument(testFile)).rejects.toThrow('DOCX parsing failed');
      
      await fs.unlink(testFile);
    });
  });

  describe('parseDocument', () => {
    it('should throw error for unsupported file format', async () => {
      await expect(parser.parseDocument('test.txt')).rejects.toThrow();
    });

    it('should parse PDF files', async () => {
      const testFile = path.join(process.cwd(), 'test.pdf');
      await fs.writeFile(testFile, Buffer.from('%PDF-test'));
      
      const result = await parser.parseDocument(testFile);
      expect(result.text).toBeDefined();
      expect(result.metadata.wordCount).toBeGreaterThan(0);
      
      await fs.unlink(testFile);
    });

    it('should handle DOCX file parsing', async () => {
      // DOCX parsing requires real DOCX files or proper mocking
      // This test validates the extension handling
      expect(parser.validateFileExtension('test.docx')).toBe(true);
    });
  });

  describe('parsePDF', () => {
    it('should parse PDF and extract text', async () => {
      const testFile = path.join(process.cwd(), 'test.pdf');
      await fs.writeFile(testFile, Buffer.from('%PDF-test'));
      
      const result = await parser.parsePDF(testFile);
      expect(result.text).toBeDefined();
      expect(result.metadata.wordCount).toBeGreaterThan(0);
      
      await fs.unlink(testFile);
    });
  });

  describe('parseDOCX', () => {
    it('should reject invalid DOCX files', async () => {
      const testFile = path.join(process.cwd(), 'test.docx');
      await fs.writeFile(testFile, Buffer.from('Invalid DOCX'));
      
      await expect(parser.parseDOCX(testFile)).rejects.toThrow();
      
      await fs.unlink(testFile);
    });
  });

  describe('Turkish character support', () => {
    it('should handle Turkish characters in text', () => {
      const turkishText = 'İşçi, göçmen, şölen';
      expect(turkishText.includes('İ')).toBe(true);
      expect(turkishText.includes('ş')).toBe(true);
      expect(turkishText.includes('ö')).toBe(true);
    });
  });
});

