/**
 * Web Test Setup
 * Sets up jsdom environment for web testing
 */

import { JSDOM } from 'jsdom';

// Create a JSDOM instance
const dom = new JSDOM(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Recipe Finder App</title>
    <style>
        /* Basic CSS for testing */
        body { font-family: Arial, sans-serif; margin: 0; padding: 0; }
        .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
        .search-form { margin-bottom: 20px; }
        .search-results { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
        .recipe-item { border: 1px solid #ddd; padding: 15px; border-radius: 8px; }
        button { padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; }
        input, textarea, select { padding: 8px; border: 1px solid #ddd; border-radius: 4px; }
        @media (max-width: 768px) {
            .search-results { grid-template-columns: 1fr; }
        }
    </style>
</head>
<body>
    <header>
        <nav>
            <h1>Recipe Finder</h1>
            <ul>
                <li><a href="/">Home</a></li>
                <li><a href="/search">Search</a></li>
            </ul>
        </nav>
    </header>
    
    <main>
        <section class="search-section">
            <h2>Find Recipes</h2>
            <form class="search-form" action="/api/v1/recipes/search" method="POST" data-enhanced="search">
                <label for="ingredients">Ingredients:</label>
                <input type="text" id="ingredients" name="ingredients" data-enhanced="search-input" required>
                <button type="submit">Search Recipes</button>
            </form>
        </section>
        
        <section class="results-section">
            <h2>Search Results</h2>
            <div class="search-results" data-enhanced="search-results" data-testid="search-results">
                <!-- Results will be populated here -->
            </div>
        </section>
    </main>
    
    <footer>
        <p>&copy; 2025 Recipe Finder App</p>
    </footer>
</body>
</html>
`, {
  url: 'http://localhost:3000',
  pretendToBeVisual: true,
  resources: 'usable'
});

// Set up global variables
global.window = dom.window as any;
global.document = dom.window.document;
global.navigator = dom.window.navigator;
global.HTMLElement = dom.window.HTMLElement;
global.Element = dom.window.Element;
global.Node = dom.window.Node;
global.Document = dom.window.Document;
global.Window = dom.window.Window;

// Mock performance API
global.performance = {
  now: () => Date.now(),
  mark: () => {},
  measure: () => {},
  getEntriesByType: () => [],
  getEntriesByName: () => [],
  getEntries: () => [],
  clearMarks: () => {},
  clearMeasures: () => {},
  clearResourceTimings: () => {},
  setResourceTimingBufferSize: () => {},
  addEventListener: () => {},
  removeEventListener: () => {},
  dispatchEvent: () => true
} as any;

// Mock matchMedia
global.matchMedia = (query: string) => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: () => {},
  removeListener: () => {},
  addEventListener: () => {},
  removeEventListener: () => {},
  dispatchEvent: () => true
}) as any;

// Mock getComputedStyle
global.getComputedStyle = jest.fn(() => ({
  color: 'rgb(0, 0, 0)',
  backgroundColor: 'rgb(255, 255, 255)',
  fontSize: '16px',
  width: '100%',
  height: 'auto',
  maxWidth: '100%',
  outline: 'none',
  boxShadow: 'none',
  margin: '0px',
  padding: '0px',
  display: 'block',
  minHeight: '44px'
})) as any;

// Mock focus method
HTMLElement.prototype.focus = jest.fn();
HTMLElement.prototype.blur = jest.fn();

// Mock getBoundingClientRect
HTMLElement.prototype.getBoundingClientRect = jest.fn(() => ({
  width: 100,
  height: 44,
  top: 0,
  left: 0,
  bottom: 44,
  right: 100,
  x: 0,
  y: 0,
  toJSON: () => ({})
}));

// Mock dispatchEvent
HTMLElement.prototype.dispatchEvent = jest.fn(() => true);
window.dispatchEvent = jest.fn(() => true);

// Clean up after each test
afterEach(() => {
  // Clear any added elements
  const body = document.body;
  while (body.firstChild) {
    body.removeChild(body.firstChild);
  }
  
  // Reset the document to initial state
  const initialHTML = dom.window.document.documentElement.outerHTML;
  dom.window.document.documentElement.innerHTML = initialHTML;
});
