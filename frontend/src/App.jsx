// App.js
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from '../pages/Home';
import CreatePoll from '../pages/CreatePollPage';
import Register from '../pages/Register';
import Login from '../pages/Login';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="pt-16 md:pt-20 pb-20 md:pb-8 px-4">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/create-poll" element={<CreatePoll />} />
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
