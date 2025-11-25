<div align="center">

# TaskFlow

### Modern Project Management for High-Performance Teams

*A professional, Linear-inspired task management platform with real-time analytics, intelligent insights, and a stunning dark UI.*

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)

[Features](#features) • [Quick Start](#quick-start) • [Tech Stack](#tech-stack) • [Screenshots](#screenshots) • [Roadmap](#roadmap)

</div>

---

## Features

### Core Functionality

| Feature | Description |
|---------|-------------|
| **Project Management** | Create unlimited projects with custom templates, track progress, and manage team workspaces |
| **Smart Task System** | Kanban boards, list views, drag-and-drop, priority management, and real-time status tracking |
| **Real-time Analytics** | Live metrics, completion rates, performance trends, and productivity insights |
| **Team Insights** | AI-powered recommendations for workflow optimization and bottleneck detection |
| **File Attachments** | AWS S3-powered document management with secure presigned URL downloads |
| **Authentication** | Secure JWT-based auth with bcrypt password hashing and automatic session management |
| **Beautiful UI** | Linear-inspired ultra-dark theme with smooth animations and micro-interactions |

### User Experience

- **Blazing Fast** - Optimized rendering with Next.js 16 and React 19
- **Dark Mode First** - Professional ultra-dark theme with code-inspired accents
- **Fully Responsive** - Perfect on desktop, tablet, and mobile devices
- **Smooth Animations** - Delightful micro-interactions throughout the app
- **Keyboard Shortcuts** - Power user features for maximum productivity
- **Smart Loading States** - Never lose context with intelligent state management

---

## Tech Stack

<table>
<tr>
<td valign="top" width="50%">

### Frontend
- **Framework:** Next.js 16 (React 19, App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS 4
- **Design:** Custom CSS tokens, Glass morphism
- **Fonts:** Geist Sans & Geist Mono
- **State:** React Hooks & Context

</td>
<td valign="top" width="50%">

### Backend
- **Runtime:** Node.js + Express
- **Language:** TypeScript
- **ORM:** Prisma
- **Database:** PostgreSQL 16
- **Auth:** JWT + bcrypt
- **Storage:** AWS S3
- **API:** RESTful architecture

</td>
</tr>
</table>

### Infrastructure

- **Container:** Docker + Docker Compose
- **IaC:** Terraform (AWS ready)
- **CI/CD:** GitHub Actions
- **Deployment:** AWS ECS/Fargate, RDS, S3, ALB

---

## Project Structure

```
TaskFlow/
│
├── backend/              # Express API Server
│   ├── src/
│   │   ├── routes/       # API endpoints (auth, tasks, projects, workspaces)
│   │   ├── middleware/   # Auth middleware, error handling
│   │   ├── controllers/  # Business logic
│   │   ├── config/       # Prisma, S3, environment config
│   │   └── utils/        # JWT helpers, validators
│   ├── prisma/           # Database schema & migrations
│   └── package.json
│
├── frontend/             # Next.js Application
│   ├── app/              # App router pages
│   │   ├── page.tsx      # Landing page
│   │   ├── login/        # Authentication
│   │   ├── signup/       # Registration
│   │   └── dashboard/    # Main application
│   ├── components/       # Reusable UI components
│   │   ├── ProjectCard.tsx
│   │   ├── AnalyticsCard.tsx
│   │   ├── TeamInsights.tsx
│   │   └── QuickActions.tsx
│   ├── lib/              # API client, hooks, utilities
│   └── globals.css       # Design tokens & styling
│
├── infra/                # Infrastructure as Code
│   └── terraform/        # AWS deployment config
│
└── README.md
```

---

## Quick Start

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 18.x or higher ([Download](https://nodejs.org/))
- **PostgreSQL** 16.x ([Download](https://www.postgresql.org/download/))
- **npm** or **yarn**
- **AWS Account** (for S3 file storage)

### 1. Clone the Repository

```bash
git clone https://github.com/ticsture/cloud-saas-app.git
cd cloud-saas-app
```

### 2. Backend Setup

```bash
cd backend
npm install
```

**Configure Environment Variables:**

Create a `.env` file in the `backend` directory:

```env
# Database
DATABASE_URL="postgresql://app_user:supersecretpassword@localhost:5432/cloud_saas_db?schema=public"

# JWT Secret (generate a secure random string)
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"

# AWS S3 Configuration
AWS_REGION="us-east-1"
AWS_ACCESS_KEY_ID="your-aws-access-key"
AWS_SECRET_ACCESS_KEY="your-aws-secret-key"
S3_BUCKET_NAME="taskflow-attachments"

# Server
PORT=4000
```

**Start PostgreSQL with Docker:**

```bash
docker compose -f docker-compose.db.yml up -d
```

**Run Database Migrations:**

```bash
npx prisma migrate dev
npx prisma generate
```

**Start the Backend Server:**

```bash
npm run dev
```

Backend will run on `http://localhost:4000`

### 3. Frontend Setup

Open a new terminal:

```bash
cd frontend
npm install
```

**Configure Environment Variables:**

Create a `.env.local` file in the `frontend` directory:

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

**Start the Frontend Server:**

```bash
npm run dev
```

Frontend will run on `http://localhost:3000`

### 4. Access the Application

1. Open your browser and navigate to `http://localhost:3000`
2. Click **Sign up** to create a new account
3. After registration, you'll be redirected to login
4. Login and start creating projects and tasks!

---

## Design System

TaskFlow features a professional design system inspired by Linear:

- **Ultra-dark Theme** - Deep blacks with subtle gradients
- **Code-inspired Accents** - Blue, green, yellow, purple highlights
- **Glass Morphism** - Frosted glass effects and shadows
- **Typography** - Geist Sans for UI, Geist Mono for code
- **Animations** - Smooth transitions and micro-interactions
- **Consistent Spacing** - 8px grid system

---

## Screenshots

<div align="center">

### Landing Page
*Beautiful hero section with gradient animations*

### Authentication
*Clean login/signup flows with form validation*

### Dashboard
*Comprehensive project overview with analytics*

### Task Management
*Kanban boards and list views with drag-and-drop*

### Analytics
*Real-time metrics and team insights*

</div>

---

## Roadmap

### Phase 1: Foundation (Completed)
- [x] Authentication system (JWT)
- [x] Project & task CRUD operations
- [x] File attachments with S3
- [x] Real-time analytics dashboard
- [x] Team insights and recommendations
- [x] Linear-inspired dark UI

### Phase 2: Collaboration (Q1 2026)
- [ ] Real-time updates with WebSockets
- [ ] Team member invitations
- [ ] Comments and mentions
- [ ] Activity feed and notifications
- [ ] Role-based permissions

### Phase 3: Advanced Features (Q2 2026)
- [ ] Calendar and timeline views
- [ ] Gantt charts
- [ ] Time tracking
- [ ] Custom fields and properties
- [ ] Advanced search and filters

### Phase 4: Integrations (Q3 2026)
- [ ] Slack integration
- [ ] GitHub/GitLab sync
- [ ] Email notifications
- [ ] Webhooks and API
- [ ] Third-party apps marketplace

### Phase 5: Mobile (Q4 2026)
- [ ] React Native mobile app
- [ ] Offline mode
- [ ] Push notifications
- [ ] Mobile-optimized UI

---

## Contributing

We welcome contributions! Please follow these steps:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/AmazingFeature`)
3. **Commit** your changes (`git commit -m 'Add some AmazingFeature'`)
4. **Push** to the branch (`git push origin feature/AmazingFeature`)
5. **Open** a Pull Request

Please ensure your code follows our coding standards and includes appropriate tests.

---

## License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## Author

**Ticsture**
- GitHub: [@ticsture](https://github.com/ticsture)
- Repository: [cloud-saas-app](https://github.com/ticsture/cloud-saas-app)

---

## Acknowledgments

- Design inspiration from [Linear](https://linear.app)
- UI components inspired by [Vercel](https://vercel.com) and [Notion](https://notion.so)
- Built with modern web technologies

---

<div align="center">

### Star this repository if you find it helpful!

**Built with passion by developers, for developers**

[Report Bug](https://github.com/ticsture/cloud-saas-app/issues) • [Request Feature](https://github.com/ticsture/cloud-saas-app/issues) • [Documentation](https://github.com/ticsture/cloud-saas-app/wiki)

</div>
