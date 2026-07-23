import { useEffect, useState } from 'react';
import { Socket } from 'socket.io-client';
import { PublicUser, VerifiedGender } from '@randomcams/shared';
import { connectSocket } from './api/socket';
import { getVerificationStatus } from './api/rest';
import { VerificationGate } from './components/VerificationGate';
import { GenderFilterSelect } from './components/GenderFilterSelect';
import { VideoChat } from './components/VideoChat';
import { ReportButton } from './components/ReportButton';
import { useWebRTC } from './hooks/useWebRTC';

type MatchState =
  | { phase: 'idle' }
  | { phase: 'waiting' }
  | { phase: 'matched'; sessionId: string; peer: PublicUser; initiator: boolean };

export function App() {
  // No real auth in this scaffold — userId is entered directly. Replace with
  // a real login/session flow before this goes anywhere near production.
  const [userId, setUserId] = useState('');
  const [confirmedUserId, setConfirmedUserId] = useState<string | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<string | null>(null);
  const [seekingGenders, setSeekingGenders] = useState<VerifiedGender[]>(['female']);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [matchState, setMatchState] = useState<MatchState>({ phase: 'idle' });

  useEffect(() => {
    if (!confirmedUserId) return;
    getVerificationStatus(confirmedUserId).then((r) => setVerificationStatus(r.verificationStatus));
  }, [confirmedUserId]);

  useEffect(() => {
    if (!confirmedUserId || verificationStatus !== 'VERIFIED') return;
    const s = connectSocket(confirmedUserId);
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
  }, [confirmedUserId, verificationStatus]);

  const { localStream, remoteStream } = useWebRTC(
    socket,
    matchState.phase === 'matched' ? matchState.sessionId : null,
    matchState.phase === 'matched' ? matchState.initiator : false
  );

  if (!confirmedUserId) {
    return (
      <div style={{ maxWidth: 480, margin: '80px auto', fontFamily: 'sans-serif' }}>
        <h2>randomcams (dev scaffold)</h2>
        <p>Enter a user id created via the server's seed/dev tooling.</p>
        <input value={userId} onChange={(e) => setUserId(e.target.value)} placeholder="user id" />
        <button onClick={() => setConfirmedUserId(userId)}>Continue</button>
      </div>
    );
  }

  if (verificationStatus === null) {
    return <p>Loading…</p>;
  }

  if (verificationStatus !== 'VERIFIED') {
    return (
      <VerificationGate
        userId={confirmedUserId}
        status={verificationStatus.toLowerCase()}
        onRecheck={() => getVerificationStatus(confirmedUserId).then((r) => setVerificationStatus(r.verificationStatus))}
      />
    );
  }

  return (
    <div style={{ maxWidth: 720, margin: '40px auto', fontFamily: 'sans-serif' }}>
      <h2>randomcams</h2>

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
