# Dumar Móveis Planejados Landing Page

## Overview

This is a sophisticated landing page website for Dumar Móveis Planejados, a high-end custom furniture company. The application is built as a modern React single-page application focusing on showcasing the company's portfolio, providing company information, and facilitating customer contact through WhatsApp integration.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized production builds
- **Routing**: Wouter for lightweight client-side routing
- **Styling**: Tailwind CSS with custom design system
- **Component Library**: shadcn/ui components built on Radix UI primitives
- **State Management**: TanStack Query for server state management
- **Form Handling**: React Hook Form with Zod validation

### Backend Architecture
- **Server**: Express.js with TypeScript
- **Runtime**: Node.js with ES modules
- **Development**: Hot module replacement via Vite integration
- **Database ORM**: Drizzle ORM configured for PostgreSQL
- **Session Storage**: PostgreSQL sessions with connect-pg-simple

### Design System
- **Typography**: Inter font family
- **Color Scheme**: 
  - Primary: Black (#000000)
  - Accent: Medium gray (#888888)
  - Background: White (#FFFFFF) with light gray tones
- **Theme**: CSS custom properties with light/dark mode support
- **Layout**: Mobile-first responsive design

## Key Components

### Core Pages and Sections
1. **Header**: Fixed navigation with mobile hamburger menu
2. **Hero Section**: Full-screen banner with compelling CTAs
3. **About Section**: Company information with feature highlights
4. **Portfolio Section**: Filterable project gallery with modal previews
5. **Contact Section**: Lead generation form with WhatsApp integration
6. **Footer**: Company links and social media

### Interactive Features
- **WhatsApp Integration**: Fixed floating button and form-to-WhatsApp conversion
- **Portfolio Modal**: Image galleries with project descriptions
- **Mobile Navigation**: Collapsible menu for mobile devices
- **Form Validation**: Real-time validation with toast notifications
- **Responsive Images**: Optimized loading with proper aspect ratios

### UI Components
- Complete shadcn/ui component library implementation
- Custom styled components following design guidelines
- Accessible form controls with proper labeling
- Toast notifications for user feedback
- Modal dialogs for portfolio items

## Data Flow

### Content Management
- **Static Content**: Hardcoded in components (no CMS required)
- **Portfolio Data**: Defined in `lib/portfolio-data.ts` with TypeScript interfaces
- **Images**: External URLs (Unsplash) for portfolio and hero sections

### User Interactions
1. **Navigation**: Smooth scrolling to page sections via anchor links
2. **Contact Form**: Collects user data and redirects to WhatsApp with pre-filled message
3. **Portfolio Filtering**: Client-side filtering by project category
4. **Modal Interactions**: Click-to-expand portfolio items

### State Management
- **Form State**: React Hook Form for contact form management
- **UI State**: Local component state for modals, menus, and filters
- **Toast State**: Custom toast hook for notifications

## External Dependencies

### Core Dependencies
- **React Ecosystem**: React, React DOM, React Hook Form
- **UI Framework**: Radix UI primitives, Lucide React icons
- **Styling**: Tailwind CSS, class-variance-authority, clsx
- **Database**: Drizzle ORM, @neondatabase/serverless
- **Utilities**: date-fns, zod validation

### Development Dependencies
- **Build Tools**: Vite, TypeScript, esbuild
- **Development**: tsx for TypeScript execution, Replit integration plugins

### External Services
- **Images**: Unsplash CDN for high-quality stock photos
- **WhatsApp**: Direct integration via wa.me links
- **Fonts**: Google Fonts (Inter family)

## Deployment Strategy

### Build Process
1. **Frontend**: Vite builds optimized React application to `dist/public`
2. **Backend**: esbuild bundles Express server to `dist/index.js`
3. **Assets**: Static assets served from built frontend

### Environment Configuration
- **Development**: Hot reload with Vite dev server
- **Production**: Express serves static files and API routes
- **Database**: PostgreSQL connection via DATABASE_URL environment variable

### Hosting Requirements
- Node.js runtime environment
- PostgreSQL database (though currently using in-memory storage)
- Environment variable support for database configuration

### Performance Optimizations
- **Code Splitting**: Vite automatic chunk splitting
- **Asset Optimization**: Vite handles CSS/JS minification
- **Image Loading**: External CDN reduces bundle size
- **Font Loading**: Optimized Google Fonts loading with display=swap

### Scalability Considerations
- **Static Content**: Ready for CDN deployment
- **Database**: Configured for PostgreSQL with Drizzle migrations
- **Session Management**: PostgreSQL-backed sessions for user state
- **API Routes**: Structured for future backend feature expansion

The application is designed as a conversion-focused landing page with emphasis on mobile experience, fast loading times, and clear paths to customer engagement through WhatsApp contact.