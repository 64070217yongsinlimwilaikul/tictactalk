// src/App.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css'
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { UserAuthContextProvider } from './context/UserAuthContext.jsx';
import App from './App.jsx';
import ProtectedRoute from './auth/protectedRoute.jsx';
import Tictactoe from './components/tictactoe.jsx';
import TictactoeTeam from './components/tictactoeTeam.jsx';
import Scoreboard from './components/Scoreboard.jsx';


const router = createBrowserRouter([
  {
    path: "/",
    element: <App />
  },
  {
    path: "/roomgame",
    element: <ProtectedRoute><Tictactoe /></ProtectedRoute>
  },
  {
    path: "/roomgameTeam",
    element: <ProtectedRoute><TictactoeTeam /></ProtectedRoute>
  },
  {
    path: "/scoreboard",
    element: <ProtectedRoute><Scoreboard /></ProtectedRoute>
  }
])
ReactDOM.createRoot(document.getElementById('root')).render(
    <UserAuthContextProvider>
      <RouterProvider router={router} />
    </UserAuthContextProvider>
)
