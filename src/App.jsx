import { useState } from 'react'
import './App.css'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Blog from './blog';
import Home from './home.jsx'
import Create from './create.jsx'

function App() {

  return (
    <>
    <Router>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/create" element={<Create />} />
            {/* Add more routes as needed */}
          </Routes>
        </Router>
    </>
  )
}

export default App