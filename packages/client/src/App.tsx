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
import { Logo } from './components/Logo';
import { CameraSetup } from './components/CameraSetup';
import { CallControls } from './components/CallControls';
import { useWebRTC } from './hooks/useWebRTC';
import { useMediaDevices } from './hooks/useMediaDevices';
import { TOKEN_STORAGE_KEY } from './tokenStorage';

type MatchState =
  | { phase: 'idle' }
  | { phase: 'waiting' }
  | { phase: 'matched'; sessionId: string; peer: PublicUser; initiator: boolean };

function Spinner() {
  return (
    <svg className="h-5 w-5 animate-spin text-brand-500" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}

export function App() {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_STORAGE_KEY));
  const [verificationStatus, setVerificationStatus] = useState<string | null>(null);
  const [seekingGenders, setSeekingGenders] = useState<VerifiedGender[]>(['female']);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [matchState, setMatchState] = useState<MatchState>({ phase: 'idle' });
  const media = useMediaDevices();

  function handleAuthenticated(auth: { token: string }) {
    localStorage.setItem(TOKEN_STORAGE_KEY, auth.token);
    setToken(auth.token);
  }

  function logout() {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    socket?.disconnect();
    media.disableCamera();
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

  const { remoteStream, replaceTrack } = useWebRTC(
    socket,
    matchState.phase === 'matched' ? matchState.sessionId : null,
    matchState.phase === 'matched' ? matchState.initiator : false,
    media.stream
  );

  if (!token) {
    return <AuthForm onAuthenticated={handleAuthenticated} />;
  }

  if (verificationStatus === null) {
    return (
      <div className="flex min-h-screen items-center justify-center gap-3 text-slate-400 dark:text-slate-500">
        <Spinner />
        <span className="text-sm">Loading…</span>
      </div>
    );
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
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-2xl items-center justify-between px-4 pt-8">
        <div className="flex items-center gap-2.5">
          <Logo size={32} />
          <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">randomcams</span>
        </div>
        <div className="flex gap-2">
          <button onClick={logout} className="btn-secondary !px-4 !py-2 text-xs">
            Log out
          </button>
          <button onClick={handleLogoutEverywhere} className="btn-secondary !px-4 !py-2 text-xs">
            Log out everywhere
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-10">
        {matchState.phase === 'idle' && (
          <div className="space-y-4">
            <CameraSetup media={media} />

            <div className="card p-8">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Ready when you are</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Pick who you'd like to meet, then start.
              </p>
              <div className="mt-5">
                <GenderFilterSelect value={seekingGenders} onChange={setSeekingGenders} />
              </div>
              <button
                disabled={seekingGenders.length === 0 || !media.cameraOn}
                onClick={() => socket?.emit('joinQueue', { seekingGenders })}
                className="btn-primary mt-6 w-full sm:w-auto"
              >
                Start
              </button>
              {!media.cameraOn && (
                <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">
                  Turn your camera on above to start — video is required to match with anyone here.
                </p>
              )}
            </div>
          </div>
        )}

        {matchState.phase === 'waiting' && (
          <div className="card flex flex-col items-center gap-4 p-12 text-center">
            <Spinner />
            <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Waiting for a match…</p>
          </div>
        )}

        {matchState.phase === 'matched' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="badge bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                <span className="h-1.5 w-1.5 rounded-full bg-current" /> Connected
              </span>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                Matched with {matchState.peer.displayName}
              </p>
            </div>

            <VideoChat localStream={media.stream} remoteStream={remoteStream} />

            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <CallControls media={media} onReplaceVideoTrack={replaceTrack} />
                <ReportButton socket={socket} sessionId={matchState.sessionId} reportedUserId={matchState.peer.id} />
              </div>
              <button
                onClick={() => {
                  socket?.emit('leaveSession', { sessionId: matchState.sessionId });
                  setMatchState({ phase: 'idle' });
                }}
                className="btn-danger"
              >
                Next / Leave
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
