# NotaryPro + VecinoXpress - Digital Legal Certification Platform

## Overview

This is a comprehensive LegalTech platform built for digital certification of legal documents in Chile. The system combines online digital certification services with a physical network of certification points (POS terminals) operated by local partners ("Vecinos"). The platform serves multiple user types including superadmins, certifiers, store owners, end users, partners, and HR personnel.

## System Architecture

### Technology Stack
- **Frontend**: React with TypeScript, Vite build system
- **UI Framework**: Tailwind CSS with shadcn/ui components
- **Backend**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Replit Auth with OpenID Connect
- **State Management**: TanStack Query for server state
- **Routing**: Wouter for client-side routing

### Architecture Pattern
The application follows a full-stack monorepo structure with clear separation of concerns:
- `client/` - React frontend application
- `server/` - Express.js backend API
- `shared/` - Shared TypeScript schemas and types

## Key Components

### Frontend Architecture
- **Component-based UI**: Built with React and shadcn/ui for consistent design
- **Role-based routing**: Different dashboard views for each user role
- **Real-time updates**: TanStack Query for efficient data fetching and caching
- **Responsive design**: Mobile-first approach with Tailwind CSS

### Backend Architecture
- **RESTful API**: Express.js with TypeScript for type safety
- **Database abstraction**: Drizzle ORM for type-safe database operations
- **Session management**: PostgreSQL-backed sessions for authentication
- **Role-based access control**: Middleware for protecting routes based on user roles

### Database Schema
The system uses PostgreSQL with the following main entities:
- **Users**: Multi-role user system (superadmin, certificador, vecino, usuario_final, socios, rrhh)
- **Documents**: Legal documents with status tracking and certification workflow
- **POS Locations**: Physical certification points managed by Vecinos
- **Commissions**: Revenue sharing system between stakeholders
- **Notifications**: Real-time communication system
- **Sessions**: Secure session storage for authentication

## Data Flow

### Document Certification Workflow
1. **Document Creation**: Users submit documents through the platform or POS terminals
2. **Identity Verification**: QR code-based mobile verification process
3. **Certification Queue**: Documents assigned to certified professionals
4. **Digital Certification**: Certified professionals review and digitally sign documents
5. **Delivery**: Certified documents delivered via email/WhatsApp with QR validation

### Commission Distribution
- **Vecino (Store Owner)**: 40% of document price
- **Certificador (Certifier)**: 35% of document price  
- **Administration**: 25% of document price

### User Roles and Permissions
- **Superadmin**: Full system control and analytics
- **Certificador**: Document certification and queue management
- **Vecino**: POS terminal management and earnings tracking
- **Usuario Final**: Document submission and tracking
- **Socios**: Partnership and project management
- **RRHH**: HR management and training coordination

## External Dependencies

### Authentication
- **Replit Auth**: OpenID Connect integration for secure authentication
- **Session Storage**: PostgreSQL-backed session management

### Database
- **Neon Database**: Serverless PostgreSQL with connection pooling
- **Drizzle ORM**: Type-safe database operations and migrations

### UI Components
- **Radix UI**: Unstyled, accessible component primitives
- **Tailwind CSS**: Utility-first CSS framework
- **shadcn/ui**: Pre-built component library

### Development Tools
- **Vite**: Fast build tool and development server
- **TypeScript**: Type safety across the entire stack
- **ESBuild**: Fast bundling for production builds

## Deployment Strategy

### Development Environment
- **Replit Integration**: Optimized for Replit development environment
- **Hot Module Replacement**: Fast development with Vite HMR
- **Database Migrations**: Drizzle Kit for schema management

### Production Deployment
- **Build Process**: Vite builds frontend, ESBuild bundles backend
- **Static Assets**: Frontend served as static files
- **Environment Variables**: Database URL and session secrets
- **Health Checks**: Application health monitoring on port 5000

### Security Considerations
- **HTTPS Only**: Secure cookie settings for production
- **CSRF Protection**: Built into authentication flow
- **Role-based Access**: Middleware protection for sensitive routes
- **Data Validation**: Zod schemas for input validation

## Changelog

```
Changelog:
- June 23, 2025. Enhanced Certificador dashboard with template-based document creation, client signature capture, and immediate eToken digital signing workflow
- June 23, 2025. Completed comprehensive role-based dashboard system for all 6 user types (Superadmin, Certificador, Vecino, Usuario, Socios, RRHH)
- June 17, 2025. Initial setup
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```