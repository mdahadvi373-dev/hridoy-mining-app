// src/App.tsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Games from './pages/Games';
import Surveys from './pages/Surveys';
import Withdraw from './pages/Withdraw';
import Admin from './pages/Admin';   // যদি চাও পরে ব্যবহার করতে পারবা

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route
            path="/"
            element={
              <>
                <Navbar />
                <Dashboard />
              </>
            }
          />
          <Route
            path="/dashboard"
            element={
              <>
                <Navbar />
                <Dashboard />
              </>
            }
          />
          <Route
            path="/games"
            element={
              <>
                <Navbar />
                <Games />
              </>
            }
          />
          <Route
            path="/surveys"
            element={
              <>
                <Navbar />
                <Surveys />
              </>
            }
          />
          <Route
            path="/withdraw"
            element={
              <>
                <Navbar />
                <Withdraw />
              </>
            }
          />
          <Route
            path="/admin"
            element={
              <>
                <Navbar />
                <Admin />
              </>
            }
          />
        </Route>

        <Route path="*" element={<h1 className="text-center mt-20">404 - Page Not Found</h1>} />
      </Routes>
    </Router>
  );
}

export default App;
