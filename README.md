# Network Do Gia Dung - Backend API

Welcome to the Backend API repository for the **Network Do Gia Dung** project. This is a robust API built with **NestJS**, utilizing **Prisma ORM** for PostgreSQL database interactions and **MinIO** for object storage.

🌐 **[Xem bản tiếng Việt tại đây](./README.vi.md)**

---

## 🛠 Tech Stack

- **Framework**: [NestJS](https://nestjs.com/) (Node.js) - Modular architecture for scalability and maintainability.
- **Database**: [PostgreSQL](https://www.postgresql.org/) - Powerful relational database.
- **ORM**: [Prisma](https://www.prisma.io/) - Modern, type-safe database toolkit.
- **Storage**: [MinIO](https://min.io/) - S3-compatible Object Storage for images and files.
- **Authentication**: JWT (JSON Web Token) with Passport strategy.
- **Documentation**: Swagger (OpenAPI).

---

## 📂 Project Structure

The project follows a modular pattern to ensure clean code and easy management:

```plaintext
src/
├── admin/              # Admin-specific logic
├── auth/               # Authentication and Authorization (Login, Guards, JWT)
├── categories/         # General category management
├── company-intro/      # Company information and mission
├── contact-info/       # Website contact details (Header/Footer info)
├── contacts/           # Inbound customer contact messages
├── mail/               # Email service (NodeMailer)
├── minio/              # MinIO storage communication service
├── news/               # News and blog management
├── price-quotes/       # Price request handling
├── prisma/             # Prisma Module & Service (Database connection)
├── product-categories/ # Product-specific categories (Brands, types)
├── products/           # Product CRUD and search
├── projects/           # Portfolio/Project management
├── quotes/             # Order and quotation management
├── recruitment/        # Job posting and recruitment management
├── reviews/            # Product and service reviews
├── services/           # Company offerings and services
├── statistics/         # Dashboard analytics and reporting
├── upload/             # File upload integration (MinIO)
├── users/              # User management
└── main.ts             # Application entry point
```

---

## 🚀 Getting Started

### 1. Prerequisites

Ensure you have the following installed:

- [Node.js](https://nodejs.org/) (v18 or v20 LTS recommended)
- [Yarn](https://yarnpkg.com/) (Package manager)
- [Docker](https://www.docker.com/) (Optional, for local PostgreSQL/MinIO)

### 2. Installation

```bash
# Clone the repository
git clone <repository-url>
cd network-dogiadung-be

# Install dependencies
yarn install
```

### 3. Environment Configuration (.env)

Copy the example environment file:

```bash
cp .env.example .env
```

Open `.env` and update the following variables:

```env
# Database connection
DATABASE_URL="postgresql://user:password@localhost:5432/network_dogiadung?schema=public"

# JWT Security
JWT_SECRET="your-strong-secret-key"
JWT_EXPIRES_IN="1d"

# MinIO Configuration
MINIO_ENDPOINT="localhost"
MINIO_PORT=9000
MINIO_ACCESS_KEY="minioadmin"
MINIO_SECRET_KEY="minioadmin"
MINIO_BUCKET_NAME="dogiadung"
```

### 4. Database Initialization

Run these commands to sync your schema and seed the database:

```bash
# 1. Generate Prisma Client
yarn prisma:generate

# 2. Run Database Migrations
yarn prisma:migrate dev

# 3. Seed Initial Data
# Choose ONE of the following:

# Option A: Seed ALL mock data (Products, News, Users, etc.)
yarn prisma:seed

# Option B: Seed ESSENTIAL data only (Company contact info only)
yarn prisma:seed:essential
```

---

## 📜 Development Scripts

| Command | Description |
| :--- | :--- |
| `yarn dev` | Run server in development mode (Watch mode). |
| `yarn build` | Build project for production in `dist` folder. |
| `yarn start:prod` | Run production server from `dist`. |
| `yarn lint` | Run ESLint and fix issues. |
| `yarn prisma:studio` | Open a visual GUI for database management. |
| `yarn prisma:seed:all` | Explicitly seed all mock data. |

---

## 🛠 Advanced Database Management

### Resetting the Database

To clear everything and start fresh (WARNING: DELETES ALL DATA):

```bash
yarn prisma migrate reset --force
```

### Creating a New Migration

When you modify `prisma/schema.prisma`:

```bash
yarn prisma migrate dev --name <description>
```

---

## 📚 API Documentation (Swagger)

A built-in **Swagger UI** is available for testing:

- **Development**: [http://localhost:4000/docs](http://localhost:4000/docs)
- **Production**: Swagger is disabled by default for security purposes.

---

## 🐛 Troubleshooting

**1. "P1001: Can't reach database server"**

- Verify your database is running.
- Check your `DATABASE_URL` in `.env`.

**2. "Client has not been initialized yet"**

- Run `yarn prisma:generate`.

**3. Upload Failures**

- Ensure MinIO is active and the bucket name in `.env` exists.

---

**© 2024 Network Do Gia Dung Backend Team**
