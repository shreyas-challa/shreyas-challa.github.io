import './App.css'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Blog from './blog';
import Box from './box.jsx'
import Home from './home.jsx'
import Create from './create.jsx'
import About from './about.jsx'
import Login from './login.jsx'
import Draft from './draft.jsx'
import { AuthProvider, useAuth } from './auth-context';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/blog/:id" element={<Blog />} />
          <Route path="/box/:slug" element={<Box />} />
          {/* Local-only writeup review (no-ops in production build) */}
          {!import.meta.env.PROD && <Route path="/draft/:slug" element={<Draft />} />}
          <Route path="/login" element={<Login />} />
          <Route path="/create" element={
            <ProtectedRoute>
              <Create />
            </ProtectedRoute>
          } />
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App
