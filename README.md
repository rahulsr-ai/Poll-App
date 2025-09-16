# 1. Clone repository
git clone https://github.com/your-username/pollmaster.git
cd pollmaster

# 2. Backend setup
cd backend
npm install

# Create .env file in backend folder:
DATABASE_URL="postgresql://username:password@localhost:5432/pollmaster_db"
PORT=5000

# 3. Database setup (IMPORTANT!)
npx prisma generate
npx prisma db push          # Push schema to database
# OR
npx prisma migrate dev --name init

# 4. Frontend setup
cd ../frontend
npm install

# 5. Start both servers
# Terminal 1 - Backend
cd backend
nodemon src/server.js

# Terminal 2 - Frontend (Vite)
cd frontend  
npm run dev
