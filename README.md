# T-Shirt Design Builder

A full-stack web application where users can design custom T-shirts using a 3D preview and canvas-based design tools.

## Features

- 🎨 **Realistic 3D T-Shirt Designer** - Professional 3D preview with realistic materials, lighting, and smooth animations
- ✏️ **Advanced Canvas Design Tools** - Add text (8 fonts), images, shapes (rectangle, circle, triangle, star) with stroke effects
- 🎨 **Enhanced Color Customization** - 8 preset colors + custom color picker for T-shirts
- 👕 **Design on T-shirt** - Your canvas design is applied directly as texture on the 3D model
- 📐 **Print Safe Guidelines** - Blue dashed lines show the optimal print area
- 🔄 **Multiple View Modes** - Split view, design-only, or 3D preview-only modes
- 🎯 **Layer Controls** - Bring to front/send to back for perfect element arrangement
- 👤 **User Authentication** - Register/Login system with JWT
- 💾 **Save Designs** - Save and manage your custom designs with thumbnails
- 🛒 **Shopping Cart** - Add designs to cart with size selection
- 📦 **Order Management** - View order history and details

## Tech Stack

### Frontend
- React 19 with React Router 7
- TypeScript
- Tailwind CSS
- Three.js & React Three Fiber (3D rendering)
- Fabric.js (Canvas design tools)
- Zustand (State management)
- Axios (HTTP client)

### Backend
- Node.js with Express
- TypeScript
- Prisma ORM
- SQLite Database
- JWT Authentication
- Bcrypt (Password hashing)
- Multer (File uploads)

## Project Structure

```
tshirtecom/
├── backend/
│   ├── src/
│   │   ├── controllers/      # Business logic
│   │   ├── routes/           # API routes
│   │   ├── middleware/       # Auth middleware
│   │   ├── utils/            # Utilities (Prisma client)
│   │   └── index.ts          # Main server file
│   ├── prisma/
│   │   └── schema.prisma     # Database schema
│   ├── uploads/              # Local image storage
│   └── package.json
└── frontend/
    ├── app/
    │   ├── components/       # React components
    │   ├── lib/              # API client & state management
    │   ├── routes/           # Pages
    │   └── root.tsx          # Root layout
    └── package.json
```

## Setup Instructions

### Prerequisites
- Node.js 18+ installed
- npm or yarn package manager

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. The dependencies are already installed, but if needed:
```bash
npm install
```

3. Create a `.env` file in the backend directory:
```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="your-secret-key-change-this-in-production"
PORT=3001
NODE_ENV=development
```

4. Generate Prisma client and run migrations (already done, but for reference):
```bash
npx prisma generate
npx prisma migrate dev
```

5. Start the backend server:
```bash
npm run dev
```

The backend will run on `http://localhost:3001`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. The dependencies are already installed, but if needed:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The frontend will run on `http://localhost:5173`

## Usage

1. **Register/Login**: Create an account or login to access the designer
2. **Design T-Shirt**: 
   - Choose a T-shirt color
   - Add text, images, and shapes to front/back
   - See real-time 3D preview
3. **Save Design**: Save your design to access it later
4. **Add to Cart**: Add your design to the shopping cart
5. **Place Order**: Complete your order (free in MVP version)
6. **View Orders**: Check your order history

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get user profile (protected)

### Designs
- `POST /api/designs` - Create new design (protected)
- `GET /api/designs` - Get all user designs (protected)
- `GET /api/designs/:id` - Get single design (protected)
- `PUT /api/designs/:id` - Update design (protected)
- `DELETE /api/designs/:id` - Delete design (protected)

### Orders
- `POST /api/orders` - Create new order (protected)
- `GET /api/orders` - Get all user orders (protected)
- `GET /api/orders/:id` - Get single order (protected)

### Upload
- `POST /api/upload/image` - Upload image file (protected)

## MVP Limitations

- No payment integration (orders are free)
- Local file storage (no S3 integration)
- Basic 3D T-shirt model (simple geometry)
- No email verification
- No password reset functionality

## Future Enhancements

- Payment gateway integration (Stripe/PayPal)
- AWS S3 for image storage
- Advanced 3D T-shirt models with realistic textures
- More design templates and clipart
- Admin panel for order management
- Email notifications
- Social sharing features
- Bulk ordering and pricing tiers

## Development Commands

### Backend
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm start            # Start production server
npm run prisma:generate  # Generate Prisma client
npm run prisma:migrate   # Run database migrations
```

### Frontend
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm start            # Start production server
npm run typecheck    # Run TypeScript type checking
```

## License

MIT License

## Support

For issues and questions, please create an issue in the repository.

