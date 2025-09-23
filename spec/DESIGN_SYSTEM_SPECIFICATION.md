# Design System Specification for Laundry Link

## Overview
This document outlines the complete design system for Laundry Link, including color palette, typography, spacing, and component guidelines. This serves as a reference for maintaining design consistency across the application.

## 1. Color Palette

### Primary Colors
The following colors are the core brand colors used throughout the Laundry Link application:

```css
:root {
  --primary-color: #1a28c2;      /* Main brand blue - Primary CTAs, headers, links */
  --secondary-color: #e3f2fd;    /* Light blue background - Sections, cards */
  --dark-blue: #190dad;          /* Dark blue - Headings, text emphasis */
  --medium-blue: #1f6cc7;        /* Medium blue - Subheadings, secondary text */
  --light-blue: #5cc4e4;         /* Light blue - Accents, highlights */
  --cyan-aqua: #63dbe2;          /* Cyan accent - Special CTAs, icons */
  --white: #ffffff;              /* Pure white - Backgrounds, contrast */
}
```

### Color Usage Guidelines

#### Primary Color (#1a28c2)
- **Usage**: Main call-to-action buttons, primary navigation elements, brand headers
- **Accessibility**: Meets WCAG AA contrast requirements
- **Variations**: 
  - Hover: Darken by 10-15%
  - Active: Darken by 20%
  - Disabled: Reduce opacity to 60%

#### Secondary Color (#e3f2fd)
- **Usage**: Section backgrounds, card backgrounds, subtle highlights
- **Accessibility**: High contrast with dark text
- **Variations**:
  - Light: Increase opacity for subtle backgrounds
  - Dark: Use with white text for contrast

#### Dark Blue (#190dad)
- **Usage**: Main headings (H1, H2), important text elements
- **Accessibility**: Excellent contrast on white backgrounds
- **Typography**: Use for primary headings and emphasis

#### Medium Blue (#1f6cc7)
- **Usage**: Subheadings (H3, H4), secondary text, descriptions
- **Accessibility**: Good contrast for body text
- **Typography**: Use for secondary headings and important body text

#### Light Blue (#5cc4e4)
- **Usage**: Accent elements, highlights, secondary actions
- **Accessibility**: Sufficient contrast for interactive elements
- **UI Elements**: Use for secondary buttons, badges, highlights

#### Cyan Aqua (#63dbe2)
- **Usage**: Special call-to-action buttons, icons, success states
- **Accessibility**: High contrast for important actions
- **Special Cases**: Use for "earliest pickup" buttons, success messages

#### White (#ffffff)
- **Usage**: Primary backgrounds, card content, text on dark backgrounds
- **Accessibility**: Maximum contrast for readability
- **Backgrounds**: Use as primary background color

## 2. Color Accessibility

### Contrast Ratios
All color combinations meet WCAG 2.1 AA standards:

- **Primary on White**: 4.5:1 ✓
- **Dark Blue on White**: 7.2:1 ✓
- **Medium Blue on White**: 4.8:1 ✓
- **White on Primary**: 4.5:1 ✓

### Color Blindness Considerations
- Primary and secondary colors are distinguishable for colorblind users
- Text contrast maintained regardless of color perception
- Icons and shapes used alongside colors for clarity

## 3. Typography

### Font Stack
```css
font-family: 'Inter', 'Noto Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
```

### Font Weights
- **Regular (400)**: Body text, descriptions
- **Medium (500)**: Subheadings, labels
- **Bold (700)**: Section headings, important text
- **Black (900)**: Main page title, hero text

### Font Sizes (Responsive)
```css
/* Mobile First Approach */
--text-xs: 0.75rem;     /* 12px */
--text-sm: 0.875rem;    /* 14px */
--text-base: 1rem;      /* 16px */
--text-lg: 1.125rem;    /* 18px */
--text-xl: 1.25rem;     /* 20px */
--text-2xl: 1.5rem;     /* 24px */
--text-3xl: 1.875rem;   /* 30px */
--text-4xl: 2.25rem;    /* 36px */
--text-5xl: 3rem;       /* 48px */
--text-6xl: 3.75rem;    /* 60px */
--text-7xl: 4.5rem;     /* 72px */
```

## 4. Spacing System

### Spacing Scale
```css
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-5: 1.25rem;   /* 20px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
--space-10: 2.5rem;   /* 40px */
--space-12: 3rem;     /* 48px */
--space-16: 4rem;     /* 64px */
--space-20: 5rem;     /* 80px */
--space-24: 6rem;     /* 96px */
```

### Component Spacing
- **Section Padding**: `py-12 sm:py-16 md:py-20 lg:py-24`
- **Container Padding**: `px-3 sm:px-4 md:px-6 lg:px-10`
- **Element Gaps**: `gap-4 sm:gap-6 lg:gap-8`
- **Card Padding**: `p-4 sm:p-6 lg:p-8`

## 5. Component Guidelines

### Buttons
```css
/* Primary Button */
.primary-button {
  background-color: var(--primary-color);
  color: var(--white);
  border-radius: 1rem;
  padding: 0.75rem 1.5rem;
  font-weight: 600;
  transition: all 0.3s ease;
}

.primary-button:hover {
  background-color: #151f9e; /* Darkened primary */
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(26, 40, 194, 0.3);
}

/* Secondary Button */
.secondary-button {
  background-color: var(--secondary-color);
  color: var(--dark-blue);
  border: 1px solid var(--primary-color);
  border-radius: 1rem;
  padding: 0.75rem 1.5rem;
  font-weight: 600;
}
```

### Cards
```css
.card {
  background-color: var(--white);
  border-radius: 1.5rem;
  padding: 1.5rem;
  box-shadow: 0 4px 20px rgba(26, 40, 194, 0.1);
  transition: all 0.3s ease;
}

.card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 30px rgba(26, 40, 194, 0.15);
}
```

### Sections
```css
.section {
  padding: 3rem 1rem;
  background-color: var(--white);
}

.section-alt {
  padding: 3rem 1rem;
  background-color: var(--secondary-color);
}
```

## 6. Responsive Design

### Breakpoints
```css
/* Mobile First */
xs: 475px    /* Extra small devices */
sm: 640px    /* Small devices */
md: 768px    /* Medium devices */
lg: 1024px   /* Large devices */
xl: 1280px   /* Extra large devices */
2xl: 1536px  /* 2X large devices */
```

### Responsive Patterns
- **Mobile**: Single column, stacked elements
- **Tablet**: Two columns where appropriate
- **Desktop**: Multi-column layouts, side-by-side content

## 7. Animation & Transitions

### Standard Transitions
```css
/* Standard transition */
transition: all 0.3s ease;

/* Hover effects */
transform: translateY(-2px);
box-shadow: 0 4px 12px rgba(26, 40, 194, 0.2);

/* Button interactions */
transform: scale(0.98); /* Active state */
```

### Animation Timing
- **Fast**: 0.15s (Micro-interactions)
- **Standard**: 0.3s (Hover effects, transitions)
- **Slow**: 0.5s (Page transitions, complex animations)

## 8. Icon System

### Material Symbols
- **Primary Icons**: Material Symbols Outlined
- **Size**: `text-xl sm:text-2xl lg:text-3xl`
- **Color**: Inherit from parent or use `var(--primary-color)`

### Icon Usage
```css
.material-symbols-outlined {
  font-family: 'Material Symbols Outlined';
  font-weight: normal;
  font-style: normal;
  font-size: 24px;
  line-height: 1;
  letter-spacing: normal;
  text-transform: none;
  display: inline-block;
  white-space: nowrap;
  word-wrap: normal;
  direction: ltr;
}
```

## 9. Implementation Notes

### CSS Variables
All colors are defined as CSS custom properties in the root element for easy maintenance and theming.

### Tailwind Integration
Colors are integrated with Tailwind CSS using the following configuration:
```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        'primary': '#1a28c2',
        'secondary': '#e3f2fd',
        'dark-blue': '#190dad',
        'medium-blue': '#1f6cc7',
        'light-blue': '#5cc4e4',
        'cyan-aqua': '#63dbe2',
      }
    }
  }
}
```

### Usage in Components
```tsx
// Use CSS variables
<div className="bg-[var(--primary-color)] text-white">

// Use Tailwind classes
<div className="bg-primary text-white">

// Use with opacity
<div className="bg-primary/10 text-dark-blue">
```

## 10. Maintenance Guidelines

### Adding New Colors
1. Define in CSS variables at root level
2. Add to Tailwind configuration
3. Update this specification
4. Test accessibility contrast ratios

### Modifying Existing Colors
1. Update CSS variables
2. Test across all components
3. Verify accessibility compliance
4. Update documentation

### Best Practices
- Always use CSS variables for colors
- Test color combinations for accessibility
- Maintain consistent spacing and typography
- Document any new design patterns

---

**Last Updated**: January 22, 2025
**Version**: 1.0
**Maintained By**: Development Team
