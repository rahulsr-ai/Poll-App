# 1. Clone repository
git clone https://github.com/your-username/pollmaster.git
cd Poll-App

# 2. Backend setup
cd backend
npm install

# Create .env file in backend folder:
DATABASE_URL="postgresql://username:password@localhost:5432/pollmaster_db" 
PORT=5000


# 3. Database setup (IMPORTANT!)
# Create a fresh PostgreSQL database through pgAdmin with name 'pollmaster_db'
# Then use these commands:
npx prisma generate
npx prisma db push          # Push schema to database


# 4. Frontend setup
cd ../frontend
npm install

# 5. Start both servers
# Terminal 1 - Backend
cd backend
npm install 
nodemon src/server.js

# Terminal 2 - Frontend (Vite)
cd frontend  
npm run dev


# 6 Open normal browser window
http://localhost:5173
# Register as "User A" 

# 7. Open incognito/private window  
http://localhost:5173
# Register as "User B"

# 8. Now you can:
# - Create poll in one window
# - Vote from both users  
# - See real-time updates instantly!