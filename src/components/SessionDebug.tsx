
'use client';

import { useSession } from 'next-auth/react';

export default function SessionDebug() {
  const { data: session, status } = useSession();
  
  console.log('Session status:', status);
  console.log('Session data:', session);
  
  if (status === 'loading') return <div>Loading session...</div>;
  if (status === 'unauthenticated') return <div>Not authenticated</div>;
  
  return (
    <div className="p-4 bg-gray-100 rounded">
      <h3>Session Debug</h3>
      <pre>{JSON.stringify(session, null, 2)}</pre>
    </div>
  );
}