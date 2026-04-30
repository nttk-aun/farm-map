'use client';

import { useEffect, useState } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';

function getSafeCallbackUrl(rawCallbackUrl) {
  try {
    if (!rawCallbackUrl || typeof rawCallbackUrl !== 'string') {
      return '/farm-map';
    }
    if (!rawCallbackUrl.startsWith('/')) {
      return '/farm-map';
    }
    return rawCallbackUrl;
  } catch (error) {
    console.error('getSafeCallbackUrl error:', error);
    return '/farm-map';
  }
}

function isAdminRole(role) {
  try {
    return String(role || '')
      .trim()
      .toLowerCase() === 'admin';
  } catch (error) {
    console.error('isAdminRole error:', error);
    return false;
  }
}

export default function LoginPage() {
  try {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { data: session, status } = useSession();
    const [form, setForm] = useState({ username: '', password: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorText, setErrorText] = useState('');
    const callbackUrl = getSafeCallbackUrl(searchParams.get('callbackUrl'));

    useEffect(() => {
      try {
        if (status === 'authenticated' && isAdminRole(session?.user?.role)) {
          router.replace(callbackUrl || '/farm-map');
        }
      } catch (error) {
        console.error('LoginPage useEffect error:', error);
      }
    }, [status, session, callbackUrl, router]);

    const handleInputChange = (event) => {
      try {
        const { name, value } = event.target;
        setForm((prev) => ({ ...prev, [name]: value }));
      } catch (error) {
        console.error('handleInputChange error:', error);
      }
    };

    const handleSubmit = async (event) => {
      try {
        event.preventDefault();
        setIsSubmitting(true);
        setErrorText('');

        const result = await signIn('credentials', {
          username: form.username,
          password: form.password,
          redirect: false,
          callbackUrl,
        });
        if (result?.error) {
          setErrorText('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
          return;
        }
        if (result?.url) {
          router.replace(result.url);
        } else {
          router.replace('/farm-map');
        }
        router.refresh();
      } catch (error) {
        console.error('handleSubmit error:', error);
        setErrorText('เข้าสู่ระบบไม่สำเร็จ');
      } finally {
        setIsSubmitting(false);
      }
    };

    return (
      <main className="ui-page" style={{ maxWidth: 520 }}>
        <div className="ui-card">
          <h1 className="ui-header-title" style={{ marginBottom: 10 }}>
            Admin Login
          </h1>
          <p className="ui-header-subtitle" style={{ marginBottom: 16 }}>
            สำหรับผู้ดูแลระบบที่เพิ่ม/แก้ไข/ลบข้อมูลฟาร์ม
          </p>
          <form onSubmit={handleSubmit} className="ui-form-grid">
            <div>
              <label className="ui-label">Username</label>
              <input
                className="ui-input"
                name="username"
                value={form.username}
                onChange={handleInputChange}
                required
              />
            </div>
            <div>
              <label className="ui-label">Password</label>
              <input
                className="ui-input"
                type="password"
                name="password"
                value={form.password}
                onChange={handleInputChange}
                required
              />
            </div>
            {errorText ? <p className="ui-status" style={{ color: 'var(--danger)' }}>{errorText}</p> : null}
            <div className="ui-actions">
              <button type="submit" className="ui-btn ui-btn-primary" disabled={isSubmitting}>
                {isSubmitting ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
              </button>
            </div>
          </form>
        </div>
      </main>
    );
  } catch (error) {
    console.error('LoginPage render error:', error);
    return (
      <main className="ui-page">
        <div className="ui-card">
          <p className="ui-status" style={{ color: 'var(--danger)' }}>
            ไม่สามารถแสดงหน้าเข้าสู่ระบบได้
          </p>
        </div>
      </main>
    );
  }
}
