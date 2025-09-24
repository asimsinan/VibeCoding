/**
 * Recipe Finder App - Main JavaScript
 * Traces to FR-001, FR-003 - Progressive Enhancement & Responsive Design
 * TDD Phase: Implementation (GREEN phase)
 */

(function() {
  'use strict';
  

  // Global App Object
  window.recipeFinderApp = {
    // Core Properties
    init: init,
    enhance: enhance,
    degrade: degrade,
    
    // Feature Detection
    features: {
      touch: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
      localStorage: typeof Storage !== 'undefined',
      fetch: typeof fetch !== 'undefined',
      intersectionObserver: typeof IntersectionObserver !== 'undefined',
      resizeObserver: typeof ResizeObserver !== 'undefined'
    },
    
    // Fallback Methods
    fallback: {
      search: fallbackSearch,
      navigation: fallbackNavigation,
      interactions: fallbackInteractions
    },
    
    // Accessibility
    a11y: {
      announce: announceToScreenReader,
      focus: focusElement,
      keyboard: handleKeyboardNavigation,
      aria: {
        setLabel: setAriaLabel,
        setExpanded: setAriaExpanded,
        setSelected: setAriaSelected
      },
      focusManager: {
        trap: trapFocus,
        restore: restoreFocus,
        next: focusNext
      }
    },
    
    // Responsive Design
    responsive: {
      breakpoints: {
        mobile: 768,
        tablet: 1024,
        desktop: 1280
      },
      current: getCurrentBreakpoint(),
      isMobile: window.innerWidth <= 768,
      isTablet: window.innerWidth > 768 && window.innerWidth <= 1024,
      isDesktop: window.innerWidth > 1024,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
        orientation: window.innerWidth > window.innerHeight ? 'landscape' : 'portrait'
      },
      media: {
        matches: (query) => window.matchMedia(query).matches,
        addListener: (callback) => window.matchMedia('(max-width: 768px)').addListener(callback),
        removeListener: (callback) => window.matchMedia('(max-width: 768px)').removeListener(callback)
      }
    },
    
    // Performance
    performance: {
      measure: performance.mark,
      mark: performance.mark,
      observe: observeElement,
      lazy: {
        load: loadLazyElement,
        observe: observeLazyElement,
        unobserve: unobserveLazyElement
      },
      cache: {
        set: setCache,
        get: getCache,
        clear: clearCache
      }
    },
    
    // Error Handling
    error: {
      handle: handleError,
      log: logError,
      report: reportError,
      fallback: {
        search: fallbackSearch,
        navigation: fallbackNavigation,
        display: fallbackDisplay
      }
    },
    
    // Events
    events: {
      on: addEventListener,
      off: removeEventListener,
      emit: emitEvent,
      debounce: debounce,
      throttle: throttle
    },
    
    // Validation
    validate: {
      search: validateSearchQuery,
      recipe: validateRecipe,
      ingredient: validateIngredient,
      sanitize: {
        input: sanitizeInput,
        html: sanitizeHTML,
        url: sanitizeURL
      }
    },
    
    // State Management
    state: {
      get: getState,
      set: setState,
      subscribe: subscribeToState,
      search: {
        query: '',
        results: [],
        filters: {},
        currentResults: null
      }
    },
    
    // Search Functionality
    debouncedSearch: debounce(performSearch, 300),
    searchHistory: [],
    cache: {},
    focusManager: {
      previousFocus: null,
      trapElements: []
    }
  };

  // Initialize the app
  function init() {
    try {
      // Check if JavaScript is available
      if (!window.recipeFinderApp.features.fetch) {
        degrade();
        return;
      }

      // Enhance the experience
      enhance();
      
      // Set up event listeners
      setupEventListeners();
      
      // Initialize components
      initializeComponents();
      
      // Load popular recipes
      loadPopularRecipes();
      
    } catch (error) {
      handleError(error);
      degrade();
    }
  }

  // Enhance the experience with JavaScript
  function enhance() {
    // Add enhanced classes
    document.body.classList.add('js-enhanced');
    
    // Initialize enhanced features
    initializeAccessibilityFeatures();
    initializePerformanceOptimizations();
    
    // Set up progressive enhancement
    setupProgressiveEnhancement();
  }

  // Degrade gracefully when JavaScript fails
  function degrade() {
    // Remove enhanced classes
    document.body.classList.remove('js-enhanced');
    document.body.classList.add('js-disabled');
    
    // Ensure forms work without JavaScript
    ensureFormFallbacks();
    
    // Set up basic interactions
    setupBasicInteractions();
  }

  // Set up event listeners
  function setupEventListeners() {
          // Search form
          const searchForm = document.querySelector('[data-enhanced="search"]');
          if (searchForm) {
            searchForm.addEventListener('submit', handleSearchSubmit);
          }

          // Contact form
          const contactForm = document.querySelector('[data-enhanced="contact-form"]');
          if (contactForm) {
            contactForm.addEventListener('submit', handleContactSubmit);
          }

    // Search input
    const searchInput = document.querySelector('[data-enhanced="search-input"]');
    if (searchInput) {
      searchInput.addEventListener('input', handleSearchInput);
      searchInput.addEventListener('focus', handleSearchFocus);
      searchInput.addEventListener('blur', handleSearchBlur);
    }

    // Filters
    const filters = document.querySelectorAll('[data-enhanced="filter"]');
    filters.forEach(filter => {
      filter.addEventListener('change', handleFilterChange);
    });

    // Sorting
    const sortSelect = document.querySelector('[data-enhanced="sort"]');
    if (sortSelect) {
      sortSelect.addEventListener('change', handleSortChange);
    }

    // Clear search
    const clearButton = document.querySelector('[data-enhanced="clear-search"]');
    if (clearButton) {
      clearButton.addEventListener('click', handleClearSearch);
    }

    // Mobile navigation
    const hamburger = document.querySelector('[data-responsive="hamburger"]');
    if (hamburger) {
      hamburger.addEventListener('click', handleMobileMenuToggle);
    }

    // Modal close buttons
    const modalCloseButtons = document.querySelectorAll('[data-enhanced="close-modal"]');
    console.log('Found modal close buttons:', modalCloseButtons.length);
    modalCloseButtons.forEach((button, index) => {
      console.log(`Close button ${index}:`, button);
      button.addEventListener('click', (event) => {
        console.log('Close button clicked!', event.target);
        handleModalClose();
      });
    });

    // View Recipe buttons (delegated event listener)
    document.addEventListener('click', (event) => {
      if (event.target.classList.contains('btn-view-recipe')) {
        const recipeCard = event.target.closest('.recipe-card');
        if (recipeCard) {
          const recipeId = recipeCard.getAttribute('data-recipe-id');
          if (recipeId) {
            showRecipeDetail(recipeId);
          }
        }
      }
    });

    // Action buttons (print, share, favorite, remove-favorite) - delegated event listener
    document.addEventListener('click', (event) => {
      // Check if the clicked element or its parent has the data-action attribute
      const button = event.target.closest('[data-action]');
      if (button) {
        const action = button.getAttribute('data-action');
        switch (action) {
          case 'print':
            handlePrintRecipe();
            break;
          case 'share':
            handleShareRecipe();
            break;
          case 'favorite':
            handleToggleFavorite(button);
            break;
          case 'remove-favorite':
            handleRemoveFromFavorites(button, event);
            break;
        }
      }
    });

    // Favorites link
    const favoritesLinks = document.querySelectorAll('[data-enhanced="favorites-link"]');
    favoritesLinks.forEach(link => {
      link.addEventListener('click', (event) => {
        event.preventDefault();
        showFavorites();
      });
    });

    // Navigation links - prevent hiding favorites when clicking other nav items
    const navLinks = document.querySelectorAll('.nav-link, .mobile-nav-link');
    navLinks.forEach(link => {
      link.addEventListener('click', (event) => {
        // Only prevent default for non-favorites links
        if (!link.hasAttribute('data-enhanced') || link.getAttribute('data-enhanced') !== 'favorites-link') {
          // Don't hide favorites if we're just navigating to other pages
          // The favorites will stay visible until explicitly hidden
        }
      });
    });

    // Start exploring button
    const startExploringButton = document.querySelector('[data-enhanced="start-exploring"]');
    if (startExploringButton) {
      startExploringButton.addEventListener('click', () => {
        hideFavorites();
        // Scroll to search section
        const searchSection = document.querySelector('.search-section');
        if (searchSection) {
          searchSection.scrollIntoView({ behavior: 'smooth' });
        }
      });
    }

    // Back to search button
    const backToSearchButton = document.querySelector('[data-enhanced="back-to-search"]');
    if (backToSearchButton) {
      backToSearchButton.addEventListener('click', () => {
        hideFavorites();
        
        // Check if we're on the home page
        const searchSection = document.querySelector('.search-section');
        if (searchSection) {
          // We're on the home page, scroll to search section
          searchSection.scrollIntoView({ behavior: 'smooth' });
        } else {
          // We're on another page, navigate to home
          window.location.href = '/';
        }
      });
    }

    // Window events
    window.addEventListener('resize', handleWindowResize);
    window.addEventListener('orientationchange', handleOrientationChange);
    
    // Keyboard events
    document.addEventListener('keydown', handleGlobalKeydown);
  }

  // Initialize components
  function initializeComponents() {
    // Initialize autocomplete
    initializeAutocomplete();
    
    // Initialize lazy loading
    initializeLazyLoading();
    
    // Initialize accessibility features
    initializeAccessibilityFeatures();
  }

  // Search functionality
  function handleSearchSubmit(event) {
    event.preventDefault();
    
    const form = event.target;
    const formData = new FormData(form);
    const ingredients = formData.get('ingredients');
    
    if (!ingredients || ingredients.trim() === '') {
      showError('Please enter at least one ingredient');
      setLoadingState(false); // Ensure loading state is reset
      return;
    }

    // Show loading state
    setLoadingState(true);
    
    // Perform search
    performSearch(ingredients);
  }

  function handleSearchInput(event) {
    const query = event.target.value;
    
    if (query.length > 2) {
      // Show autocomplete
      showAutocomplete(query);
    } else {
      // Hide autocomplete
      hideAutocomplete();
    }
  }

  function handleSearchFocus(event) {
    const query = event.target.value;
    if (query.length > 2) {
      showAutocomplete(query);
    }
  }

  function handleSearchBlur(event) {
    // Delay hiding autocomplete to allow clicks
    setTimeout(() => {
      hideAutocomplete();
    }, 200);
  }

  function performSearch(query) {
    try {
      console.log('Starting search for:', query);
      
      // Validate query
      if (!validateSearchQuery(query)) {
        showError('Please enter a valid search query');
        setLoadingState(false); // Ensure loading state is reset
        return;
      }

      // Add to search history
      addToSearchHistory(query);
      
      // Check cache first
      const cacheKey = `search_${query}`;
      const cachedResults = getCache(cacheKey);
      
      if (cachedResults) {
        console.log('Using cached results');
        // Apply current sorting to cached results
        const sortType = getState('search.sort') || 'relevance';
        const sortedCachedResults = {
          ...cachedResults,
          recipes: sortRecipes(cachedResults.recipes, sortType)
        };
        
        // Store current results in state for immediate sorting
        setState('search.currentResults', sortedCachedResults);
        
        displaySearchResults(sortedCachedResults);
        setLoadingState(false); // Reset loading state for cached results
        return;
      }

      // Perform API request
      console.log('Making API request to /api/v1/recipes/search');
      fetch('/api/v1/recipes/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ingredients: query.split(',').map(i => i.trim()),
          limit: 20,
          offset: 0
        })
      })
      .then(response => {
        console.log('API response status:', response.status);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        console.log('API response data:', data);
        // Cache results
        setCache(cacheKey, data);
        
        // Store current results in state for immediate sorting
        setState('search.currentResults', data);
        
        // Display results
        displaySearchResults(data);
      })
      .catch(error => {
        console.error('Search error:', error);
        handleError(error);
        showError('Failed to search recipes. Please try again.');
      })
      .finally(() => {
        console.log('Search completed, resetting loading state');
        setLoadingState(false);
      });
    } catch (error) {
      handleError(error);
      showError('An error occurred while searching');
      setLoadingState(false);
    }
  }

  function sortRecipes(recipes, sortType) {
    if (!recipes || recipes.length === 0) return recipes;
    
    const sortedRecipes = [...recipes]; // Create a copy to avoid mutating original
    
    switch (sortType) {
      case 'cooking-time':
        return sortedRecipes.sort((a, b) => {
          const timeA = a.cookingTime || 999; // Put recipes without time at end
          const timeB = b.cookingTime || 999;
          return timeA - timeB; // Ascending order (shortest first)
        });
        
      case 'difficulty':
        const difficultyOrder = { 'easy': 1, 'medium': 2, 'hard': 3 };
        return sortedRecipes.sort((a, b) => {
          const diffA = difficultyOrder[a.difficulty] || 4; // Unknown difficulty last
          const diffB = difficultyOrder[b.difficulty] || 4;
          return diffA - diffB; // Ascending order (easy first)
        });
        
      case 'rating':
        return sortedRecipes.sort((a, b) => {
          const ratingA = a.rating || 0;
          const ratingB = b.rating || 0;
          return ratingB - ratingA; // Descending order (highest first)
        });
        
      case 'relevance':
      default:
        // Sort by match score (highest match percentage first)
        return sortedRecipes.sort((a, b) => {
          const scoreA = a.matchScore || 0;
          const scoreB = b.matchScore || 0;
          return scoreB - scoreA; // Descending order (highest match first)
        });
    }
  }

  function displaySearchResults(data) {
    const resultsContainer = document.querySelector('[data-enhanced="search-results"]');
    const resultsList = document.querySelector('[data-enhanced="results-list"]');
    const noResults = document.querySelector('[data-testid="empty-results"]');
    const errorMessage = document.querySelector('[data-testid="error-message"]');
    
    // Hide error and no results
    hideElement(noResults);
    hideElement(errorMessage);
    
    if (!data.recipes || data.recipes.length === 0) {
      showElement(noResults);
      hideElement(resultsContainer);
      return;
    }

    // Show results
    showElement(resultsContainer);
    
    // Clear previous results
    resultsList.innerHTML = '';
    
    // Create recipe cards (recipes are already sorted in performSearch)
    data.recipes.forEach(recipe => {
      const recipeCard = createRecipeCard(recipe);
      resultsList.appendChild(recipeCard);
    });
    
    // Show pagination if needed
    if (data.total > data.limit) {
      showPagination(data);
    }
    
    // Announce results to screen readers
    announceToScreenReader(`Found ${data.recipes.length} recipes`);
  }

  function createRecipeCard(recipe) {
    const card = document.createElement('article');
    card.className = 'recipe-card';
    card.setAttribute('data-testid', 'recipe-item');
    card.setAttribute('data-recipe-id', recipe.id);
    
    card.innerHTML = `
      ${recipe.image ? `
        <img src="${recipe.image}" 
             alt="${recipe.title}" 
             class="recipe-card-image"
             loading="lazy"
             onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
      ` : ''}
      <div class="placeholder-image" style="display: ${recipe.image ? 'none' : 'flex'};">
        <img src="/images/recipes/placeholder-recipe.svg" alt="Recipe placeholder" class="placeholder-svg">
        <span class="placeholder-text">No image available</span>
      </div>
      <div class="recipe-card-content">
        <h3 class="recipe-card-title">${recipe.title}</h3>
        <p class="recipe-card-description">${recipe.description || 'No description available'}</p>
        <div class="recipe-card-meta">
          <span class="cooking-time" aria-label="Cooking time: ${recipe.cookingTime || 'N/A'} minutes">🕒 ${recipe.cookingTime || 'N/A'} min</span>
          <span class="difficulty" aria-label="Difficulty: ${recipe.difficulty || 'N/A'}">⭐ ${recipe.difficulty || 'N/A'}</span>
        </div>
        ${recipe.matchScore !== undefined ? `<div class="match-score" aria-label="Match score: ${Math.round(recipe.matchScore * 100)} percent">📊 ${Math.round(recipe.matchScore * 100)}% Match</div>` : ''}
        <button class="btn btn-secondary btn-view-recipe" aria-label="View recipe for ${recipe.title}">View Recipe</button>
      </div>
    `;
    return card;
  }

  function createFavoriteRecipeCard(recipe) {
    const card = document.createElement('article');
    card.className = 'recipe-card favorite-card';
    card.setAttribute('data-testid', 'favorite-recipe-item');
    card.setAttribute('data-recipe-id', recipe.id);
    
    card.innerHTML = `
      <div class="recipe-card-image-container">
        ${recipe.image ? `
          <img src="${recipe.image}" 
               alt="${recipe.title}" 
               class="recipe-card-image"
               loading="lazy"
               onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
        ` : ''}
        <div class="placeholder-image" style="display: ${recipe.image ? 'none' : 'flex'};">
          <img src="/images/recipes/placeholder-recipe.svg" alt="Recipe placeholder" class="placeholder-svg">
          <span class="placeholder-text">No image available</span>
        </div>
        <button class="remove-favorite-btn" data-action="remove-favorite" aria-label="Remove from favorites" title="Remove from favorites">
          <span aria-hidden="true">&times;</span>
        </button>
      </div>
      <div class="recipe-card-content">
        <h3 class="recipe-card-title">${recipe.title}</h3>
        <p class="recipe-card-description">${recipe.description || 'No description available'}</p>
        <div class="recipe-card-meta">
          <span class="cooking-time" aria-label="Cooking time: ${recipe.cookingTime || 'N/A'} minutes">🕒 ${recipe.cookingTime || 'N/A'} min</span>
          <span class="difficulty" aria-label="Difficulty: ${recipe.difficulty || 'N/A'}">⭐ ${recipe.difficulty || 'N/A'}</span>
        </div>
        <button class="btn btn-secondary btn-view-recipe" aria-label="View recipe for ${recipe.title}">View Recipe</button>
      </div>
    `;
    return card;
  }

  function showRecipeDetail(recipeId) {
    const modal = document.getElementById('recipe-modal');
    if (!modal) {
      console.error('Recipe modal not found!');
      return;
    }
    
    // Show loading state
    setLoadingState(true);
    
    // Fetch recipe details from API
    fetch(`/api/v1/recipes/${recipeId}`)
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        const recipe = data.recipe;
        
        // Store recipe ID on modal for favorites functionality
        modal.setAttribute('data-recipe-id', recipe.id);
        
        // Populate modal content
        populateRecipeModal(recipe);
        
        // Show modal
        modal.setAttribute('aria-hidden', 'false');
        modal.style.display = 'flex';
        modal.classList.add('active');
        
        // Set up focus trap
        modal.addEventListener('keydown', handleFocusTrap);
        
        // Focus first focusable element
        const firstFocusable = modal.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (firstFocusable) {
          firstFocusable.focus();
        }
        
        // Store previous focus
        window.recipeFinderApp.focusManager.previousFocus = document.activeElement;
        
        // Announce to screen readers
        announceToScreenReader(`Showing recipe: ${recipe.title}`);
      })
      .catch(error => {
        console.error('Error fetching recipe details:', error);
        showError('Failed to load recipe details. Please try again.');
      })
      .finally(() => {
        setLoadingState(false);
      });
  }

  function populateRecipeModal(recipe) {
    // Title
    const title = document.querySelector('[data-testid="recipe-title"]');
    if (title) title.textContent = recipe.title;
    
    // Description
    const description = document.querySelector('[data-testid="recipe-description"]');
    if (description) description.textContent = recipe.description || 'No description available';
    
    // Image
    const image = document.querySelector('[data-testid="recipe-image"]');
    const placeholder = document.querySelector('[data-testid="placeholder-image"]');
    if (image) {
      if (recipe.image) {
        image.src = recipe.image;
        image.alt = recipe.title;
        image.style.display = 'block';
        if (placeholder) placeholder.style.display = 'none';
      } else {
        image.style.display = 'none';
        if (placeholder) placeholder.style.display = 'flex';
      }
    }
    
    // Meta information
    const cookingTime = document.querySelector('[data-testid="recipe-cooking-time"]');
    if (cookingTime) {
      const timeText = recipe.cookingTime ? `${recipe.cookingTime} min` : 'N/A';
      cookingTime.textContent = timeText;
    }
    
    const difficulty = document.querySelector('[data-testid="recipe-difficulty"]');
    if (difficulty) {
      const difficultyText = recipe.difficulty ? recipe.difficulty.charAt(0).toUpperCase() + recipe.difficulty.slice(1) : 'N/A';
      difficulty.textContent = difficultyText;
    }
    
    const servings = document.querySelector('[data-testid="recipe-servings"]');
    if (servings) servings.textContent = recipe.servings || 'N/A';
    
    // Ingredients
    const ingredientsList = document.querySelector('[data-testid="recipe-ingredients"]');
    if (ingredientsList && recipe.ingredients) {
      ingredientsList.innerHTML = recipe.ingredients
        .map(ingredient => `<li class="ingredient-item" data-testid="ingredient-item">${ingredient}</li>`)
        .join('');
    }
    
    // Instructions
    const instructionsList = document.querySelector('[data-testid="recipe-instructions"]');
    if (instructionsList && recipe.instructions) {
      instructionsList.innerHTML = recipe.instructions
        .map(instruction => `<li class="instruction-item" data-testid="instruction-item">${instruction}</li>`)
        .join('');
    }
    
        // Tags
        const tagsContainer = document.querySelector('[data-testid="recipe-tags"]');
        if (tagsContainer && recipe.tags) {
          tagsContainer.innerHTML = recipe.tags
            .map(tag => `<span class="recipe-tag" data-testid="recipe-tag">${sanitizeHTML(tag)}</span>`)
            .join('');
        }
        
        // Update favorites button state
        updateFavoritesButtonState(recipe.id);
      }

  function handleModalClose() {
    console.log('handleModalClose called');
    const modal = document.getElementById('recipe-modal');
    if (modal) {
      console.log('Modal found, closing...');
      // First, remove focus from any focused element inside the modal
      const focusedElement = document.activeElement;
      if (modal.contains(focusedElement)) {
        focusedElement.blur();
      }
      
      // Remove focus trap event listener
      modal.removeEventListener('keydown', handleFocusTrap);
      
      // Then hide the modal
      modal.style.display = 'none';
      modal.setAttribute('aria-hidden', 'true');
      modal.classList.remove('active');
      
      // Clear recipe ID
      modal.removeAttribute('data-recipe-id');
      
      // Finally, restore focus to the element that opened the modal
      restoreFocus();
      console.log('Modal closed successfully');
    } else {
      console.error('Modal not found when trying to close');
    }
  }

  // Handle focus trap for modal
  function handleFocusTrap(event) {
    if (event.key === 'Escape') {
      handleModalClose();
      return;
    }
    
    if (event.key === 'Tab') {
      const modal = document.getElementById('recipe-modal');
      if (!modal) return;
      
      const focusableElements = modal.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      
      if (focusableElements.length === 0) return;
      
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      
      if (event.shiftKey) {
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    }
  }

  // Autocomplete functionality
  function initializeAutocomplete() {
    const searchInput = document.querySelector('[data-enhanced="search-input"]');
    if (!searchInput) return;
    
    // Set up autocomplete container
    const autocompleteContainer = document.querySelector('[data-enhanced="autocomplete"]');
    if (!autocompleteContainer) return;
    
    // Add ARIA attributes
    searchInput.setAttribute('aria-autocomplete', 'list');
    searchInput.setAttribute('aria-expanded', 'false');
    searchInput.setAttribute('aria-activedescendant', '');
  }

  function showAutocomplete(query) {
    const autocompleteContainer = document.querySelector('[data-enhanced="autocomplete"]');
    if (!autocompleteContainer) return;
    
    // Get suggestions (mock data for now)
    const suggestions = getIngredientSuggestions(query);
    
    if (suggestions.length === 0) {
      hideAutocomplete();
      return;
    }
    
    // Populate autocomplete
    autocompleteContainer.innerHTML = suggestions
      .map((suggestion, index) => `
        <div class="autocomplete-item" 
             data-enhanced="autocomplete-item"
             data-value="${suggestion}"
             role="option"
             id="suggestion-${index}">
          ${sanitizeHTML(suggestion)}
        </div>
      `).join('');
    
    // Show autocomplete
    showElement(autocompleteContainer);
    
    // Set up event listeners
    const items = autocompleteContainer.querySelectorAll('[data-enhanced="autocomplete-item"]');
    items.forEach((item, index) => {
      item.addEventListener('click', () => selectAutocompleteItem(suggestions[index]));
      item.addEventListener('mouseenter', () => setActiveAutocompleteItem(index));
    });
  }

  function hideAutocomplete() {
    const autocompleteContainer = document.querySelector('[data-enhanced="autocomplete"]');
    if (autocompleteContainer) {
      hideElement(autocompleteContainer);
    }
  }

  function selectAutocompleteItem(suggestion) {
    const searchInput = document.querySelector('[data-enhanced="search-input"]');
    if (searchInput) {
      searchInput.value = suggestion;
      hideAutocomplete();
      searchInput.focus();
    }
  }

  function setActiveAutocompleteItem(index) {
    const autocompleteContainer = document.querySelector('[data-enhanced="autocomplete"]');
    if (!autocompleteContainer) return;
    
    const items = autocompleteContainer.querySelectorAll('[data-enhanced="autocomplete-item"]');
    
    // Remove active class from all items
    items.forEach(item => item.classList.remove('active'));
    
    // Add active class to selected item
    if (items[index]) {
      items[index].classList.add('active');
    }
  }

  function getIngredientSuggestions(query) {
    // Mock suggestions - in real app, this would come from API
    const allIngredients = [
      'chicken', 'beef', 'pork', 'fish', 'salmon', 'tuna',
      'tomato', 'onion', 'garlic', 'carrot', 'potato', 'broccoli',
      'rice', 'pasta', 'bread', 'flour', 'sugar', 'salt',
      'pepper', 'olive oil', 'butter', 'cheese', 'milk', 'eggs'
    ];
    
    return allIngredients
      .filter(ingredient => ingredient.toLowerCase().includes(query.toLowerCase()))
      .slice(0, 5);
  }

  // Filter and sort functionality
  function handleFilterChange(event) {
    const filterType = event.target.getAttribute('data-filter-type');
    const value = event.target.value;
    
    // Update state
    setState(`search.filters.${filterType}`, value);
    
    // Re-run search if there's a current query
    const currentQuery = getState('search.query');
    if (currentQuery) {
      performSearch(currentQuery);
    }
  }

  function handleSortChange(event) {
    const sortType = event.target.value;
    
    // Update state
    setState('search.sort', sortType);
    
    // Get current search results from state and re-sort them immediately
    const currentResults = getState('search.currentResults');
    if (currentResults && currentResults.recipes && currentResults.recipes.length > 0) {
      // Sort the current results
      const sortedResults = {
        ...currentResults,
        recipes: sortRecipes(currentResults.recipes, sortType)
      };
      
      // Update state with sorted results
      setState('search.currentResults', sortedResults);
      
      // Re-display the sorted results
      displaySearchResults(sortedResults);
    } else {
      // If no current results, re-run search if there's a current query
      const currentQuery = getState('search.query');
      if (currentQuery) {
        performSearch(currentQuery);
      }
    }
  }

  function handleClearSearch() {
    // Clear form
    const searchForm = document.querySelector('[data-enhanced="search"]');
    if (searchForm) {
      searchForm.reset();
    }
    
    // Clear results
    const resultsContainer = document.querySelector('[data-enhanced="search-results"]');
    if (resultsContainer) {
      hideElement(resultsContainer);
    }
    
    // Clear state
    setState('search.query', '');
    setState('search.results', []);
    
    // Focus search input
    const searchInput = document.querySelector('[data-enhanced="search-input"]');
    if (searchInput) {
      searchInput.focus();
    }
  }

  // Contact form functionality
  function handleContactSubmit(event) {
    event.preventDefault();
    
    const form = event.target;
    const formData = new FormData(form);
    const contactData = {
      name: formData.get('name'),
      email: formData.get('email'),
      subject: formData.get('subject'),
      message: formData.get('message')
    };
    
    // Basic validation
    if (!contactData.name || !contactData.email || !contactData.message) {
      showError('Please fill in all required fields (Name, Email, and Message)');
      return;
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(contactData.email)) {
      showError('Please provide a valid email address');
      return;
    }
    
    setLoadingState(true);
    
    // Submit contact form
    fetch('/contact', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(contactData)
    })
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      if (data.success) {
        showSuccess(data.message);
        form.reset(); // Clear the form
      } else {
        showError(data.message || 'Failed to send message. Please try again.');
      }
    })
    .catch(error => {
      handleError(error);
      showError('Failed to send message. Please try again.');
    })
    .finally(() => {
      setLoadingState(false);
    });
  }

  // Mobile navigation
  function handleMobileMenuToggle() {
    const hamburger = document.querySelector('[data-responsive="hamburger"]');
    const mobileNav = document.querySelector('[data-responsive="mobile-nav"]');
    
    if (!hamburger || !mobileNav) return;
    
    const isExpanded = hamburger.getAttribute('aria-expanded') === 'true';
    
    hamburger.setAttribute('aria-expanded', !isExpanded);
    mobileNav.setAttribute('data-open', !isExpanded ? 'true' : 'false');
    
    if (!isExpanded) {
      // Trap focus in mobile menu
      trapFocus(mobileNav);
    } else {
      // Restore focus
      restoreFocus();
    }
  }

  // Responsive features
  function handleWindowResize() {
    // Update responsive state
    updateResponsiveState();
    
    // Handle layout changes
    handleLayoutChange();
  }

  function handleOrientationChange() {
    // Update responsive state
    updateResponsiveState();
    
    // Handle orientation-specific changes
    handleOrientationSpecificChanges();
  }

  function updateResponsiveState() {
    const app = window.recipeFinderApp;
    app.responsive.isMobile = window.innerWidth <= 768;
    app.responsive.isTablet = window.innerWidth > 768 && window.innerWidth <= 1024;
    app.responsive.isDesktop = window.innerWidth > 1024;
    app.responsive.current = getCurrentBreakpoint();
    app.responsive.viewport.width = window.innerWidth;
    app.responsive.viewport.height = window.innerHeight;
    app.responsive.viewport.orientation = window.innerWidth > window.innerHeight ? 'landscape' : 'portrait';
  }

  function getCurrentBreakpoint() {
    if (window.innerWidth <= 768) return 'mobile';
    if (window.innerWidth <= 1024) return 'tablet';
    return 'desktop';
  }

  function handleLayoutChange() {
    // Close mobile menu on desktop
    if (window.recipeFinderApp.responsive.isDesktop) {
      const hamburger = document.querySelector('[data-responsive="hamburger"]');
      const mobileNav = document.querySelector('[data-responsive="mobile-nav"]');
      
      if (hamburger && mobileNav) {
        hamburger.setAttribute('aria-expanded', 'false');
        mobileNav.setAttribute('data-open', 'false');
      }
    }
  }

  function handleOrientationSpecificChanges() {
    // Handle orientation-specific layout changes
    if (window.recipeFinderApp.responsive.isMobile) {
      // Mobile-specific orientation handling
      handleMobileOrientationChange();
    }
  }

  function handleMobileOrientationChange() {
    // Close mobile menu on orientation change
    const hamburger = document.querySelector('[data-responsive="hamburger"]');
    const mobileNav = document.querySelector('[data-responsive="mobile-nav"]');
    
    if (hamburger && mobileNav) {
      hamburger.setAttribute('aria-expanded', 'false');
      mobileNav.setAttribute('data-open', 'false');
    }
  }

  // Accessibility features
  function initializeAccessibilityFeatures() {
    // Set up keyboard navigation
    setupKeyboardNavigation();
    
    // Set up focus management
    setupFocusManagement();
    
    // Set up ARIA attributes
    setupARIAAttributes();
  }

  function setupKeyboardNavigation() {
    // Add keyboard event listeners
    document.addEventListener('keydown', handleKeyboardNavigation);
  }

  function handleKeyboardNavigation(event) {
    // Handle Escape key
    if (event.key === 'Escape') {
      // Close mobile menu
      const hamburger = document.querySelector('[data-responsive="hamburger"]');
      if (hamburger && hamburger.getAttribute('aria-expanded') === 'true') {
        handleMobileMenuToggle();
        return;
      }
      
      // Close modal
      const modal = document.getElementById('recipe-modal');
      if (modal && modal.getAttribute('aria-hidden') === 'false') {
        handleModalClose();
        return;
      }
      
      // Hide autocomplete
      hideAutocomplete();
    }
    
    // Handle Tab key
    if (event.key === 'Tab') {
      handleTabNavigation(event);
    }
  }

  function handleTabNavigation(event) {
    // Handle focus trapping
    const activeElement = document.activeElement;
    const trapContainer = document.querySelector('.focus-trap');
    
    if (trapContainer && !trapContainer.contains(activeElement)) {
      event.preventDefault();
      focusNext();
    }
  }

  function setupFocusManagement() {
    // Set up focus trap for modals
    const modals = document.querySelectorAll('[role="dialog"]');
    modals.forEach(modal => {
      modal.addEventListener('keydown', handleModalKeyboard);
    });
  }

  function handleModalKeyboard(event) {
    if (event.key === 'Tab') {
      const focusableElements = event.target.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      
      if (event.shiftKey) {
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    }
  }

  function setupARIAAttributes() {
    // Set up ARIA attributes for interactive elements
    const interactiveElements = document.querySelectorAll('button, input, select, textarea, a[href]');
    interactiveElements.forEach(element => {
      if (!element.getAttribute('aria-label') && !element.textContent.trim()) {
        element.setAttribute('aria-label', element.getAttribute('title') || 'Interactive element');
      }
    });
  }

  // Performance optimizations
  function initializePerformanceOptimizations() {
    // Initialize lazy loading
    initializeLazyLoading();
    
    // Initialize intersection observer
    initializeIntersectionObserver();
    
    // Initialize resize observer
    initializeResizeObserver();
  }

  function initializeLazyLoading() {
    if (!window.recipeFinderApp.features.intersectionObserver) {
      // Fallback: load all images immediately
      const lazyImages = document.querySelectorAll('img[loading="lazy"]');
      lazyImages.forEach(img => {
        img.removeAttribute('loading');
      });
      return;
    }
    
    const lazyImages = document.querySelectorAll('img[loading="lazy"]');
    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src || img.src;
          img.classList.remove('lazy');
          observer.unobserve(img);
        }
      });
    });
    
    lazyImages.forEach(img => {
      imageObserver.observe(img);
    });
  }

  function initializeIntersectionObserver() {
    if (!window.recipeFinderApp.features.intersectionObserver) return;
    
    // Set up intersection observer for animations
    const animatedElements = document.querySelectorAll('.fade-in, .slide-up');
    const animationObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate');
        }
      });
    });
    
    animatedElements.forEach(element => {
      animationObserver.observe(element);
    });
  }

  function initializeResizeObserver() {
    if (!window.recipeFinderApp.features.resizeObserver) return;
    
    // Set up resize observer for responsive elements
    const responsiveElements = document.querySelectorAll('[data-responsive]');
    const resizeObserver = new ResizeObserver((entries) => {
      entries.forEach(entry => {
        handleElementResize(entry.target, entry.contentRect);
      });
    });
    
    responsiveElements.forEach(element => {
      resizeObserver.observe(element);
    });
  }

  function handleElementResize(element, rect) {
    // Handle responsive element resize
    const breakpoint = getCurrentBreakpoint();
    element.setAttribute('data-breakpoint', breakpoint);
  }

  // Utility functions
  function showElement(element) {
    if (element) {
      element.style.display = 'block';
      element.classList.remove('hidden');
    }
  }

  function hideElement(element) {
    if (element) {
      element.style.display = 'none';
      element.classList.add('hidden');
    }
  }

  function setLoadingState(loading) {
    const searchButton = document.querySelector('.btn-search');
    const btnText = document.querySelector('.btn-text');
    const btnLoading = document.querySelector('.btn-loading');
    
    if (searchButton) {
      if (loading) {
        searchButton.classList.add('loading');
        searchButton.disabled = true;
        
        // Hide normal text, show loading text
        if (btnText) btnText.style.display = 'none';
        if (btnLoading) btnLoading.style.display = 'inline-flex';
      } else {
        searchButton.classList.remove('loading');
        searchButton.disabled = false;
        
        // Show normal text, hide loading text
        if (btnText) btnText.style.display = 'inline';
        if (btnLoading) btnLoading.style.display = 'none';
      }
    }
  }

  function showError(message) {
    const errorMessage = document.querySelector('[data-testid="error-message"]');
    if (errorMessage) {
      const errorText = errorMessage.querySelector('.error-text');
      if (errorText) {
        errorText.textContent = message;
      }
      showElement(errorMessage);
    }
    
    // Announce to screen readers
    announceToScreenReader(`Error: ${message}`);
  }

  function showSuccess(message) {
    // Create or find success message element
    let successMessage = document.querySelector('[data-testid="success-message"]');
    if (!successMessage) {
      successMessage = document.createElement('div');
      successMessage.setAttribute('data-testid', 'success-message');
      successMessage.className = 'success-message';
      successMessage.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #10b981;
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        z-index: 1000;
        max-width: 400px;
        display: none;
      `;
      successMessage.innerHTML = `
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          <span style="font-size: 1.2rem;">✅</span>
          <span class="success-text">${message}</span>
        </div>
      `;
      document.body.appendChild(successMessage);
    } else {
      const successText = successMessage.querySelector('.success-text');
      if (successText) {
        successText.textContent = message;
      }
    }
    
    showElement(successMessage);
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
      hideElement(successMessage);
    }, 5000);
    
    // Announce to screen readers
    announceToScreenReader(`Success: ${message}`);
  }

  function loadPopularRecipes() {
    // Popular recipes with downloaded images
    const popularRecipes = [
      { id: 'recipe-1', title: 'Chicken Stir Fry', image: '/images/recipes/chicken-stir-fry.jpg', cookingTime: '20 min', difficulty: 'Easy' },
      { id: 'recipe-2', title: 'Pasta Carbonara', image: '/images/recipes/pasta-carbonara.jpg', cookingTime: '25 min', difficulty: 'Medium' },
      { id: 'recipe-3', title: 'Beef Tacos', image: '/images/recipes/beef-tacos.jpg', cookingTime: '30 min', difficulty: 'Easy' },
      { id: 'recipe-4', title: 'Salmon Teriyaki', image: '/images/recipes/salmon-teriyaki.jpg', cookingTime: '35 min', difficulty: 'Medium' }
    ];
    
    const popularGrid = document.querySelector('[data-enhanced="popular-recipes"]');
    if (popularGrid) {
      // Clear existing content
      popularGrid.innerHTML = '';
      
      // Create and append recipe cards
      popularRecipes.forEach(recipe => {
        const recipeCard = createRecipeCard(recipe);
        popularGrid.appendChild(recipeCard);
      });
    }
  }

  // Fallback functions
  function fallbackSearch() {
    // Basic form submission without JavaScript enhancements
    const form = document.querySelector('form[action*="search"]');
    if (form) {
      form.submit();
    }
  }

  function fallbackNavigation() {
    // Basic navigation without JavaScript enhancements
    const links = document.querySelectorAll('a[href]');
    links.forEach(link => {
      link.addEventListener('click', (event) => {
        // Allow default navigation
      });
    });
  }

  function fallbackInteractions() {
    // Basic interactions without JavaScript enhancements
    const buttons = document.querySelectorAll('button');
    buttons.forEach(button => {
      button.addEventListener('click', (event) => {
        // Handle basic button clicks
      });
    });
  }

  function fallbackDisplay() {
    // Basic display without JavaScript enhancements
    const elements = document.querySelectorAll('[data-enhanced]');
    elements.forEach(element => {
      element.style.display = 'none';
    });
  }

  function ensureFormFallbacks() {
    // Ensure forms work without JavaScript
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
      // Don't add fallback action to enhanced forms
      if (!form.hasAttribute('data-enhanced')) {
        form.setAttribute('method', 'POST');
        form.setAttribute('action', form.getAttribute('action') || '/search');
      }
    });
  }

  function setupBasicInteractions() {
    // Set up basic interactions that work without JavaScript
    const buttons = document.querySelectorAll('button[type="submit"]');
    buttons.forEach(button => {
      button.addEventListener('click', (event) => {
        const form = button.closest('form');
        if (form) {
          form.submit();
        }
      });
    });
  }

  function setupProgressiveEnhancement() {
    // Add enhanced class to body
    document.body.classList.add('js-enhanced');
    
    // Hide elements that require JavaScript
    const jsOnlyElements = document.querySelectorAll('.js-only');
    jsOnlyElements.forEach(element => {
      element.style.display = '';
    });
  }

  // Accessibility functions
  function announceToScreenReader(message) {
    const liveRegion = document.getElementById('live-region');
    if (liveRegion) {
      liveRegion.textContent = message;
    }
  }

  function focusElement(element) {
    if (element && typeof element.focus === 'function') {
      element.focus();
    }
  }

  function setAriaLabel(element, label) {
    if (element) {
      element.setAttribute('aria-label', label);
    }
  }

  function setAriaExpanded(element, expanded) {
    if (element) {
      element.setAttribute('aria-expanded', expanded.toString());
    }
  }

  function setAriaSelected(element, selected) {
    if (element) {
      element.setAttribute('aria-selected', selected.toString());
    }
  }

  function trapFocus(container) {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    if (focusableElements.length === 0) return;
    
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    
    // Store previous focus
    window.recipeFinderApp.focusManager.previousFocus = document.activeElement;
    
    // Focus first element
    firstElement.focus();
    
    // Set up focus trap
    container.addEventListener('keydown', handleFocusTrap);
    
    function handleFocusTrap(event) {
      if (event.key === 'Tab') {
        if (event.shiftKey) {
          if (document.activeElement === firstElement) {
            event.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            event.preventDefault();
            firstElement.focus();
          }
        }
      }
    }
  }

  function restoreFocus() {
    const previousFocus = window.recipeFinderApp.focusManager.previousFocus;
    if (previousFocus && typeof previousFocus.focus === 'function') {
      previousFocus.focus();
    }
  }

  // Action button handlers
  function handlePrintRecipe() {
    const modal = document.getElementById('recipe-modal');
    if (!modal || modal.getAttribute('aria-hidden') === 'true') {
      showError('Please open a recipe to print');
      return;
    }

    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    const recipeTitle = document.querySelector('[data-testid="recipe-title"]')?.textContent || 'Recipe';
    const recipeContent = modal.innerHTML;
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${recipeTitle} - Recipe Finder</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .recipe-image { max-width: 100%; height: auto; margin: 10px 0; }
          .recipe-info { margin: 20px 0; }
          .ingredients, .instructions { margin: 20px 0; }
          .ingredients ul, .instructions ol { margin: 10px 0; padding-left: 20px; }
          .recipe-tags { margin: 20px 0; }
          .recipe-tag { display: inline-block; background: #f0f0f0; padding: 4px 8px; margin: 2px; border-radius: 4px; }
          @media print { body { margin: 0; } }
        </style>
      </head>
      <body>
        <h1>${recipeTitle}</h1>
        ${recipeContent}
      </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  }

  function handleShareRecipe() {
    const modal = document.getElementById('recipe-modal');
    if (!modal || modal.getAttribute('aria-hidden') === 'true') {
      showError('Please open a recipe to share');
      return;
    }

    const recipeTitle = document.querySelector('[data-testid="recipe-title"]')?.textContent || 'Recipe';
    const recipeDescription = document.querySelector('[data-testid="recipe-description"]')?.textContent || '';
    const shareText = `Check out this recipe: ${recipeTitle}${recipeDescription ? ' - ' + recipeDescription : ''}`;
    const shareUrl = window.location.href;

    if (navigator.share) {
      // Use native Web Share API if available
      navigator.share({
        title: recipeTitle,
        text: shareText,
        url: shareUrl
      }).catch(error => {
        console.log('Error sharing:', error);
        fallbackShare(shareText, shareUrl);
      });
    } else {
      // Fallback to copy to clipboard
      fallbackShare(shareText, shareUrl);
    }
  }

  function fallbackShare(text, url) {
    const shareText = `${text}\n\n${url}`;
    
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(shareText).then(() => {
        showSuccess('Recipe link copied to clipboard!');
      }).catch(() => {
        showPromptShare(shareText);
      });
    } else {
      showPromptShare(shareText);
    }
  }

  function showPromptShare(text) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h2>Share Recipe</h2>
          <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
        </div>
        <div class="modal-body">
          <p>Copy this text to share the recipe:</p>
          <textarea readonly style="width: 100%; height: 100px; margin: 10px 0;">${text}</textarea>
          <button class="btn btn-primary" onclick="navigator.clipboard.writeText(this.previousElementSibling.value).then(() => { this.textContent = 'Copied!'; setTimeout(() => this.closest('.modal').remove(), 1000); })">
            Copy to Clipboard
          </button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    modal.style.display = 'flex';
  }

  function handleToggleFavorite(button) {
    const modal = document.getElementById('recipe-modal');
    if (!modal || modal.getAttribute('aria-hidden') === 'true') {
      showError('Please open a recipe to save to favorites');
      return;
    }

    const recipeId = modal.getAttribute('data-recipe-id');
    if (!recipeId) {
      showError('Recipe ID not found. Please try opening the recipe again.');
      return;
    }
    
    const favorites = getFavorites();
    const isFavorited = favorites.includes(recipeId);
    
    if (isFavorited) {
      // Remove from favorites
      const updatedFavorites = favorites.filter(id => id !== recipeId);
      setFavorites(updatedFavorites);
      button.innerHTML = '<span aria-hidden="true">❤️</span> Save to Favorites';
      button.classList.remove('favorited');
      showSuccess('Removed from favorites');
      
      // Refresh favorites view if it's currently shown
      const favoritesSection = document.querySelector('[data-enhanced="favorites-section"]');
      if (favoritesSection && favoritesSection.style.display !== 'none') {
        loadFavorites();
      }
    } else {
      // Add to favorites
      favorites.push(recipeId);
      setFavorites(favorites);
      button.innerHTML = '<span aria-hidden="true">💖</span> Remove from Favorites';
      button.classList.add('favorited');
      showSuccess('Added to favorites');
    }
  }

  // Favorites management
  function getFavorites() {
    try {
      const favorites = localStorage.getItem('recipe_finder_favorites');
      const favoritesList = favorites ? JSON.parse(favorites) : [];
      
      // Clean up any favorites that might be recipe titles instead of IDs
      const cleanedFavorites = favoritesList.filter(id => 
        id && typeof id === 'string' && id.startsWith('recipe-')
      );
      
      // If we cleaned up some favorites, save the cleaned list
      if (cleanedFavorites.length !== favoritesList.length) {
        setFavorites(cleanedFavorites);
      }
      
      return cleanedFavorites;
    } catch (error) {
      console.error('Error loading favorites:', error);
      return [];
    }
  }

  function setFavorites(favorites) {
    try {
      localStorage.setItem('recipe_finder_favorites', JSON.stringify(favorites));
    } catch (error) {
      console.error('Error saving favorites:', error);
    }
  }

  function showSuccess(message) {
    // Create a temporary success message
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.textContent = message;
    successDiv.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #4CAF50;
      color: white;
      padding: 12px 20px;
      border-radius: 4px;
      z-index: 10000;
      font-weight: 500;
    `;
    
    document.body.appendChild(successDiv);
    
    setTimeout(() => {
      if (successDiv.parentNode) {
        successDiv.parentNode.removeChild(successDiv);
      }
    }, 3000);
  }

  function updateFavoritesButtonState(recipeId) {
    const favoriteButton = document.querySelector('[data-action="favorite"]');
    if (!favoriteButton) return;
    
    const favorites = getFavorites();
    const isFavorited = favorites.includes(recipeId);
    
    if (isFavorited) {
      favoriteButton.innerHTML = '<span aria-hidden="true">💖</span> Remove from Favorites';
      favoriteButton.classList.add('favorited');
    } else {
      favoriteButton.innerHTML = '<span aria-hidden="true">❤️</span> Save to Favorites';
      favoriteButton.classList.remove('favorited');
    }
  }

  function handleRemoveFromFavorites(button, event) {
    console.log('Remove favorite clicked!', button, event);
    
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    
    const recipeCard = button.closest('.favorite-card');
    if (!recipeCard) {
      console.error('Recipe card not found');
      return;
    }
    
    const recipeId = recipeCard.getAttribute('data-recipe-id');
    if (!recipeId) {
      console.error('Recipe ID not found');
      return;
    }
    
    console.log('Removing recipe:', recipeId);
    
    // Remove from favorites
    const favorites = getFavorites();
    const updatedFavorites = favorites.filter(id => id !== recipeId);
    setFavorites(updatedFavorites);
    
    // Remove the card with animation
    recipeCard.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
    recipeCard.style.opacity = '0';
    recipeCard.style.transform = 'scale(0.9)';
    
    setTimeout(() => {
      recipeCard.remove();
      
      // Check if favorites list is now empty
      const favoritesGrid = document.querySelector('[data-enhanced="favorites-grid"]');
      if (favoritesGrid && favoritesGrid.children.length === 0) {
        loadFavorites(); // This will show the empty state
      }
    }, 300);
    
    showSuccess('Removed from favorites');
  }

  // Favorites view functions
  function showFavorites() {
    const favoritesSection = document.querySelector('[data-enhanced="favorites-section"]');
    const searchSection = document.querySelector('.search-section');
    const popularSection = document.querySelector('.popular-section');
    
    if (favoritesSection) {
      // Hide other sections
      if (searchSection) searchSection.style.display = 'none';
      if (popularSection) popularSection.style.display = 'none';
      
      // Show favorites section
      favoritesSection.style.display = 'block';
      
      // Load and display favorites
      loadFavorites();
      
      // Scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  function hideFavorites() {
    const favoritesSection = document.querySelector('[data-enhanced="favorites-section"]');
    const searchSection = document.querySelector('.search-section');
    const popularSection = document.querySelector('.popular-section');
    
    if (favoritesSection) {
      // Hide favorites section
      favoritesSection.style.display = 'none';
      
      // Show other sections
      if (searchSection) searchSection.style.display = 'block';
      if (popularSection) popularSection.style.display = 'block';
    }
  }

  async function loadFavorites() {
    const favorites = getFavorites();
    const favoritesGrid = document.querySelector('[data-enhanced="favorites-grid"]');
    const favoritesEmpty = document.querySelector('[data-testid="favorites-empty"]');
    
    if (!favoritesGrid || !favoritesEmpty) return;
    
    // Clear previous content
    favoritesGrid.innerHTML = '';
    
    if (favorites.length === 0) {
      // Show empty state
      favoritesEmpty.style.display = 'block';
      favoritesGrid.style.display = 'none';
    } else {
      // Hide empty state
      favoritesEmpty.style.display = 'none';
      favoritesGrid.style.display = 'grid';
      
      // Load each favorite recipe
      for (const recipeId of favorites) {
        try {
          const response = await fetch(`/api/v1/recipes/${recipeId}`);
          if (response.ok) {
            const data = await response.json();
            const recipe = data.recipe;
            
            // Create recipe card with remove button
            const recipeCard = createFavoriteRecipeCard(recipe);
            favoritesGrid.appendChild(recipeCard);
          }
        } catch (error) {
          console.error(`Error loading favorite recipe ${recipeId}:`, error);
        }
      }
    }
  }

  function focusNext() {
    const focusableElements = document.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const currentIndex = Array.from(focusableElements).indexOf(document.activeElement);
    const nextIndex = (currentIndex + 1) % focusableElements.length;
    
    focusableElements[nextIndex].focus();
  }

  // Validation functions
  function validateSearchQuery(query) {
    if (!query || typeof query !== 'string') return false;
    if (query.trim().length === 0) return false;
    if (query.length > 1000) return false;
    return true;
  }

  function validateRecipe(recipe) {
    if (!recipe || typeof recipe !== 'object') return false;
    if (!recipe.title || typeof recipe.title !== 'string') return false;
    return true;
  }

  function validateIngredient(ingredient) {
    if (!ingredient || typeof ingredient !== 'string') return false;
    if (ingredient.trim().length === 0) return false;
    return true;
  }

  function sanitizeInput(input) {
    if (typeof input !== 'string') return '';
    return input.trim().replace(/[<>]/g, '');
  }

  function sanitizeHTML(html) {
    if (typeof html !== 'string') return '';
    const div = document.createElement('div');
    div.textContent = html;
    return div.innerHTML;
  }

  function sanitizeURL(url) {
    if (typeof url !== 'string') return '';
    try {
      return new URL(url).toString();
    } catch {
      return '';
    }
  }

  // State management functions
  function getState(key) {
    const keys = key.split('.');
    let value = window.recipeFinderApp.state;
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return undefined;
      }
    }
    
    return value;
  }

  function setState(key, value) {
    const keys = key.split('.');
    let current = window.recipeFinderApp.state;
    
    for (let i = 0; i < keys.length - 1; i++) {
      const k = keys[i];
      if (!(k in current) || typeof current[k] !== 'object') {
        current[k] = {};
      }
      current = current[k];
    }
    
    current[keys[keys.length - 1]] = value;
  }

  function subscribeToState(key, callback) {
    // Simple state subscription (in real app, use proper state management)
    const interval = setInterval(() => {
      const value = getState(key);
      if (value !== undefined) {
        callback(value);
      }
    }, 100);
    
    return () => clearInterval(interval);
  }

  // Cache functions
  function setCache(key, value) {
    try {
      if (window.recipeFinderApp.features.localStorage) {
        localStorage.setItem(`recipe_finder_${key}`, JSON.stringify(value));
      }
      window.recipeFinderApp.cache[key] = value;
    } catch (error) {
      // Fallback to memory cache
      window.recipeFinderApp.cache[key] = value;
    }
  }

  function getCache(key) {
    try {
      if (window.recipeFinderApp.features.localStorage) {
        const cached = localStorage.getItem(`recipe_finder_${key}`);
        if (cached) {
          return JSON.parse(cached);
        }
      }
      return window.recipeFinderApp.cache[key];
    } catch (error) {
      return window.recipeFinderApp.cache[key];
    }
  }

  function clearCache() {
    try {
      if (window.recipeFinderApp.features.localStorage) {
        Object.keys(localStorage)
          .filter(key => key.startsWith('recipe_finder_'))
          .forEach(key => localStorage.removeItem(key));
      }
      window.recipeFinderApp.cache = {};
    } catch (error) {
      window.recipeFinderApp.cache = {};
    }
  }

  // Error handling functions
  function handleError(error) {
    console.error('Recipe Finder App Error:', error);
    logError(error);
  }

  function logError(error) {
    // Log error to console
    console.error('Error logged:', error);
  }

  function reportError(error) {
    // In production, send error to monitoring service
    console.error('Error reported:', error);
  }

  // Event utility functions
  function addEventListener(element, event, handler) {
    if (element && typeof element.addEventListener === 'function') {
      element.addEventListener(event, handler);
    }
  }

  function removeEventListener(element, event, handler) {
    if (element && typeof element.removeEventListener === 'function') {
      element.removeEventListener(event, handler);
    }
  }

  function emitEvent(eventName, data) {
    const event = new CustomEvent(eventName, { detail: data });
    document.dispatchEvent(event);
  }

  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  function throttle(func, limit) {
    let inThrottle;
    return function executedFunction(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  // Performance functions
  function observeElement(element) {
    if (window.recipeFinderApp.features.intersectionObserver) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      });
      observer.observe(element);
    }
  }

  function loadLazyElement(element) {
    if (element.dataset.src) {
      element.src = element.dataset.src;
      element.removeAttribute('data-src');
    }
  }

  function observeLazyElement(element) {
    if (window.recipeFinderApp.features.intersectionObserver) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            loadLazyElement(entry.target);
            observer.unobserve(entry.target);
          }
        });
      });
      observer.observe(element);
    }
  }

  function unobserveLazyElement(element) {
    // Implementation for unobserve
  }

  // Search history functions
  function addToSearchHistory(query) {
    const history = window.recipeFinderApp.searchHistory;
    if (!history.includes(query)) {
      history.unshift(query);
      if (history.length > 10) {
        history.pop();
      }
    }
  }

  // Pagination functions
  function showPagination(data) {
    const pagination = document.querySelector('[data-testid="pagination"]');
    if (!pagination) return;
    
    const totalPages = Math.ceil(data.total / data.limit);
    const currentPage = Math.floor(data.offset / data.limit) + 1;
    
    if (totalPages <= 1) {
      hideElement(pagination);
      return;
    }
    
    showElement(pagination);
    
    // Create page numbers
    const pagesContainer = pagination.querySelector('.pagination-pages');
    if (pagesContainer) {
      pagesContainer.innerHTML = '';
      
      for (let i = 1; i <= totalPages; i++) {
        const pageButton = document.createElement('button');
        pageButton.className = `pagination-page ${i === currentPage ? 'active' : ''}`;
        pageButton.textContent = i;
        pageButton.addEventListener('click', () => goToPage(i));
        pagesContainer.appendChild(pageButton);
      }
    }
    
    // Update prev/next buttons
    const prevButton = pagination.querySelector('[data-testid="pagination-prev"]');
    const nextButton = pagination.querySelector('[data-testid="pagination-next"]');
    
    if (prevButton) {
      prevButton.disabled = currentPage === 1;
    }
    
    if (nextButton) {
      nextButton.disabled = currentPage === totalPages;
    }
  }

  function goToPage(page) {
    // Implementation for pagination
    console.log('Go to page:', page);
  }

  // Global keyboard handler
  function handleGlobalKeydown(event) {
    // Handle global keyboard shortcuts
    if (event.ctrlKey || event.metaKey) {
      switch (event.key) {
        case 'k':
          event.preventDefault();
          const searchInput = document.querySelector('[data-enhanced="search-input"]');
          if (searchInput) {
            searchInput.focus();
          }
          break;
      }
    }
  }

  // Initialize the app when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
