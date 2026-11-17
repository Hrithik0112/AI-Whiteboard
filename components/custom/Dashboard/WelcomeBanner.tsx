'use client';
import { useUser } from '@clerk/nextjs';
import CreateNewBoardDialog from './CreateNewBoardDialog';

export default function WelcomeBanner() {
  const { user } = useUser();
  return <section className="db-welcome"><div><span className="db-eyebrow">YOUR CREATIVE SPACE</span><h1>Welcome back{user?.firstName ? `, ${user.firstName}` : ''}.</h1><p>Pick up a thought, or make room for a new one.</p></div><CreateNewBoardDialog /></section>;
}
