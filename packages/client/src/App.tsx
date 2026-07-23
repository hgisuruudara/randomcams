import { useEffect, useState } from 'react';
import { Socket } from 'socket.io-client';
import { PublicUser, VerifiedGender } from '@randomcams/shared';
import { connectSocket } from './api/socket';
import { getVerificationStatus } from './api/rest';
import { AuthForm } from './components/AuthForm';
import { VerificationGate } from './components/VerificationGate';
import { GenderFilterSelect } from './components/GenderFilterSelect';
import { VideoChat } from './components/VideoChat';
import { ReportButton } from './components/ReportButton';
import { useWebRTC } from './hooks/useWebRTC';

type MatchState =
  | { phase: 'idle' }
  | { phase: 'waiting' }
  | { phase: 'matched'; sessionId: string; peer: PublicUser; initiator: boolean };

const TOKEN_STORAGE_KEY = 'randomcams_token';

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
      <button onClick={logout} style={{ float: 'right' }}>
        Log out
      </button>

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
