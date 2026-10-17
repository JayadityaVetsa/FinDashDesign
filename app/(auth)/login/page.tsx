import { Suspense } from 'react';
import LoginClient from './LoginClient';
export default function LoginPage() { return <Suspense fallback={<p className="p-8">Loading sign in…</p>}><LoginClient /></Suspense>; }
