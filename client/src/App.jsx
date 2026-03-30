import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { createContext, useContext, useState } from 'react'
import Navbar from './components/NavBar'
import Footer from './components/Footer'
import AdminPage from './pages/AdminPage'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import AccountPage from './pages/AccountPage'
import BrowsePage from './pages/BrowsePage'
import BidPage from './pages/BidPage'
import SellPage from './pages/SellPage'

function AdminRoute({ children }) {
  const { isAdmin } = useAuth()
  return isAdmin ? children : <Navigate to="/" />
}

function App(){
  
  return (
    <BrowserRouter>
      <Navbar/>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/admin" element={<AdminRoute><AdminPage /></AdminRoute>} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/account" element={<AccountPage />} />
          <Route path="/browse" element={<BrowsePage />} />
          <Route path="/items/:id" element={<BidPage />} />
          <Route path="/sell" element={<SellPage />} />
        </Routes>
      <Footer/>
    </BrowserRouter>
  )

}

export default App