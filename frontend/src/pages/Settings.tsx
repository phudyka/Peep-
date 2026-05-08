import { useEffect, useState } from 'react';
import { Save, AlertCircle, Check } from 'lucide-react';
import api from '../services/api';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';

interface Settings {
  id: string;
  companyName: string;
  address: string;
  siret: string;
  currency: string;
  lang: string;
}

export default function Settings() {
  const [company, setCompany] = useState({ name: '', address: '', siret: '' });
  const [preferences, setPreferences] = useState({ currency: 'EUR', lang: 'fr' });
  const [passwords, setPasswords] = useState({ old: '', new: '', confirm: '' });
  const [isLoading, setIsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/settings');
      setCompany({ name: res.data.companyName, address: res.data.address, siret: res.data.siret });
      setPreferences({ currency: res.data.currency, lang: res.data.lang });
      setError(null);
    } catch {
      setError('Impossible de charger les paramètres.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      await api.put('/settings', {
        companyName: company.name,
        address: company.address,
        siret: company.siret,
        currency: preferences.currency,
        lang: preferences.lang
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch {
      setError('Erreur lors de la sauvegarde.');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwords.new !== passwords.confirm) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }
    try {
      const token = localStorage.getItem('token');
      // Decode token to get user id (simplified - in production use a proper JWT library)
      const payload = JSON.parse(atob(token!.split('.')[1]));
      await api.put(`/users/${payload.id}/password`, {
        oldPassword: passwords.old,
        newPassword: passwords.new
      });
      setPasswords({ old: '', new: '', confirm: '' });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erreur lors du changement de mot de passe.');
    }
  };

  if (isLoading) {
    return <div className="text-center py-8 text-slate-500">Chargement...</div>;
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Paramètres</h1>
        <p className="text-sm text-slate-500 mt-1">Configuration de l'application</p>
      </div>

      {error && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-red-900/40 border border-red-500/30 text-red-300 text-sm">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {success && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-green-900/40 border border-green-500/30 text-green-300 text-sm">
          <Check size={16} />
          Paramètres sauvegardés avec succès.
        </div>
      )}

      {/* Company Info */}
      <Card className="p-5">
        <h3 className="text-sm font-semibold text-slate-200 mb-4">Informations de l'entreprise</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5">Nom</label>
            <Input type="text" value={company.name} onChange={(e) => setCompany({ ...company, name: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5">Adresse</label>
            <Input type="text" value={company.address} onChange={(e) => setCompany({ ...company, address: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5">SIRET</label>
            <Input type="text" value={company.siret} onChange={(e) => setCompany({ ...company, siret: e.target.value })} />
          </div>
        </div>
      </Card>

      {/* Preferences */}
      <Card className="p-5">
        <h3 className="text-sm font-semibold text-slate-200 mb-4">Préférences</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5">Devise</label>
            <Input type="text" value={preferences.currency} onChange={(e) => setPreferences({ ...preferences, currency: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5">Langue</label>
            <select
              value={preferences.lang}
              onChange={(e) => setPreferences({ ...preferences, lang: e.target.value })}
              className="w-full h-9 px-3 rounded-lg bg-[#07090f] border border-[#1e2a3a] text-slate-200 text-sm focus:outline-none focus:border-green-500"
            >
              <option value="fr">Français</option>
              <option value="en">English</option>
              <option value="es">Español</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Account */}
      <Card className="p-5">
        <h3 className="text-sm font-semibold text-slate-200 mb-4">Changement de mot de passe</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5">Ancien mot de passe</label>
            <Input type="password" value={passwords.old} onChange={(e) => setPasswords({ ...passwords, old: e.target.value })} placeholder="••••••••" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5">Nouveau mot de passe</label>
            <Input type="password" value={passwords.new} onChange={(e) => setPasswords({ ...passwords, new: e.target.value })} placeholder="••••••••" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5">Confirmer le mot de passe</label>
            <Input type="password" value={passwords.confirm} onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })} placeholder="••••••••" />
          </div>
          <Button variant="secondary" onClick={handleChangePassword}>
            Changer le mot de passe
          </Button>
        </div>
      </Card>

      <div className="flex justify-end">
        <Button variant="primary" onClick={handleSave} disabled={saving}>
          <Save size={15} /> {saving ? 'Sauvegarde...' : 'Sauvegarder'}
        </Button>
      </div>
    </div>
  );
}
