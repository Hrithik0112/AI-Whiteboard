import { createContext } from 'react';
import type { Dispatch, SetStateAction } from 'react';

export interface UserDetails {
  id: number;
  name: string | null;
  email: string;
  credits: number;
  boardCount: number;
  boardLimit: number;
}

export interface UserDetailsContextValue {
  userDetail: UserDetails | null;
  setUserDetail: Dispatch<SetStateAction<UserDetails | null>>;
  refreshUserDetails: () => Promise<void>;
  userDetailsError: boolean;
}

export const UserDetailsContext = createContext<UserDetailsContextValue | null>(null);
