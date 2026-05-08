// @ts-nocheck
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import NewQuote from './pages/NewQuote';
import QuoteDetail from './pages/QuoteDetail';

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
        <Route path="/quote/new" element={<PrivateRoute><NewQuote /></PrivateRoute>} />
        <Route path="/quote/:id" element={<PrivateRoute><QuoteDetail /></PrivateRoute>} />
      </Routes>
    </Router>
  );
}

export default App;

