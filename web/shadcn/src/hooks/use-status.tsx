import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import api from '@/lib/api';

interface StatusData {
  version: string;
  system_name: string;
  logo: string;
  footer_html: string;
  server_address: string;
  turnstile_check: boolean;
  turnstile_site_key: string;
  wechat_login: boolean;
  github_oauth: boolean;
  oidc: boolean;
  password_login: boolean;
  password_register: boolean;
  email_verification: boolean;
  quota_per_unit: number;
  display_in_currency: boolean;
  top_up_link: string;
  chat_link: string;
}

interface StatusContextType {
  status: StatusData | null;
  loading: boolean;
}

const StatusContext = createContext<StatusContextType | undefined>(undefined);

export function StatusProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<StatusData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/status').then((res) => {
      if (res.data.success) {
        setStatus(res.data.data);
      }
    }).finally(() => setLoading(false));
  }, []);

  return (
    <StatusContext.Provider value={{ status, loading }}>
      {children}
    </StatusContext.Provider>
  );
}

export function useStatus() {
  const ctx = useContext(StatusContext);
  if (!ctx) throw new Error('useStatus must be used within StatusProvider');
  return ctx;
}
