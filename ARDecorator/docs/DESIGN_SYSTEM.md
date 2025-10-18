# AR Home Decorator - Design System

## Overview

This document outlines the comprehensive design system for the AR Home Decorator application, ensuring consistency, accessibility, and modern UI patterns throughout the application.

## 🎨 Color Palette

### Primary Colors (Blue Gradient)
- **Primary 500**: `#3b82f6` - Main brand color
- **Primary 600**: `#2563eb` - Hover states, emphasis
- **Primary 700**: `#1d4ed8` - Active states

### Accent Colors (Purple Gradient)
- **Accent 500**: `#a855f7` - Secondary brand color
- **Accent 600**: `#9333ea` - Accent hover states
- **Accent 700**: `#7e22ce` - Accent active states

### Semantic Colors
- **Success**: `#22c55e` - Success states, confirmations
- **Warning**: `#f59e0b` - Warnings, cautions
- **Error**: `#ef4444` - Errors, destructive actions

### Neutral Grays
- Full spectrum from Gray 50 to Gray 950
- Used for text, backgrounds, borders

## 📝 Typography

### Font Family
- **Primary**: Inter (sans-serif)
- **Display**: Inter (for headings)
- **Monospace**: JetBrains Mono (for code)

### Type Scale
- **Heading 1**: 3rem - 4.5rem (48px - 72px)
- **Heading 2**: 1.875rem - 3rem (30px - 48px)
- **Heading 3**: 1.5rem - 2.25rem (24px - 36px)
- **Heading 4**: 1.25rem - 1.875rem (20px - 30px)
- **Body**: 1rem (16px)
- **Small**: 0.875rem (14px)
- **Tiny**: 0.75rem (12px)

### Font Weights
- Light: 300
- Regular: 400
- Medium: 500
- Semibold: 600
- Bold: 700
- Extrabold: 800
- Black: 900

## 🎯 Spacing System

Based on 8px grid system:
- **xs**: 0.5rem (4px)
- **sm**: 0.75rem (6px)
- **md**: 1rem (8px)
- **lg**: 1.5rem (12px)
- **xl**: 2rem (16px)
- **2xl**: 3rem (24px)
- **3xl**: 4rem (32px)

## 🔲 Components

### Buttons

#### Primary Button
```jsx
<button className="btn-primary">Click Me</button>
```
- Gradient background (primary-500 to primary-600)
- White text
- Shadow on hover
- Active scale effect

#### Secondary Button
```jsx
<button className="btn-secondary">Click Me</button>
```
- White background
- Gray border
- Gray text
- Subtle hover effect

#### Accent Button
```jsx
<button className="btn-accent">Click Me</button>
```
- Gradient background (accent-500 to accent-600)
- White text
- Shadow on hover

#### Ghost Button
```jsx
<button className="btn-ghost">Click Me</button>
```
- Transparent background
- Gray text
- Hover background

### Cards

#### Basic Card
```jsx
<div className="card">
  <div className="card-header">Header</div>
  <div className="card-body">Content</div>
  <div className="card-footer">Footer</div>
</div>
```

#### Elevated Card
```jsx
<div className="card-elevated">
  <!-- Hover effect with lift animation -->
</div>
```

#### Interactive Card
```jsx
<div className="card-interactive">
  <!-- Clickable with hover effects -->
</div>
```

### Forms

#### Input Field
```jsx
<div>
  <label className="form-label">Email</label>
  <input type="email" className="form-input" placeholder="Enter email" />
  <p className="form-helper">We'll never share your email</p>
</div>
```

#### Error State
```jsx
<input type="text" className="form-input-error" />
<p className="form-error">This field is required</p>
```

### Badges

```jsx
<span className="badge-primary">New</span>
<span className="badge-success">Active</span>
<span className="badge-warning">Pending</span>
<span className="badge-error">Failed</span>
```

## ✨ Visual Effects

### Shadows
- **sm**: Subtle elevation
- **md**: Standard card shadow
- **lg**: Elevated card shadow
- **xl**: Modal/overlay shadow
- **2xl**: Maximum elevation
- **glow**: Primary color glow
- **glow-accent**: Accent color glow

### Border Radius
- **sm**: 0.25rem (4px)
- **md**: 0.625rem (10px)
- **lg**: 0.75rem (12px)
- **xl**: 1rem (16px)
- **2xl**: 1.5rem (24px)
- **3xl**: 2rem (32px)
- **full**: 9999px (pill shape)

### Animations

#### Fade In
```jsx
<div className="animate-fade-in">Content</div>
```

#### Slide In
```jsx
<div className="animate-slide-in">Content</div>
```

#### Scale In
```jsx
<div className="animate-scale-in">Content</div>
```

#### Pulse (Subtle)
```jsx
<div className="animate-pulse-subtle">Content</div>
```

## 🎭 Special Effects

### Glass Morphism
```jsx
<div className="glass-card">
  <!-- Frosted glass effect -->
</div>
```

### Text Gradient
```jsx
<h1 className="text-gradient-primary">Gradient Text</h1>
```

### Custom Utilities
```jsx
<div className="glass-morphism">Glassmorphism effect</div>
<div className="card-elevated">Auto-hover elevation</div>
```

## ♿ Accessibility

### Focus States
- All interactive elements have visible focus indicators
- 2px outline with offset
- Primary color outline

### Color Contrast
- All text meets WCAG AA standards (4.5:1 for normal text, 3:1 for large text)
- Interactive elements have sufficient contrast

### Motion
- Respects `prefers-reduced-motion` media query
- Animations disabled for users who prefer reduced motion

### Keyboard Navigation
- All interactive elements are keyboard accessible
- Logical tab order
- Skip links where appropriate

## 📱 Responsive Design

### Breakpoints
- **sm**: 640px
- **md**: 768px
- **lg**: 1024px
- **xl**: 1280px
- **2xl**: 1536px

### Mobile-First Approach
All styles are mobile-first, with larger breakpoints adding complexity.

## 🎨 Design Principles

1. **Modern & Clean**: Use of whitespace, clear hierarchy
2. **Consistent**: Reusable components, design tokens
3. **Accessible**: WCAG 2.1 AA compliant
4. **Performant**: Optimized animations, efficient CSS
5. **Responsive**: Mobile-first, adaptive layouts
6. **Interactive**: Hover states, micro-interactions
7. **Professional**: Polished, attention to detail

## 🚀 Usage Examples

### Hero Section
```jsx
<section className="section bg-gradient-to-br from-primary-50 to-accent-50">
  <div className="container-custom">
    <h1 className="heading-1 text-gradient-primary mb-6">
      AR Home Decorator
    </h1>
    <p className="text-xl text-gray-600 mb-8">
      Visualize furniture in your space
    </p>
    <button className="btn-primary btn-lg">
      Get Started
    </button>
  </div>
</section>
```

### Feature Card Grid
```jsx
<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
  <div className="card-elevated">
    <div className="card-body">
      <h3 className="heading-4 mb-3">Feature 1</h3>
      <p className="text-gray-600">Description</p>
    </div>
  </div>
  <!-- More cards -->
</div>
```

## 📚 Resources

- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Inter Font](https://fonts.google.com/specimen/Inter)

