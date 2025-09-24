#!/bin/bash

# Fix import paths in compiled API files
find dist-api -name "*.cjs" -exec sed -i '' 's/require("\.\.\/controllers\/InvoiceController")/require("..\/controllers\/InvoiceController.cjs")/g' {} \;
find dist-api -name "*.cjs" -exec sed -i '' 's/require("\.\.\/services\/InvoiceService")/require("..\/services\/InvoiceService.cjs")/g' {} \;
find dist-api -name "*.cjs" -exec sed -i '' 's/require("\.\.\/services\/PDFService")/require("..\/services\/PDFService.cjs")/g' {} \;
find dist-api -name "*.cjs" -exec sed -i '' 's/require("\.\.\/middleware\/errorHandler")/require("..\/middleware\/errorHandler.cjs")/g' {} \;
find dist-api -name "*.cjs" -exec sed -i '' 's/require("\.\.\/middleware\/requestLogger")/require("..\/middleware\/requestLogger.cjs")/g' {} \;
find dist-api -name "*.cjs" -exec sed -i '' 's/require("\.\.\/routes\/invoiceRoutes")/require("..\/routes\/invoiceRoutes.cjs")/g' {} \;
find dist-api -name "*.cjs" -exec sed -i '' 's/require("\.\.\/\.\.\/lib\/invoice-calculator")/require("..\/..\/lib\/invoice-calculator.cjs")/g' {} \;
find dist-api -name "*.cjs" -exec sed -i '' 's/require("\.\.\/\.\.\/lib\/invoice-validator")/require("..\/..\/lib\/invoice-validator.cjs")/g' {} \;
find dist-api -name "*.cjs" -exec sed -i '' 's/require("\.\.\/\.\.\/lib\/pdf-generator")/require("..\/..\/lib\/pdf-generator.cjs")/g' {} \;

echo "Import paths fixed!"
