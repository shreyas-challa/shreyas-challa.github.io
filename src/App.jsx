import './App.css'
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import Blog from './blog';
import Home from './home.jsx'
import Create from './create.jsx'
import About from './about.jsx'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/blog/:id" element={<Blog />} />
        <Route path="/create" element={<Create />} />
      </Routes>
    </Router>
  )
}

export default App