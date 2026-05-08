import { useEffect, useState } from 'react';
import { Pencil, Trash2, UserPlus, AlertCircle } from 'lucide-react';
import api from '../services/api';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

interface User {
  id: string;
  email: string;
  role: 'ADMIN' | 'COMMERCIAL';
  createdAt: string;
}

export default function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState<'ADMIN' | 'COMMERCIAL'>('COMMERCIAL');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/users');
      setUsers(res.data);
      setError(null);
    } catch {
      setError('Impossible de charger les utilisateurs.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/users', { email: newUserEmail, password: newUserPassword, role: newUserRole });
      setNewUserEmail('');
      setNewUserPassword('');
      setShowCreateForm(false);
      fetchUsers();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Erreur lors de la création.');
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cet utilisateur ?")) {
      try {
        await api.delete(`/users/${id}`);
        fetchUsers();
      } catch (err: any) {
        alert(err.response?.data?.error || 'Erreur lors de la suppression.');
      }
    }
  };

  const handleChangePassword = async (id: string) => {
    const newPassword = window.prompt("Nouveau mot de passe :");
    if (!newPassword) return;

    try {
      await api.put(`/users/${id}/password`, { oldPassword: '', newPassword });
      alert('Mot de passe mis à jour.');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Erreur lors du changement de mot de passe.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Utilisateurs</h1>
          <p className="text-sm text-slate-500 mt-1">Gestion des utilisateurs de l'application</p>
        </div>
        <Button variant="primary" onClick={() => setShowCreateForm(!showCreateForm)}>
          <UserPlus size={15} /> Nouvel utilisateur
        </Button>
      </div>

      {error && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-red-900/40 border border-red-500/30 text-red-300 text-sm">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {showCreateForm && (
        <Card className="p-5">
          <h3 className="text-sm font-semibold text-slate-200 mb-4">Créer un utilisateur</h3>
          <form onSubmit={handleCreateUser} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5">Email</label>
              <input
                type="email"
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
                className="w-full h-9 px-3 rounded-lg bg-[#07090f] border border-[#1e2a3a] text-slate-200 text-sm focus:outline-none focus:border-green-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5">Mot de passe</label>
              <input
                type="password"
                value={newUserPassword}
                onChange={(e) => setNewUserPassword(e.target.value)}
                className="w-full h-9 px-3 rounded-lg bg-[#07090f] border border-[#1e2a3a] text-slate-200 text-sm focus:outline-none focus:border-green-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5">Rôle</label>
              <select
                value={newUserRole}
                onChange={(e) => setNewUserRole(e.target.value as 'ADMIN' | 'COMMERCIAL')}
                className="w-full h-9 px-3 rounded-lg bg-[#07090f] border border-[#1e2a3a] text-slate-200 text-sm focus:outline-none focus:border-green-500"
              >
                <option value="COMMERCIAL">Commercial</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
            <div className="flex gap-2">
              <Button type="submit" variant="primary">Créer</Button>
              <Button type="button" variant="ghost" onClick={() => setShowCreateForm(false)}>Annuler</Button>
            </div>
          </form>
        </Card>
      )}

      <Card className="overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#0d1117] border-b border-[#1e2a3a]">
              <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Email</th>
              <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Rôle</th>
              <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Créé le</th>
              <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-500">Chargement...</td></tr>
            ) : users.length > 0 ? (
              users.map((user) => (
                <tr key={user.id} className="border-b border-[#1e2a3a]/60 hover:bg-[#161b25] transition-colors">
                  <td className="px-4 py-3 text-sm text-slate-300">{user.email}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className={
                      user.role === 'ADMIN'
                        ? "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-900/40 text-blue-400 border border-blue-500/30"
                        : "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-900/40 text-slate-400 border border-slate-500/30"
                    }>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-300">
                    {new Date(user.createdAt).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleChangePassword(user.id)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-blue-400 hover:bg-blue-900/20 transition-colors"
                        title="Changer le mot de passe"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-900/20 transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                  Aucun utilisateur trouvé.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
