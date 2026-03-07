import './App.css'
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Blog from './blog';
import Home from './home.jsx'
import Create from './create.jsx'
import About from './about.jsx'
import Login from './login.jsx'
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
