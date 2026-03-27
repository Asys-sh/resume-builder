# Resume Builder Template System

Comprehensive documentation for the landed template architecture, including React templates, HTML template importing, and the centralized registry system.

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Template Structure](#template-structure)
4. [Creating React Templates](#creating-react-templates)
5. [Importing HTML Templates](#importing-html-templates)
6. [Template Importer Details](#template-importer-details)
7. [Limitations and Known Issues](#limitations-and-known-issues)
8. [Manual Adjustments Required](#manual-adjustments-required)
9. [Future Enhancements](#future-enhancements)
10. [API Reference](#api-reference)
11. [Troubleshooting](#troubleshooting)
12. [Examples](#examples)

---

## Overview

The Resume Builder uses a **centralized template system** built around the `TemplateRegistry` class. Templates define the visual styling and layout of resumes using CSS classes and React components.

### Supported Template Types

1. **React Inline Templates**: Templates defined in TypeScript with React components and Tailwind CSS classes
2. **HTML Imported Templates**: Templates parsed from static HTML files with embedded Tailwind configurations

### Key Components

- **TemplateRegistry** (`src/stores/templates.ts`): Centralized registry managing all templates
- **Template Definitions** (`src/lib/templateDefinitions.tsx`): Hardcoded React templates (Modern, Classic, Minimalist, Creative)
- **Template Importer** (`src/lib/templateImporter.ts`): Parses and registers HTML templates from the file system
- **Template Initialization** (`src/lib/initializeTemplates.ts`): Registers all templates on app startup
- **ResumePreview** (`src/components/builder/ResumePreview.tsx`): Renders resumes using template CSS classes

---

## Architecture

### Template Registry Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    App Initialization                       │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
        ┌────────────────────────────┐
        │  initializeTemplates()     │
        └──────────┬─────────────────┘
                   │
          ┌────────┴────────┐
          ▼                 ▼
  ┌──────────────┐   ┌──────────────────┐
  │ Register     │   │ registerHtml     │
  │ React        │   │ Templates()      │
  │ Templates    │   │                  │
  └──────┬───────┘   └────────┬─────────┘
         │                    │
         │                    ▼
         │           ┌──────────────────┐
         │           │ scanTemplates    │
         │           │ Directory()      │
         │           └────────┬─────────┘
         │                    │
         │                    ▼
         │           ┌──────────────────┐
         │           │ parseHtmlTemplate│
         │           │ ()               │
         │           └────────┬─────────┘
         │                    │
         └──────┬─────────────┘
                ▼
       ┌─────────────────┐
       │ TemplateRegistry│
       │   .register()   │
       └────────┬────────┘
                │
                ▼
       ┌─────────────────┐
       │ Templates        │
       │ Available in UI  │
       └──────────────────┘
```

### Runtime Template Selection

```
User selects template in TemplateSelector
         │
         ▼
selectedTemplate ID stored in resumeDataAtom
         │
         ▼
ResumePreview fetches template via templateRegistry.getById()
         │
         ▼
Extract cssClasses from TemplateMetadata
         │
         ▼
Apply classes to resume sections
         │
         ▼
Live preview rendered
```

---

## Template Structure

### TemplateMetadata Interface

All templates conform to the `TemplateMetadata` interface:

```typescript
interface TemplateMetadata {
  /** Unique identifier (kebab-case) */
  id: string

  /** Display name shown in UI */
  name: string

  /** Brief description */
  description: string

  /** Preview component for template selector */
  previewComponent: ReactNode

  /** Layout structure */
  layoutType: 'single-column' | 'two-column' | 'sidebar'

  /** CSS class mappings */
  cssClasses: TemplateClasses
}
```

### TemplateClasses Interface

CSS class mappings for resume sections:

```typescript
interface TemplateClasses {
  // Core required properties (for all templates)
  headerContainer: string         // Header wrapper classes
  headerName: string              // Name/title classes
  sectionTitle: string            // Section heading classes

  // Optional properties (relaxed for sidebar layouts)
  contactRow?: string             // Contact info row classes (optional for sidebar-integrated)
  linksRow?: string               // Links row classes (optional for sidebar-integrated)

  // Additional optional properties (used by HTML-imported templates)
  sectionContainer?: string       // Section wrapper classes
  experienceItem?: string         // Individual experience entry classes
  educationItem?: string          // Individual education entry classes
  skillsContainer?: string        // Skills section wrapper classes
  projectItem?: string            // Individual project entry classes
  sidebarContainer?: string       // Sidebar classes (for sidebar layouts)
  mainContentContainer?: string   // Main content area classes
}
```

**Note on Validation**: Validation is now relaxed:
- Core keys (`headerContainer`, `headerName`, `sectionTitle`) are required but empty values generate warnings (not errors)
- Optional keys (`contactRow`, `linksRow`) are no longer required for sidebar layouts where contact info may be integrated
- Fallback classes are automatically applied in `ResumePreview` for empty or missing optional classes

---

## Creating React Templates

### Step 1: Define Template Metadata

Create a template object in `src/lib/templateDefinitions.tsx`:

```typescript
import type { TemplateMetadata } from '@/stores/templates'

export const myCustomTemplate: TemplateMetadata = {
  id: 'my-custom',
  name: 'My Custom Template',
  description: 'A custom template with unique styling',
  layoutType: 'single-column',
  previewComponent: (
    <div className="w-full h-full bg-white p-2">
      <div className="h-4 bg-blue-500 rounded mb-2" />
      <div className="h-2 bg-gray-300 rounded mb-1 w-3/4" />
      <div className="h-2 bg-gray-200 rounded w-1/2" />
    </div>
  ),
  cssClasses: {
    headerContainer: 'text-center mb-6 pb-4 border-b-2 border-blue-500',
    headerName: 'text-4xl font-bold text-blue-700',
    sectionTitle: 'text-2xl font-bold text-blue-600 border-l-4 border-blue-500 pl-3 mt-6 mb-3',
    contactRow: 'flex flex-wrap justify-center gap-3 text-sm text-gray-600 mt-2',
    linksRow: 'flex justify-center gap-4 text-sm mt-2',
  },
}
```

### Step 2: Register the Template

Add your template to the `TEMPLATES` array in `src/lib/initializeTemplates.ts`:

```typescript
import { myCustomTemplate } from './templateDefinitions'

const TEMPLATES = [
  modernTemplate,
  classicTemplate,
  minimalistTemplate,
  creativeTemplate,
  myCustomTemplate, // Add your template here
]
```

### Step 3: Test the Template

1. Restart the development server
2. Open the resume builder
3. Select your template from the template selector
4. Verify the preview renders correctly

### Best Practices

- **Use Tailwind CSS**: Stick to Tailwind utility classes for consistency
- **Kebab-case IDs**: Template IDs must follow kebab-case convention (e.g., `my-template`)
- **Descriptive Preview**: Create preview components that visually represent the template's style
- **Semantic Class Names**: Use descriptive class names that reflect the styling purpose
- **Test Responsiveness**: Ensure classes work across different screen sizes

---

## Importing HTML Templates

### Overview

The template importer system allows you to add HTML templates to the `resume_templates/` directory and have them automatically parsed and registered.

### Step 1: Create an HTML Template

Place your `.html` file in the `resume_templates/` directory (relative to project root):

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Professional Sidebar Template</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      theme: {
        extend: {
          colors: {
            primary: '#2563eb',
            secondary: '#64748b',
            accent: '#0ea5e9',
          }
        }
      }
    }
  </script>
</head>
<body>
  <div class="max-w-4xl mx-auto bg-white shadow-lg">
    <!-- Header -->
    <header class="bg-primary text-white p-6 text-center">
      <h1 class="text-4xl font-bold">John Doe</h1>
      <p class="text-lg mt-2">Senior Software Engineer</p>

      <!-- Contact Info -->
      <div class="flex justify-center gap-4 text-sm mt-3">
        <span>john@example.com</span>
        <span>|</span>
        <span>(555) 123-4567</span>
      </div>

      <!-- Links -->
      <div class="flex justify-center gap-4 text-sm mt-2">
        <a href="https://linkedin.com/in/johndoe" class="hover:underline">LinkedIn</a>
        <a href="https://johndoe.com" class="hover:underline">Portfolio</a>
      </div>
    </header>

    <!-- Experience Section -->
    <section class="p-6">
      <h2 class="text-2xl font-bold text-primary border-b-2 border-primary pb-2">Experience</h2>
      <div class="mt-4">
        <h3 class="text-xl font-semibold">Senior Developer</h3>
        <p class="text-gray-600">Tech Company | 2020 - Present</p>
        <ul class="list-disc ml-6 mt-2 text-gray-700">
          <li>Built scalable web applications</li>
          <li>Led team of 5 engineers</li>
        </ul>
      </div>
    </section>

    <!-- Education Section -->
    <section class="p-6">
      <h2 class="text-2xl font-bold text-primary border-b-2 border-primary pb-2">Education</h2>
      <div class="mt-4">
        <h3 class="text-xl font-semibold">B.S. Computer Science</h3>
        <p class="text-gray-600">University Name | 2016 - 2020</p>
      </div>
    </section>
  </div>
</body>
</html>
```

### Step 2: Restart the App

The template will be automatically:
1. Detected by `scanTemplatesDirectory()`
2. Parsed by `parseHtmlTemplate()`
3. Validated by `validateTemplateMetadata()`
4. Registered with `templateRegistry.register()`

### Step 3: Verify Registration

Check the console logs for:
```
✓ Registered 4 React templates + 1 HTML templates
```

### HTML Template Requirements

- **File Extension**: Must be `.html`
- **Tailwind Config**: Embed Tailwind config in `<script>` tag for color/font extraction
- **Semantic HTML**: Use `<header>`, `<h1>`, `<h2>`, `<section>` for better class extraction
- **Title Tag**: Include `<title>` for template name extraction
- **Class Attributes**: Use Tailwind utility classes in `class=""` attributes

### Naming Convention

Template IDs are generated from filenames:
- `template_1.html` → `template-1`
- `Professional Resume.html` → `professional-resume`
- `Modern_Sidebar.html` → `modern-sidebar`

**For Descriptive Names**: Add a custom name comment at the top of your HTML file for better UI/UX:

```html
<!DOCTYPE html>
<!-- Template Name: Your Descriptive Name -->
<html lang="en">
```

**Examples**:
- For `template_1.html` (creative sidebar): `<!-- Template Name: Creative Sidebar (HTML) -->`
- For `template_2.html` (product manager): `<!-- Template Name: Professional Product Manager (HTML) -->`

The system uses the following priority for name extraction:
1. **Custom HTML comment** (highest priority) - `<!-- Template Name: ... -->`
2. **Title tag** - `<title>Template Name</title>`
3. **Filename** - Generated from filename as fallback

Known templates are automatically overridden with descriptive names (see `scanTemplatesDirectory` mapping in `templateImporter.ts`).

---

## Template Importer Details

### Parsing Process

The `parseHtmlTemplate()` function orchestrates the parsing:

1. **Extract Template Name**: Reads `<title>` tag or generates from filename
2. **Detect Layout Type**: Analyzes HTML structure to identify layout pattern
3. **Extract Tailwind Config**: Parses embedded Tailwind configuration
4. **Map CSS Classes**: Extracts classes from HTML elements and maps to `TemplateClasses`
5. **Generate Preview**: Creates a simplified preview component
6. **Validate Metadata**: Ensures all required fields are present

### Layout Detection Algorithm

`extractLayoutType()` uses heuristic patterns:

#### Sidebar Layout Detection
Triggers when HTML contains:
- `<aside>` tags
- Classes: `w-1/3`, `w-2/5`, `md:col-span-1`
- Flex layouts with unequal widths

#### Two-Column Layout Detection
Triggers when HTML contains:
- Classes: `grid-cols-2`, `md:grid-cols-2`, `lg:grid-cols-2`
- Balanced grid layouts

#### Single-Column Layout (Default)
Used when no clear pattern detected.

### Tailwind Config Extraction

`extractTailwindConfig()` extracts:
- **Colors**: `colors: { primary: '#3b82f6' }`
- **Font Families**: `fontFamily: { sans: ['Inter', 'sans-serif'] }`
- **Border Radius**: `borderRadius: { lg: '0.5rem' }`

**Extraction Pattern**:
```javascript
tailwind.config = {
  theme: {
    extend: {
      colors: { ... },
      fontFamily: { ... }
    }
  }
}
```

### CSS Class Extraction

`extractCssClasses()` maps HTML to `TemplateClasses`:

| TemplateClasses Property | HTML Element Pattern | Fallback Behavior |
|-------------------------|----------------------|-------------------|
| `headerContainer` | `<header class="...">` | Empty string (warning) |
| `headerName` | `<h1 class="...">` inside header | Empty string (warning) |
| `sectionTitle` | `<h2 class="...">` | Empty string (warning) |
| `contactRow` | `<div class="...">` with flex + icons/email/phone | `flex gap-2 text-sm text-gray-600 mt-2` |
| `linksRow` | `<div class="...">` containing LinkedIn/website | `flex gap-3 text-sm text-gray-600 mt-1` |
| `sectionContainer` | `<section class="...">` | Not extracted |
| `sidebarContainer` | `<aside class="...">` | Not extracted |
| `mainContentContainer` | `<main class="...">` | Not extracted |

**Extraction Quality**:
- Extraction is best-effort using regex patterns
- Improved detection for Material Symbols icons in contact sections
- Fallbacks automatically applied for `contactRow` and `linksRow` to prevent styling loss
- Empty core classes generate warnings but don't block registration
- Complex structures may require manual adjustments

**To Override Post-Import** (non-persistent):
```typescript
const template = templateRegistry.getById('template-1')
if (template) {
  template.cssClasses.contactRow = 'custom-classes'
}
```

### Preview Component Generation

`generatePreviewComponent()` creates a simplified visual representation:
- Uses extracted color scheme
- Shows placeholder bars representing header, content, and sections
- Does not fully replicate template complexity

---

## Limitations and Known Issues

### 1. Layout Rendering Limitation

**Issue**: `ResumePreview` currently only supports single-column rendering.

**Impact**: HTML templates with sidebar or two-column layouts are rendered in single-column format, losing their original layout structure.

**Workaround**: Templates are still registered and styling is applied, but layout fidelity is reduced.

**Future Fix**: Extend `ResumePreview` to detect `template.layoutType` and render different structures:
```typescript
if (template.layoutType === 'sidebar') {
  return <SidebarLayout template={template} data={resumeData} />
} else {
  return <SingleColumnLayout template={template} data={resumeData} />
}
```

### 2. CSS Fidelity

**Issue**: Not all HTML styling can be captured in the `TemplateClasses` interface.

**Impact**: Some visual details (gradients, complex layouts, custom animations) may be lost during import.

**Workaround**: Manually extend `TemplateClasses` with additional optional properties or create a custom React template.

### 3. Custom Tailwind Configurations

**Issue**: Colors and fonts from HTML templates are extracted but not automatically merged into the app's `tailwind.config.ts`.

**Impact**: Template-specific colors may not work correctly if referenced by Tailwind class names (e.g., `text-primary`).

**Workaround**: Manually copy custom colors to `tailwind.config.ts` after importing templates.

### 4. Material Symbols Icons

**Issue**: HTML templates using Material Symbols or other icon fonts require the font to be added to the project.

**Impact**: Icons may not render correctly in the React preview.

**Workaround**: Add icon font to `app/layout.tsx`:
```typescript
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined" rel="stylesheet" />
```

### 5. Static Parsing

**Issue**: HTML templates are parsed once during initialization. Changes require app restart.

**Impact**: No hot-reload for HTML template changes during development.

**Workaround**: Restart the dev server after modifying HTML templates.

### 6. Complex HTML Structures

**Issue**: Regex-based extraction may fail on nested or complex HTML structures.

**Impact**: Some CSS classes may not be extracted correctly.

**Workaround**: Simplify HTML structure or manually create a React template.

---

## Manual Adjustments Required

### 1. Merging Tailwind Configs

If your HTML template uses custom colors:

**Extract colors from HTML**:
```html
<script>
  tailwind.config = {
    theme: {
      extend: {
        colors: {
          primary: '#2563eb',
          accent: '#0ea5e9'
        }
      }
    }
  }
</script>
```

**Add to `tailwind.config.ts`**:
```typescript
export default {
  theme: {
    extend: {
      colors: {
        primary: '#2563eb',
        accent: '#0ea5e9',
        // ... other colors
      }
    }
  }
}
```

### 2. Adding Icon Fonts

If your template uses icon fonts:

**Add to `app/layout.tsx`**:
```typescript
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
```

### 3. Enhancing Layout Support

To support sidebar layouts:

**Extend `ResumePreview` to detect layout type**:
```typescript
const template = templateRegistry.getById(selectedTemplate)

if (template?.layoutType === 'sidebar') {
  return (
    <div className="grid grid-cols-3 gap-6">
      <aside className={template.cssClasses.sidebarContainer}>
        {/* Sidebar content */}
      </aside>
      <main className={`col-span-2 ${template.cssClasses.mainContentContainer}`}>
        {/* Main content */}
      </main>
    </div>
  )
}
```

### 4. Refining Preview Components

Generated previews are simplified. For richer previews:

**Manually create preview component in `templateDefinitions.tsx`**:
```typescript
export const importedTemplatePreview = (
  <div className="w-full h-full bg-white p-2">
    <div className="h-4 bg-blue-500 rounded mb-2" />
    <div className="flex gap-1">
      <div className="h-8 bg-gray-200 rounded w-1/3" />
      <div className="flex-1 space-y-1">
        <div className="h-2 bg-gray-300 rounded" />
        <div className="h-2 bg-gray-200 rounded w-3/4" />
      </div>
    </div>
  </div>
)
```

**Update template after import**:
```typescript
const template = templateRegistry.getById('imported-template')
if (template) {
  template.previewComponent = importedTemplatePreview
}
```

---

## Future Enhancements

### Phase 2: Multi-Layout Support

- [ ] Add `SidebarLayout` component for sidebar templates
- [ ] Add `TwoColumnLayout` component for two-column templates
- [ ] Update `ResumePreview` to conditionally render based on `layoutType`
- [ ] Create layout-specific CSS class mappings

### Phase 3: Dynamic Tailwind Config

- [ ] Automatically merge extracted Tailwind configs at runtime
- [ ] Use CSS-in-JS or style tags for template-specific colors
- [ ] Implement theme switching for per-template color schemes

### Phase 4: Live Template Editing

- [ ] Add template editor UI for HTML templates
- [ ] Hot-reload templates without server restart
- [ ] Visual template builder with drag-and-drop sections

### Phase 5: Template Marketplace

- [ ] Import templates from URLs
- [ ] Browse community-submitted templates
- [ ] Rate and review templates

### Phase 6: Export Capabilities

- [ ] Export templates back to HTML format
- [ ] Export to PDF with full styling
- [ ] Export to DOCX/LaTeX formats

### Phase 7: Template Versioning

- [ ] Track template versions
- [ ] Migration system for template schema changes
- [ ] Backward compatibility layer

---

## API Reference

### TemplateRegistry

**Location**: `src/stores/templates.ts`

#### Methods

##### `register(template: TemplateMetadata): void`
Registers a template. Throws error if ID already exists.

```typescript
templateRegistry.register(myTemplate)
```

##### `getAll(): TemplateMetadata[]`
Returns all registered templates.

```typescript
const templates = templateRegistry.getAll()
```

##### `getById(id: string): TemplateMetadata | undefined`
Gets template by ID.

```typescript
const template = templateRegistry.getById('modern')
```

##### `has(id: string): boolean`
Checks if template exists.

```typescript
if (templateRegistry.has('custom-template')) {
  // Template exists
}
```

##### `getCount(): number`
Returns the number of registered templates.

```typescript
console.log(`Total templates: ${templateRegistry.getCount()}`)
```

---

### Template Importer Functions

**Location**: `src/lib/templateImporter.ts`

#### `parseHtmlTemplate(htmlContent: string, templateId: string): TemplateMetadata`

Parses HTML string and returns `TemplateMetadata`.

**Parameters**:
- `htmlContent`: Raw HTML string
- `templateId`: Unique identifier (kebab-case)

**Returns**: `TemplateMetadata` object

**Example**:
```typescript
const html = fs.readFileSync('template.html', 'utf-8')
const metadata = parseHtmlTemplate(html, 'my-template')
```

---

#### `extractLayoutType(htmlContent: string): 'single-column' | 'two-column' | 'sidebar'`

Detects layout type from HTML structure.

**Parameters**:
- `htmlContent`: Raw HTML string

**Returns**: Layout type identifier

**Example**:
```typescript
const layoutType = extractLayoutType(html)
console.log(layoutType) // 'sidebar'
```

---

#### `extractTailwindConfig(htmlContent: string): TailwindConfigExtract | null`

Extracts Tailwind configuration from `<script>` tags.

**Parameters**:
- `htmlContent`: Raw HTML string

**Returns**: Config object or `null` if not found

**Example**:
```typescript
const config = extractTailwindConfig(html)
console.log(config.colors?.primary) // '#3b82f6'
```

---

#### `extractCssClasses(htmlContent: string, layoutType: string): TemplateClasses`

Maps HTML structure to `TemplateClasses` interface.

**Parameters**:
- `htmlContent`: Raw HTML string
- `layoutType`: Detected layout type

**Returns**: `TemplateClasses` object

**Example**:
```typescript
const classes = extractCssClasses(html, 'sidebar')
console.log(classes.headerContainer) // 'bg-primary text-white p-6'
```

---

#### `generatePreviewComponent(templateId: string, colors: Record<string, string> | null): ReactNode`

Generates simplified preview component.

**Parameters**:
- `templateId`: Template identifier
- `colors`: Extracted color scheme or `null`

**Returns**: React element

**Example**:
```typescript
const preview = generatePreviewComponent('my-template', { primary: '#3b82f6' })
```

---

#### `validateTemplateMetadata(metadata: TemplateMetadata): { isValid: boolean; errors: string[] }`

Validates template metadata.

**Parameters**:
- `metadata`: Template metadata to validate

**Returns**: Validation result with errors

**Example**:
```typescript
const result = validateTemplateMetadata(metadata)
if (!result.isValid) {
  console.error('Validation errors:', result.errors)
}
```

---

#### `scanTemplatesDirectory(directoryPath: string): Promise<TemplateMetadata[]>`

Scans directory for HTML templates and parses them.

**Parameters**:
- `directoryPath`: Absolute path to templates directory

**Returns**: Promise resolving to array of valid templates

**Example**:
```typescript
const templates = await scanTemplatesDirectory('/path/to/resume_templates')
console.log(`Found ${templates.length} templates`)
```

---

#### `registerHtmlTemplates(directoryPath: string): Promise<void>`

High-level function to scan and register HTML templates.

**Parameters**:
- `directoryPath`: Absolute path to templates directory

**Returns**: Promise that resolves when registration is complete

**Example**:
```typescript
await registerHtmlTemplates('/path/to/resume_templates')
```

---

## Troubleshooting

### Verifying Template Registration

After adding or modifying HTML templates:

1. **Check Dev Console Logs**: After app restart, look for:
   ```
   ✓ Registered 4 React templates + 2 HTML templates
   ```

2. **Review Template Table**: In development mode, a detailed table shows HTML template details:
   ```
   ┌─────────┬──────────────────────────────────┬─────────┬──────────────┐
   │  id     │ name                             │ layout  │ classesCount │
   ├─────────┼──────────────────────────────────┼─────────┼──────────────┤
   │template-1│ Creative Sidebar (HTML)         │ sidebar │ 7            │
   │template-2│ Professional Product Manager... │ sidebar │ 7            │
   └─────────┴──────────────────────────────────┴─────────┴──────────────┘
   ```

3. **Test in UI**:
   - Open template selector - confirm 6 templates appear
   - Select HTML template (e.g., 'Creative Sidebar (HTML)')
   - Verify preview shows extracted colors (e.g., gold sidebar for template_1)
   - Check layout badge appears for sidebar templates
   - Inspect DOM to confirm CSS classes are applied (e.g., `headerContainer`)

4. **Verify Names**: HTML templates should show descriptive names, not generic ones like "Template 1" or "Document"

### Template Not Appearing in Selector

**Possible Causes**:
1. Template ID already exists (duplicate)
2. Validation failed
3. File not in `resume_templates/` directory
4. File extension is not `.html`

**Solutions**:
- Check console logs for errors
- Ensure unique template ID
- Verify file path and extension
- Run `validateTemplateMetadata()` manually

---

### CSS Classes Not Applied

**Possible Causes**:
1. Class extraction failed due to complex HTML structure
2. Tailwind classes not recognized by app's config
3. Optional properties missing

**Solutions**:
- Simplify HTML structure
- Check extracted classes in console
- Manually add classes to template definition
- Merge Tailwind configs

---

### Preview Component Not Rendering

**Possible Causes**:
1. Invalid React element structure
2. Missing color scheme
3. Preview component generation failed

**Solutions**:
- Check browser console for React errors
- Manually create preview component
- Ensure `generatePreviewComponent()` returns valid JSX

---

### Layout Looks Wrong

**Possible Causes**:
1. Sidebar/two-column layout rendered as single-column
2. CSS classes incomplete
3. Tailwind classes conflict

**Solutions**:
- Accept single-column limitation or extend `ResumePreview`
- Manually adjust template CSS classes
- Review Tailwind config for conflicts

---

### Registration Fails with "Already Registered"

**Cause**: Template ID collision

**Solution**:
- Rename HTML file to generate unique ID
- Manually set unique ID in template metadata
- Remove duplicate template from registry

---

## Examples

### Example 1: Simple React Template

**Define in `src/lib/templateDefinitions.tsx`**:
```typescript
export const minimalTemplate: TemplateMetadata = {
  id: 'minimal',
  name: 'Minimal',
  description: 'Clean and simple design',
  layoutType: 'single-column',
  previewComponent: (
    <div className="w-full h-full bg-white p-2">
      <div className="h-3 bg-gray-800 rounded w-1/2 mb-2" />
      <div className="h-2 bg-gray-300 rounded w-1/3 mb-1" />
      <div className="h-2 bg-gray-200 rounded w-2/3" />
    </div>
  ),
  cssClasses: {
    headerContainer: 'mb-6',
    headerName: 'text-3xl font-light text-gray-800',
    sectionTitle: 'text-xl font-light text-gray-800 uppercase tracking-wide mb-3 mt-6',
    contactRow: 'flex gap-4 text-sm text-gray-600 mt-2',
    linksRow: 'flex gap-3 text-sm text-gray-600 mt-1',
  },
}
```

**Register in `src/lib/initializeTemplates.ts`**:
```typescript
import { minimalTemplate } from './templateDefinitions'

const TEMPLATES = [
  modernTemplate,
  classicTemplate,
  minimalistTemplate,
  creativeTemplate,
  minimalTemplate,
]
```

---

### Example 2: HTML Template with Sidebar Layout

**File**: `resume_templates/sidebar-pro.html`

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Sidebar Professional</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      theme: {
        extend: {
          colors: {
            primary: '#1e40af',
            secondary: '#64748b',
          }
        }
      }
    }
  </script>
</head>
<body class="bg-gray-100">
  <div class="max-w-5xl mx-auto bg-white shadow-2xl flex">
    <!-- Sidebar -->
    <aside class="w-1/3 bg-primary text-white p-8">
      <div class="text-center">
        <h1 class="text-3xl font-bold">Jane Doe</h1>
        <p class="text-sm mt-2 opacity-90">Product Manager</p>
      </div>

      <section class="mt-8">
        <h2 class="text-lg font-bold border-b border-white/30 pb-2">Contact</h2>
        <div class="mt-3 space-y-2 text-sm">
          <div>jane@example.com</div>
          <div>(555) 987-6543</div>
        </div>
      </section>

      <section class="mt-6">
        <h2 class="text-lg font-bold border-b border-white/30 pb-2">Skills</h2>
        <div class="mt-3 space-y-1 text-sm">
          <div>Product Strategy</div>
          <div>Agile/Scrum</div>
          <div>Data Analysis</div>
        </div>
      </section>
    </aside>

    <!-- Main Content -->
    <main class="flex-1 p-8">
      <section>
        <h2 class="text-2xl font-bold text-primary border-b-2 border-primary pb-2">Experience</h2>
        <div class="mt-4">
          <h3 class="text-xl font-semibold">Senior Product Manager</h3>
          <p class="text-gray-600">Tech Startup | 2021 - Present</p>
          <ul class="list-disc ml-5 mt-2 text-gray-700 space-y-1">
            <li>Led product roadmap for 3 key products</li>
            <li>Increased user engagement by 40%</li>
          </ul>
        </div>
      </section>

      <section class="mt-6">
        <h2 class="text-2xl font-bold text-primary border-b-2 border-primary pb-2">Education</h2>
        <div class="mt-4">
          <h3 class="text-xl font-semibold">MBA</h3>
          <p class="text-gray-600">Business School | 2019 - 2021</p>
        </div>
      </section>
    </main>
  </div>
</body>
</html>
```

**Auto-registered as**: `sidebar-pro`

---

### Example 3: Manually Registering a Template

```typescript
import { templateRegistry } from '@/stores/templates'

const customTemplate = {
  id: 'manual-template',
  name: 'Manual Template',
  description: 'Manually registered template',
  layoutType: 'single-column',
  previewComponent: <div className="bg-blue-100 h-full" />,
  cssClasses: {
    headerContainer: 'text-center',
    headerName: 'text-4xl',
    sectionTitle: 'text-2xl',
    contactRow: 'flex gap-2',
    linksRow: 'flex gap-2',
  },
}

try {
  templateRegistry.register(customTemplate)
  console.log('Template registered successfully')
} catch (error) {
  console.error('Failed to register template:', error)
}
```

---

### Example 4: Scanning and Validating Templates

```typescript
import { scanTemplatesDirectory, validateTemplateMetadata } from '@/lib/templateImporter'
import path from 'path'

async function auditTemplates() {
  const templatesPath = path.join(process.cwd(), 'resume_templates')
  const templates = await scanTemplatesDirectory(templatesPath)

  console.log(`Found ${templates.length} templates:\n`)

  templates.forEach(template => {
    const validation = validateTemplateMetadata(template)

    console.log(`Template: ${template.name} (${template.id})`)
    console.log(`  Layout: ${template.layoutType}`)
    console.log(`  Valid: ${validation.isValid}`)

    if (!validation.isValid) {
      console.log(`  Errors:`, validation.errors)
    }

    console.log('')
  })
}

auditTemplates()
```

---

## Conclusion

The Resume Builder's template system provides a flexible architecture for both React and HTML templates. While there are current limitations (particularly around layout rendering), the system is designed for extensibility and future enhancements.

For questions or issues, please refer to the [Troubleshooting](#troubleshooting) section or check the codebase for inline documentation.
