# Quick Start Guide

Get your T-Shirt Design Builder up and running in 5 minutes!

## Step 1: Start Backend Server

Open a terminal and run:

```bash
cd backend

# Create .env file (required for first time setup)
cat > .env << EOF
DATABASE_URL="file:./dev.db"
JWT_SECRET="tshirt-ecom-secret-key-2025"
PORT=3001
NODE_ENV=development
EOF

# Start the server
npm run dev
```

You should see:
```
🚀 Server is running on http://localhost:3001
```

## Step 2: Start Frontend

Open a **new terminal** and run:

```bash
cd frontend
npm run dev
```

You should see the Vite dev server start. The app will be available at:
```
http://localhost:5173
```

## Step 3: Use the Application

1. Open your browser and go to `http://localhost:5173`
2. Click **"Get Started"** to create an account
3. Fill in your name, email, and password
4. You'll be redirected to the designer!

## Features to Try

### Design a T-Shirt
- Choose a T-shirt color from the palette
- Click "Add Text" to add custom text
- Click "Upload Image" to add your own images
- Switch between Front and Back views
- Use the 3D preview to see your design

### Save Your Design
- Name your design at the top
- Click "Save Design" to store it
- View all your designs from the "My Designs" page

### Place an Order
- Click "Add to Cart" in the designer
- Make sure to save your design first!
- Go to Cart page
- Click "Place Order (Free)" - no payment needed in MVP

## Troubleshooting

### Backend Issues

**Port 3001 already in use?**
```bash
# Change PORT in backend/.env to a different number
PORT=3002
```

**Database errors?**
```bash
cd backend
npx prisma migrate reset
npx prisma migrate dev
```

### Frontend Issues

**Port 5173 already in use?**
The dev server will automatically use the next available port.

**Module not found errors?**
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
```

**Can't connect to backend?**
Make sure the backend is running on port 3001 and check CORS settings.

## Tech Stack Reference

- **Frontend**: React 19, React Router 7, Tailwind CSS, Three.js, Fabric.js
- **Backend**: Node.js, Express, Prisma, SQLite
- **3D Rendering**: React Three Fiber
- **Canvas Design**: Fabric.js

## Development Tips

### Backend
- View database: `npx prisma studio` (opens GUI at http://localhost:5555)
- Reset database: `npx prisma migrate reset`
- View logs: Check the terminal where backend is running

### Frontend
- Hot reload is enabled - changes appear instantly
- React DevTools recommended for debugging
- Check browser console for errors

## Next Steps

- Customize the 3D T-shirt model in `TShirt3D.tsx`
- Add more design tools in `DesignCanvas.tsx`
- Implement payment gateway (Stripe/PayPal)
- Set up AWS S3 for image storage
- Add email notifications

## Need Help?

Check the main `README.md` for detailed documentation and API endpoints.

Happy designing! 🎨👕

