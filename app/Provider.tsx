'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { UserDetailsContext, type UserDetails } from '@/context/UserDetailsContext';
import { useUser } from '@clerk/nextjs';
import { AppearanceProvider } from '@/context/AppearanceContext';
import { usePathname } from 'next/navigation';

export default function Provider({ children }: { children: React.ReactNode }) {
  const [userDetail, setUserDetail] = useState<UserDetails | null>(null);
  const [userDetailsError, setUserDetailsError] = useState(false);
  const { user, isLoaded } = useUser();
  const pathname = usePathname();
  const requestVersion = useRef(0);
  const userId = user?.id;

  const refreshUserDetails = useCallback(async () => {
    const version = ++requestVersion.current;
    if (!isLoaded || !userId) {
      setUserDetail(null);
      setUserDetailsError(false);
      return;
    }
    try {
      const { data } = await axios.post<UserDetails>('/api/users');
      if (version === requestVersion.current) {
        setUserDetail(data);
        setUserDetailsError(false);
      }
    } catch {
      if (version === requestVersion.current) {
        setUserDetail(null);
        setUserDetailsError(true);
      }
    }
  }, [isLoaded, userId]);

  useEffect(() => {
    setUserDetail(null);
    return () => { requestVersion.current++; };
  }, [userId]);

  useEffect(() => {
    void refreshUserDetails();
    // Revalidate after navigation and when returning from another tab.
    const onVisible = () => {
      if (document.visibilityState === 'visible') void refreshUserDetails();
    };
    window.addEventListener('focus', refreshUserDetails);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      requestVersion.current++;
      window.removeEventListener('focus', refreshUserDetails);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [pathname, refreshUserDetails]);

  return <UserDetailsContext.Provider value={{ userDetail, setUserDetail, refreshUserDetails, userDetailsError }}><AppearanceProvider key={userId || 'guest'} accountId={userId}>{children}</AppearanceProvider></UserDetailsContext.Provider>;
}
