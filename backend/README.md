# Backend API

## Quick Start

1. Install dependencies (already done):
```bash
npm install
```

2. Create `.env` file:
```bash
cp .env.example .env
```

Or manually create `.env` with:
```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="tshirt-ecom-secret-key-2025"
PORT=3001
NODE_ENV=development
```

3. Run migrations (already done, but for reference):
```bash
npx prisma migrate dev
```

4. Start the server:
```bash
npm run dev
```

The API will be available at `http://localhost:3001`

## Database Management

### View Database
```bash
npx prisma studio
```

### Reset Database
```bash
npx prisma migrate reset
```

### Generate Prisma Client
```bash
npx prisma generate
```

## API Documentation

See the main README.md in the project root for complete API documentation.

