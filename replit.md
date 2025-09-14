# Iranian Christian Church of D.C. Website

## Overview
A comprehensive, modern church website with AI-powered features built for the Iranian Christian Church of D.C. This is a sophisticated React application with extensive functionality including content management, user authentication, Bible study tools, AI assistance, and much more.

## Current State
- ✅ Fully functional church website running on Replit
- ✅ React 18.3.1 with TypeScript and Vite build system
- ✅ AI-powered features with Google Gemini integration
- ✅ Comprehensive backend with Node.js/Express and SQLite
- ✅ Multi-language support (English/Farsi)
- ✅ User authentication and admin dashboard
- ✅ Configured for Replit environment (port 5000)

## Key Features
- **Multi-language Support**: English and Farsi (Persian) language switching
- **AI Integration**: Google Gemini AI for translations, content generation, and assistance
- **User Management**: Registration, authentication, profile management
- **Admin Dashboard**: Full content management system for church administrators
- **Bible Study Tools**: Searchable Bible with multiple versions
- **Event Management**: Church events, schedule management
- **Prayer Wall**: Community prayer requests and testimonials
- **Gallery**: Photo and media management
- **Live Streaming**: Integration for church services
- **Email System**: Built-in communication tools
- **Progressive Web App**: Mobile-friendly with offline capabilities
- **Prayer Slides System**: Interactive prayer slides for worship presentations with beautiful heart icons and gradients
- **Daily Messages System**: Inspirational message system inspired by Pastor Javad's WhatsApp messages with multi-channel delivery (website, email, SMS, WhatsApp)

## Tech Stack
- **Frontend**: React 18.3.1, TypeScript, Vite, Lucide Icons
- **Backend**: Node.js, Express, SQLite database
- **AI Services**: Google Gemini API integration
- **Styling**: Modern CSS with responsive design
- **Additional Libraries**: React Router, Chart.js, React PageFlip, React Quill

## Project Structure
```
iranian-church-website/
├── components/          # React components (admin, forms, layouts)
├── pages/              # Page components (home, about, services, etc.)
├── context/            # React contexts (auth, language, content)
├── hooks/              # Custom React hooks
├── lib/                # Utility libraries and configurations
├── services/           # API services (Gemini, translation)
├── backend/            # Express server and database
├── types.ts            # TypeScript type definitions
├── vite.config.ts      # Vite configuration
└── package.json        # Dependencies and scripts
```

## Environment Variables
- `GEMINI_API_KEY`: Required for AI features (translation, content generation)

## Recent Changes
- 2025-09-09: Imported and set up complete Iranian Church website from GitHub
- 2025-09-09: Configured Vite for Replit environment with proper host settings
- 2025-09-09: Resolved React version compatibility issues with legacy peer deps
- 2025-09-09: Configured Google Gemini API integration
- 2025-09-09: Enhanced homepage with ImageSlider component and beautiful church photo gallery
- 2025-09-09: Replaced external robot image with church imagery in hero section
- 2025-09-09: Added interactive gallery section with hover effects and church photos
- 2025-09-12: Implemented comprehensive prayer slide system with Heart icons and spiritual themes for worship presentations
- 2025-09-12: Created daily message system inspired by Pastor Javad's WhatsApp messages with multi-channel delivery
- 2025-09-12: Added PostgreSQL database support with proper schema migration and authentication
- 2025-09-12: Integrated admin dashboard with secure navigation for prayer slides and daily messages management
- 2025-09-12: Fixed critical API issues including snake_case to camelCase normalization and route protection

## User Preferences
- Multi-language support for English and Farsi speakers
- AI-powered content translation and assistance
- Comprehensive church management features
- Mobile-responsive design for all devices