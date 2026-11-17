'use client';

import { useContext } from 'react';
import { useClerk, useUser } from '@clerk/nextjs';
import { ArrowUpRight, Check, RotateCcw, UserRound } from 'lucide-react';
import { useAppearance } from '@/context/AppearanceContext';
import { UserDetailsContext } from '@/context/UserDetailsContext';
import { colorSchemes, fontOptions } from '@/lib/appearance';

export default function SettingsPage() {
  const { user, isLoaded } = useUser();
  const { openUserProfile } = useClerk();
  const { userDetail, userDetailsError, refreshUserDetails } = useContext(UserDetailsContext) || {};
  const { appearance, updateAppearance, resetAppearance, ready, saved } = useAppearance();

  return <div className="db-settings">
    <div className="db-welcome"><div><span className="db-eyebrow">MAKE YOURSELF AT HOME</span><h1>Settings.</h1><p>A workspace that feels a little more like you.</p></div></div>
    <section className="db-settings-section" aria-labelledby="profile-heading">
      <div className="db-settings-heading"><h2 id="profile-heading">Your profile</h2><p>The details behind your workspace.</p></div>
      <div className="db-settings-panel">
        <div className="db-profile-top"><div className="db-profile-avatar">{user?.imageUrl ? <img src={user.imageUrl} alt="Your profile" /> : <UserRound size={26} />}</div><div><h3>{isLoaded ? user?.fullName || user?.username || 'Your account' : 'Loading profile…'}</h3><p>Personal workspace</p></div><button className="db-secondary-button" disabled={!isLoaded || !user} onClick={() => openUserProfile()}>Manage account <ArrowUpRight size={15} /></button></div>
        <dl className="db-profile-details"><div><dt>Email address</dt><dd>{user?.primaryEmailAddress?.emailAddress || '—'}</dd></div><div><dt>Member since</dt><dd>{user?.createdAt ? new Intl.DateTimeFormat('en', { month: 'long', day: 'numeric', year: 'numeric' }).format(user.createdAt) : '—'}</dd></div><div><dt>Active boards</dt><dd>{userDetail ? `${userDetail.boardCount} of ${userDetail.boardLimit} boards` : userDetailsError ? <button className="db-inline-button" onClick={() => void refreshUserDetails?.()}>Retry loading usage</button> : 'Loading…'}</dd></div></dl>
      </div>
    </section>
    <section className="db-settings-section" aria-labelledby="appearance-heading">
      <div className="db-settings-heading"><h2 id="appearance-heading">Appearance</h2><p>Changes apply instantly and are saved in this browser for your account.</p></div>
      <div className="db-settings-panel">
        <fieldset className="db-preference-field" disabled={!ready}><legend>Color scheme</legend><div className="db-choice-grid">{colorSchemes.map(scheme => <label className="db-choice" key={scheme.id}>
          <input type="radio" name="color-scheme" value={scheme.id} checked={appearance.colorScheme === scheme.id} onChange={() => updateAppearance({ colorScheme: scheme.id })} />
          <span className="db-color-swatch" aria-hidden="true">{scheme.colors.map(color => <span key={color} style={{ background: color }} />)}</span>
          <span className="db-choice-name">{scheme.name}{appearance.colorScheme === scheme.id && <Check size={15} aria-hidden="true" />}</span><span className="db-choice-description">{scheme.description}</span>
        </label>)}</div></fieldset>
        <fieldset className="db-preference-field" disabled={!ready}><legend>Interface font</legend><p>Choose the typeface for menus and controls. Your canvas text stays as you designed it.</p><div className="db-choice-grid">{fontOptions.map(font => <label className="db-choice" key={font.id}>
          <input type="radio" name="interface-font" value={font.id} checked={appearance.font === font.id} onChange={() => updateAppearance({ font: font.id })} />
          <span className="db-font-sample" style={{ fontFamily: font.family }} aria-hidden="true">Aa</span>
          <span className="db-choice-name">{font.name}{appearance.font === font.id && <Check size={15} aria-hidden="true" />}</span><span className="db-choice-description">{font.description}</span>
        </label>)}</div></fieldset>
        <div className="db-preference-footer"><p role="status">{!ready ? 'Loading preferences…' : saved ? 'Preferences saved on this device.' : 'Applied for this session. Browser storage is unavailable.'}</p><button className="db-secondary-button" onClick={resetAppearance} disabled={!ready}><RotateCcw size={14} />Reset appearance</button></div>
      </div>
    </section>
  </div>;
}
