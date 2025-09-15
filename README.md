# Multi-Tenant Authentication and Authorization API

This project is a **Node.js-based REST API** designed for a multi-tenant system with role-based access control (RBAC). It leverages **Express.js** for routing, **Prisma** for database interactions with PostgreSQL, and **JWT** for secure authentication. The system supports a single **Super Admin** with full permissions and allows for the creation of roles and permissions for other users, making it suitable for multi-tenant applications.

## Table of Contents

- [Features](#features)
- [Technologies Used](#technologies-used)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Project Structure](#project-structure)
- [API Endpoints](#api-endpoints)
  - [Authentication Routes](#authentication-routes)
  - [Role Management Routes](#role-management-routes)
  - [Permission Management Routes](#permission-management-routes)
- [Database Schema](#database-schema)
- [Seeding the Database](#seeding-the-database)
- [Middleware](#middleware)
  - [Authentication Middleware](#authentication-middleware)
  - [Authorization Middleware](#authorization-middleware)
  - [Error Handling Middleware](#error-handling-middleware)
- [Running the Application](#running-the-application)
- [Graceful Shutdown](#graceful-shutdown)
- [Contributing](#contributing)
- [License](#license)

## Features

- **Multi-Tenant Support**: Designed to handle multiple tenants with a single Super Admin overseeing the system.
- **Role-Based Access Control (RBAC)**: Assign roles and permissions to users for fine-grained access control.
- **JWT Authentication**: Secure user authentication using JSON Web Tokens stored in cookies.
- **Prisma ORM**: Simplified database operations with PostgreSQL.
- **Database Seeding**: Automatically creates a Super Admin role, permissions, and user on startup.
- **CORS Support**: Configured to allow requests from a specified frontend URL.
- **Error Handling**: Custom middleware for consistent error responses.
- **Request Logging**: Uses Morgan for logging HTTP requests.
- **Graceful Shutdown**: Ensures proper disconnection of Prisma and server closure on termination.

## Technologies Used

- **Node.js**: JavaScript runtime for server-side development.
- **Express.js**: Web framework for building RESTful APIs.
- **Prisma**: ORM for PostgreSQL database interactions.
- **PostgreSQL**: Relational database for storing user, role, and permission data.
- **JWT (jsonwebtoken)**: For secure authentication.
- **Bcrypt**: For password hashing.
- **Morgan**: For HTTP request logging.
- **CORS**: For enabling cross-origin requests.
- **Body-Parser**: For parsing JSON and URL-encoded request bodies.
- **Cookie-Parser**: For handling cookies in requests.
- **Dotenv**: For managing environment variables.

## Prerequisites

- **Node.js**: Version 14 or higher.
- **PostgreSQL**: A running PostgreSQL instance (local or cloud-hosted).
- **NPM**: For installing dependencies.
- A `.env` file with the required environment variables (see [Environment Variables](#environment-variables)).

## Installation

1. **Clone the Repository**:

   ```bash
   git clone <repository-url>
   cd <repository-folder>
   ```

2. **Install Dependencies**:

   ```bash
   npm install
   ```

3. **Set Up PostgreSQL**:

   - Ensure a PostgreSQL database is running.
   - Update the `DATABASE_URL` in the `.env` file to point to your database.

4. **Run Prisma Migrations**:

   ```bash
   npx prisma migrate dev --name init
   ```

   This creates the necessary tables based on the Prisma schema.

5. **Start the Server**:
   ```bash
   npm start
   ```
   The server will start on the port specified in the `.env` file (default: 8008).

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
NODE_ENV="development
DATABASE_URL="postgresql://<user>:<password>@<host>:<port>/<database>?schema=public"
JWT_SECRET=<your_jwt_secret>
FRONTEND_URL=<your_frontend_url>
```

- `NODE_ENV`: development || production.
- `DATABASE_URL`: Connection string for your PostgreSQL database.
- `JWT_SECRET`: Secret key for signing JWTs.
- `FRONTEND_URL`: The URL of the frontend application for CORS configuration.

## Project Structure

```plaintext
├── middlewares/
│   ├── authenticationMiddleware.js  # JWT-based authentication
│   ├── authorizationMiddleware.js   # Permission-based authorization
│   ├── errorMiddleware.js            # Custom error handling
├── routes/
│   ├── authRoutes.js                 # Authentication and role/permission routes
├── utils/
│   ├── seedDatabase.js               # Database seeding logic
├── controllers/
│   ├── authController.js             # Route handlers for auth, roles, permissions
├── prisma/
│   ├── schema.prisma                 # Prisma schema for database models
├── .env                              # Environment variables
├── index.js                          # Main application entry point
├── package.json                      # Project metadata and dependencies
└── README.md                         # Project documentation
```

## API Endpoints

### Authentication Routes

| Method | Endpoint                    | Description                          | Middleware                  |
| ------ | --------------------------- | ------------------------------------ | --------------------------- |
| POST   | `/api/auth/register/admin`  | Register a new admin user            | `protect`, `authorize("*")` |
| POST   | `/api/auth/register/user`   | Register a new regular user          | `protect`, `authorize("*")` |
| POST   | `/api/auth/login`           | User login with JWT token generation | None                        |
| POST   | `/api/auth/change-password` | Change user password                 | `protect`                   |
| GET    | `/api/auth/login-status`    | Check if user is logged in           | None                        |
| POST   | `/api/auth/logout`          | Log out user (clear JWT cookie)      | None                        |
| GET    | `/api/auth/user-details`    | Get details of the logged-in user    | `protect`                   |

### Role Management Routes

| Method | Endpoint              | Description             | Middleware                             |
| ------ | --------------------- | ----------------------- | -------------------------------------- |
| POST   | `/api/auth/roles`     | Create a new role       | `protect`, `authorize("MANAGE_ROLES")` |
| PUT    | `/api/auth/roles/:id` | Update an existing role | `protect`, `authorize("MANAGE_ROLES")` |
| DELETE | `/api/auth/roles/:id` | Delete a role           | `protect`, `authorize("MANAGE_ROLES")` |

### Permission Management Routes

| Method | Endpoint                    | Description                   | Middleware                                   |
| ------ | --------------------------- | ----------------------------- | -------------------------------------------- |
| POST   | `/api/auth/permissions`     | Create a new permission       | `protect`, `authorize("MANAGE_PERMISSIONS")` |
| PUT    | `/api/auth/permissions/:id` | Update an existing permission | `protect`, `authorize("MANAGE_PERMISSIONS")` |
| DELETE | `/api/auth/permissions/:id` | Delete a permission           | `protect`, `authorize("MANAGE_PERMISSIONS")` |

## Database Schema

The Prisma schema (`prisma/schema.prisma`) defines three main models:

### User Model

- `id`: Auto-incremented unique identifier.
- `name`: User's name.
- `email`: Unique email address.
- `phoneno`: Unique phone number.
- `password`: Hashed password (using bcrypt).
- `role`: Relation to a single Role (one-to-many).
- `createdAt` / `updatedAt`: Timestamps for record creation and updates.

### Role Model

- `id`: Auto-incremented unique identifier.
- `name`: Unique role name (e.g., "SUPER_ADMIN").
- `permissions`: Many-to-many relation with Permissions.
- `users`: One-to-many relation with Users.
- `createdAt` / `updatedAt`: Timestamps.

### Permission Model

- `id`: Auto-incremented unique identifier.
- `name`: Unique permission name (e.g., "\*").
- `description`: Optional description of the permission.
- `roles`: Many-to-many relation with Roles.
- `createdAt` / `updatedAt`: Timestamps.

## Seeding the Database

The `seedDatabase.js` utility ensures the following on server startup:

1. Creates a `SUPER_ADMIN` role if it doesn't exist.
2. Creates a `*` permission (granting all access) if it doesn't exist.
3. Links the `*` permission to the `SUPER_ADMIN` role.
4. Creates a default `SYS ADMIN` user with the email `admin@sys.com`, a hashed password, and the `SUPER_ADMIN` role.

To customize the seed data, modify the `seedDatabase.js` file.

## Middleware

### Authentication Middleware (`protect`)

- Verifies the JWT token stored in the `token` cookie.
- Fetches the user from the database (excluding the password) and attaches it to `req.user`.
- Throws a 401 error if the token is missing, invalid, or the user is not found.

### Authorization Middleware (`authorize`)

- Checks if the logged-in user has the required permissions.
- Allows users with the `*` permission to bypass all checks.
- Throws a 403 error if the user lacks the necessary permissions.

### Error Handling Middleware (`errorMiddleware`)

- Catches errors thrown by route handlers or other middleware.
- Returns standardized JSON error responses.

## Running the Application

1. Ensure PostgreSQL is running and the `DATABASE_URL` is correctly configured.
2. Install dependencies and run migrations as described in [Installation](#installation).
3. Start the server:
   ```bash
   npm start
   ```
4. The server will:
   - Connect to PostgreSQL via Prisma.
   - Seed the database with the Super Admin role and user.
   - Listen on the specified port (default: 8008).

## Graceful Shutdown

The application handles graceful shutdown by:

- Listening for the `SIGINT` signal (e.g., Ctrl+C).
- Disconnecting the Prisma client to close the database connection pool.
- Closing the Express server to ensure no new requests are accepted.

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository.
2. Create a new branch (`git checkout -b feature/your-feature`).
3. Make your changes and commit (`git commit -m "Add your feature"`).
4. Push to the branch (`git push origin feature/your-feature`).
5. Open a pull request.

## License

This project is licensed under the MIT License.
