import { useEffect, useState } from 'react';
import { Socket } from 'socket.io-client';
import { PublicUser, VerifiedGender } from '@randomcams/shared';
import { connectSocket } from './api/socket';
import { getVerificationStatus, logoutEverywhere } from './api/rest';
import { AuthForm } from './components/AuthForm';
import { VerificationGate } from './components/VerificationGate';
import { GenderFilterSelect } from './components/GenderFilterSelect';
import { VideoChat } from './components/VideoChat';
import { ReportButton } from './components/ReportButton';
import { useWebRTC } from './hooks/useWebRTC';
import { TOKEN_STORAGE_KEY } from './tokenStorage';

type MatchState =
  | { phase: 'idle' }
  | { phase: 'waiting' }
  | { phase: 'matched'; sessionId: string; peer: PublicUser; initiator: boolean };

export function App() {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_STORAGE_KEY));
  const [verificationStatus, setVerificationStatus] = useState<string | null>(null);
  const [seekingGenders, setSeekingGenders] = useState<VerifiedGender[]>(['female']);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [matchState, setMatchState] = useState<MatchState>({ phase: 'idle' });

  function handleAuthenticated(auth: { token: string }) {
    localStorage.setItem(TOKEN_STORAGE_KEY, auth.token);
    setToken(auth.token);
  }

  function logout() {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    socket?.disconnect();
    setToken(null);
    setVerificationStatus(null);
  }

  async function handleLogoutEverywhere() {
    if (token) await logoutEverywhere(token).catch(() => undefined);
    logout();
  }

  useEffect(() => {
    if (!token) return;
    getVerificationStatus(token).then((r) => setVerificationStatus(r.verificationStatus));
  }, [token]);

  useEffect(() => {
    if (!token || verificationStatus !== 'VERIFIED') return;
    const s = connectSocket(token);
    setSocket(s);

    s.on('waitingForMatch', () => setMatchState({ phase: 'waiting' }));
    s.on('matched', ({ sessionId, peer, initiator }) =>
      setMatchState({ phase: 'matched', sessionId, peer, initiator })
    );
    s.on('peerLeft', () => setMatchState({ phase: 'idle' }));
    s.on('verificationRequired', () => setVerificationStatus('UNVERIFIED'));

    return () => {
      s.disconnect();
    };
  }, [token, verificationStatus]);

  const { localStream, remoteStream } = useWebRTC(
    socket,
    matchState.phase === 'matched' ? matchState.sessionId : null,
    matchState.phase === 'matched' ? matchState.initiator : false
  );

  if (!token) {
    return <AuthForm onAuthenticated={handleAuthenticated} />;
  }

  if (verificationStatus === null) {
    return <p>Loading…</p>;
  }

  if (verificationStatus !== 'VERIFIED') {
    return (
      <VerificationGate
        token={token}
        status={verificationStatus.toLowerCase()}
        onRecheck={() => getVerificationStatus(token).then((r) => setVerificationStatus(r.verificationStatus))}
      />
    );
  }

  return (
    <div style={{ maxWidth: 720, margin: '40px auto', fontFamily: 'sans-serif' }}>
      <h2>randomcams</h2>
      <div style={{ float: 'right' }}>
        <button onClick={logout}>Log out</button>{' '}
        <button onClick={handleLogoutEverywhere}>Log out everywhere</button>
      </div>

      {matchState.phase === 'idle' && (
        <div>
          <GenderFilterSelect value={seekingGenders} onChange={setSeekingGenders} />
          <button
            disabled={seekingGenders.length === 0}
            onClick={() => socket?.emit('joinQueue', { seekingGenders })}
          >
            Start
          </button>
        </div>
      )}

      {matchState.phase === 'waiting' && <p>Waiting for a match…</p>}

      {matchState.phase === 'matched' && (
        <div>
          <p>Matched with {matchState.peer.displayName}</p>
          <VideoChat localStream={localStream} remoteStream={remoteStream} />
          <ReportButton socket={socket} sessionId={matchState.sessionId} reportedUserId={matchState.peer.id} />
          <br />
          <button
            onClick={() => {
              socket?.emit('leaveSession', { sessionId: matchState.sessionId });
              setMatchState({ phase: 'idle' });
            }}
          >
            Next / Leave
          </button>
        </div>
      )}
    </div>
  );
}
