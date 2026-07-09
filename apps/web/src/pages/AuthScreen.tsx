import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { apiPost } from '../lib/api';
import { ELECTIVE_SCOPE_NOTICE } from '@medconecta/shared';

type Mode = 'login' | 'register';

const onlyDigits = (s: string) => s.replace(/\D/g, '');

export function AuthScreen() {
  const [mode, setMode] = useState<Mode>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [cpf, setCpf] = useState('');
  const [phone, setPhone] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [crmNumber, setCrmNumber] = useState('');

  async function handleLogin() {
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    if (err) throw new Error('E-mail ou senha inválidos.');
  }

  async function handleRegister() {
    const cpfClean = onlyDigits(cpf);
    // Telefone: aceita com/sem 55 no início, com/sem pontuação. Normaliza para 55 + DDD + 9 dígitos.
    let phoneClean = onlyDigits(phone);
    if (phoneClean.length === 10 || phoneClean.length === 11) {
      // Faltou o 55 → adiciona.
      phoneClean = `55${phoneClean}`;
    }
    if (cpfClean.length !== 11) {
      throw new Error('CPF deve ter 11 dígitos (apenas números, sem pontos ou traço).');
    }
    if (phoneClean.length !== 12 && phoneClean.length !== 13) {
      throw new Error('Telefone deve ter DDD + número (10 ou 11 dígitos) — adicionamos o 55 automaticamente.');
    }
    try {
      await apiPost('/auth/register/doctor', {
        email,
        password,
        fullName,
        cpf: cpfClean,
        phone: phoneClean,
        specialization,
        crmNumber,
      });
    } catch (err) {
      // Mostra o detalhe da validação que vem do backend (Zod).
      const apiErr = err as { status?: number; message?: string };
      if (apiErr.status === 400 && apiErr.message?.includes('validation')) {
        throw new Error(
          'Verifique os campos: CPF (11 dígitos), Telefone (55 + DDD + 9 dígitos), Senha (mín. 8 caracteres).',
        );
      }
      throw err;
    }
    // Após criar o perfil, autentica para abrir sessão.
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    if (err) throw new Error('Conta criada, mas o login automático falhou. Tente entrar.');
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === 'login') await handleLogin();
      else await handleRegister();
      // onAuthStateChange no App cuida da navegação.
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro inesperado.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="auth-brand">
          <h1>MEDconecta</h1>
          <p className="muted">Canal eletivo médico-paciente</p>
        </div>

        <div className="auth-tabs">
          <button
            className={mode === 'login' ? 'auth-tab active' : 'auth-tab'}
            onClick={() => {
              setMode('login');
              setError(null);
            }}
            type="button"
          >
            Entrar
          </button>
          <button
            className={mode === 'register' ? 'auth-tab active' : 'auth-tab'}
            onClick={() => {
              setMode('register');
              setError(null);
            }}
            type="button"
          >
            Criar conta (médico)
          </button>
        </div>

        <form className="auth-form" onSubmit={onSubmit}>
          {mode === 'register' && (
            <>
              <label>
                Nome completo
                <input value={fullName} onChange={(e) => setFullName(e.target.value)} required />
              </label>
              <div className="row">
                <label>
                  CPF
                  <input
                    value={cpf}
                    onChange={(e) => setCpf(e.target.value)}
                    placeholder="000.000.000-00"
                    required
                  />
                </label>
                <label>
                  Telefone (DDD + número, 10 ou 11 dígitos)
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="83 99999-0000"
                    required
                  />
                </label>
              </div>
              <div className="row">
                <label>
                  Especialidade
                  <input
                    value={specialization}
                    onChange={(e) => setSpecialization(e.target.value)}
                    placeholder="Neurologia"
                    required
                  />
                </label>
                <label>
                  CRM
                  <input value={crmNumber} onChange={(e) => setCrmNumber(e.target.value)} required />
                </label>
              </div>
            </>
          )}

          <label>
            E-mail
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          <label>
            Senha
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={mode === 'register' ? 8 : 1}
              required
            />
          </label>

          {error && <div className="auth-error">{error}</div>}

          <button className="btn-primary" type="submit" disabled={loading}>
            {loading ? 'Aguarde…' : mode === 'login' ? 'Entrar' : 'Criar conta'}
          </button>
        </form>

        <p className="auth-disclaimer">{ELECTIVE_SCOPE_NOTICE.disclaimer}</p>
      </div>
    </div>
  );
}
