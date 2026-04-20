# E-Commerce Platform

A full-stack e-commerce platform built with Spring Boot, Next.js, and React.

## 🏗️ Architecture

This is a monorepo containing three main applications:

```
├── server/     # Spring Boot REST API backend
├── client/     # Next.js customer-facing storefront
└── admin/      # React admin dashboard
```

## 🚀 Tech Stack

### Backend (Server)
- **Framework:** Spring Boot 3.3.6
- **Language:** Java 21
- **Database:** MySQL / PostgreSQL
- **Cache:** Redis
- **Security:** Spring Security + OAuth2
- **API Documentation:** Swagger/OpenAPI
- **Real-time:** WebSocket (STOMP)
- **File Storage:** Cloudinary
- **Email:** Spring Mail + Thymeleaf

### Frontend (Client)
- **Framework:** Next.js 16.1.2
- **Language:** TypeScript 5.2.2
- **UI Library:** React 19.2.3
- **State Management:** Redux Toolkit
- **Styling:** Tailwind CSS
- **Authentication:** NextAuth.js
- **HTTP Client:** Axios
- **Testing:** Jest + Playwright

### Admin Dashboard
- **Framework:** Vite + React 19
- **Language:** TypeScript 5.7.2
- **Routing:** React Router 7
- **Styling:** Tailwind CSS 4
- **Charts:** ApexCharts
- **Testing:** Jest

## 📋 Prerequisites

- **Java:** JDK 21 or higher
- **Node.js:** 18.x or higher
- **Maven:** 3.8+ (or use included wrapper)
- **MySQL/PostgreSQL:** Latest stable version
- **Redis:** Latest stable version

## 🛠️ Installation

### 1. Clone the repository

```bash
git clone <repository-url>
cd ecommerce
```

### 2. Backend Setup

```bash
cd server

# Configure database connection
# Edit src/main/resources/application.properties or application.yml

# Install dependencies and build
./mvnw clean install

# Run the application
./mvnw spring-boot:run
```

The backend will start at `http://localhost:8080`

### 3. Client Setup

```bash
cd client

# Install dependencies
npm install

# Configure environment variables
# Create .env.local file with required variables

# Run development server
npm run dev
```

The client will start at `http://localhost:3000`

### 4. Admin Dashboard Setup

```bash
cd admin

# Install dependencies
npm install

# Configure environment variables
# Create .env file with required variables

# Run development server
npm run dev
```

The admin dashboard will start at `http://localhost:5173`

## 🔧 Configuration

### Backend Environment Variables

Create `server/src/main/resources/application.properties`:

```properties
# Database
spring.datasource.url=jdbc:mysql://localhost:3306/ecommerce
spring.datasource.username=your_username
spring.datasource.password=your_password

# Redis
spring.data.redis.host=localhost
spring.data.redis.port=6379

# Cloudinary
cloudinary.cloud-name=your_cloud_name
cloudinary.api-key=your_api_key
cloudinary.api-secret=your_api_secret

# Email
spring.mail.host=smtp.gmail.com
spring.mail.port=587
spring.mail.username=your_email
spring.mail.password=your_password
```

### Client Environment Variables

Create `client/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8080/api
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_secret_key
```

### Admin Environment Variables

Create `admin/.env`:

```env
VITE_API_URL=http://localhost:8080/api
```

## 📦 Build for Production

### Backend

```bash
cd server
./mvnw clean package
java -jar target/ecommerce-0.0.1-SNAPSHOT.jar
```

### Client

```bash
cd client
npm run build
npm start
```

### Admin

```bash
cd admin
npm run build
npm run preview
```

## 🧪 Testing

### Backend Tests

```bash
cd server
./mvnw test
```

### Client Tests

```bash
cd client
npm test                 # Unit tests
npm run test:e2e        # E2E tests with Playwright
```

### Admin Tests

```bash
cd admin
npm test
```

## 📚 API Documentation

Once the backend is running, access the API documentation at:

- Swagger UI: `http://localhost:8080/swagger-ui.html`
- OpenAPI JSON: `http://localhost:8080/v3/api-docs`

## 🔐 Security Features

- JWT-based authentication
- OAuth2 social login
- Role-based access control (RBAC)
- Rate limiting with Bucket4j
- Content filtering
- CORS configuration
- Password encryption

## 🌟 Key Features

- User authentication and authorization
- Product catalog management
- Shopping cart functionality
- Order processing
- Payment integration
- Real-time notifications (WebSocket)
- Admin dashboard with analytics
- Image upload and management
- Email notifications
- Search and filtering

## 📁 Project Structure

### Backend Structure

```
server/
├── src/main/java/com/spring/ecommerce/
│   ├── config/          # Configuration classes
│   ├── controller/      # REST controllers
│   ├── service/         # Business logic
│   ├── repository/      # Data access layer
│   ├── model/           # Entity classes
│   ├── dto/             # Data transfer objects
│   ├── security/        # Security configuration
│   └── util/            # Utility classes
└── src/main/resources/
    ├── application.properties
    └── templates/       # Email templates
```

### Client Structure

```
client/
├── src/
│   ├── app/            # Next.js app directory
│   ├── components/     # React components
│   ├── lib/            # Utilities and helpers
│   ├── store/          # Redux store
│   └── types/          # TypeScript types
└── public/             # Static assets
```

### Admin Structure

```
admin/
├── src/
│   ├── components/     # React components
│   ├── pages/          # Page components
│   ├── services/       # API services
│   ├── utils/          # Utility functions
│   └── types/          # TypeScript types
└── public/             # Static assets
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License.

## 👥 Authors

Your Team Name

## 🐛 Known Issues

- Check the [Issues](../../issues) page for known bugs and feature requests

## 📞 Support

For support, email support@example.com or join our Slack channel.
