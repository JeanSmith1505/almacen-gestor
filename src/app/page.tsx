'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Button from '@/components/ui/Button';
import FormField from '@/components/ui/FormField';
import formStyles from '@/components/ui/formInputs.module.css';
import styles from './page.module.css';

export default function LandingPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (signInError) {
      setError(signInError.message);
      return;
    }
    router.push('/dashboard');
  };

  return (
    <div className={styles.wrapper}>
      <section className={styles.authPanel}>
        <div className={styles.brand}>
          <span className={styles.brandMark}>IT</span>
          <span className={styles.brandName}>InvenTrack</span>
        </div>

        <h1 className={styles.heading}>Iniciar sesión</h1>
        <p className={styles.description}>
          Ingresa con tu cuenta para gestionar artículos, inventario y movimientos.
        </p>

        <form className={formStyles.form} onSubmit={handleSubmit}>
          <FormField label="Correo" required>
            <input
              type="email"
              className={formStyles.input}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </FormField>
          <FormField label="Contraseña" required>
            <input
              type="password"
              className={formStyles.input}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
              required
            />
          </FormField>

          {error && <p className={styles.error}>{error}</p>}

          <Button type="submit" variant="secondary" loading={loading} className={styles.authButton}>
            Ingresar
          </Button>
        </form>
      </section>
    </div>
  );
}