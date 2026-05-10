import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import NewQuote from './pages/NewQuote';
import QuoteDetail from './pages/QuoteDetail';
import Quotes from './pages/Quotes';
import Catalog from './pages/Catalog';
import Users from './pages/Users';
import Settings from './pages/Settings';

import { AppLayout } from './components/layout/AppLayout';

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem('token');
  return token ? <AppLayout>{children}</AppLayout> : <Navigate to="/login" />;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/quotes" element={<PrivateRoute><Quotes /></PrivateRoute>} />
        <Route path="/catalog" element={<PrivateRoute><Catalog /></PrivateRoute>} />
        <Route path="/users" element={<PrivateRoute><Users /></PrivateRoute>} />
        <Route path="/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />
        <Route path="/quote/new" element={<PrivateRoute><NewQuote /></PrivateRoute>} />
        <Route path="/quote/:id" element={<PrivateRoute><QuoteDetail /></PrivateRoute>} />
      </Routes>
    </Router>
  );
}

export default App;

