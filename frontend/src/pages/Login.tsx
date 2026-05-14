import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { AlertCircle } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data } = await api.post('/auth/login', { email, password });
      localStorage.setItem('token', data.token);
      navigate('/');
    } catch (err) {
      setError('Email ou mot de passe invalide');
    }
  };

  return (
    <div className="min-h-screen bg-[#07090f] flex items-center justify-center p-6">
      {/* Halo décoratif fond */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-green-500/5 blur-3xl" />
      </div>

      {/* Card login */}
      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <img src="/peep-logo.png" alt="Peep" className="h-12 mx-auto mb-3" />
          <p className="text-sm text-slate-500">Outil de devis ETS Maria</p>
        </div>

        <Card className="p-8 shadow-2xl shadow-black/50">
          <h2 className="text-xl font-bold text-slate-100 mb-6">Connexion</h2>
          <form className="space-y-4" onSubmit={handleLogin}>
            {error && (
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-red-900/40 border border-red-500/30 text-red-300 text-sm">
                <AlertCircle size={16} />
                {error}
              </div>
            )}
            
            <Input
              label="Adresse email"
              type="email"
              placeholder="admin@peep.local"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            
            <Input
              label="Mot de passe"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            
            <Button 
              type="submit" 
              variant="primary"
              size="lg"
              className="w-full mt-2"
            >
              Se connecter
            </Button>
          </form>
        </Card>

        <p className="text-center text-xs text-slate-600 mt-6">
          ETS Maria © {new Date().getFullYear()} · Depuis 1937
        </p>
      </div>
    </div>
  );
};

export default Login;

