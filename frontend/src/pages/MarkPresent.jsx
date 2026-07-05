import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { PageHeader, Card, Icon, Spinner } from '../components/ui';
import { selfAttendanceApi } from '../api/endpoints';
import { loadFaceModels, getFaceDescriptor } from '../utils/faceApi';
import { useAuth } from '../context/AuthContext';

export default function MarkPresent() {
  const { user } = useAuth();
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modelsReady, setModelsReady] = useState(false);
  const [camReady, setCamReady] = useState(false);
  const [camError, setCamError] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null); // { ok: bool, message: string }

  const refreshStatus = () => selfAttendanceApi.status().then((r) => setStatus(r.data));

  useEffect(() => {
    refreshStatus().finally(() => setLoading(false));
  }, []);

  // Boot camera + face models once.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
        if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setCamReady(true);
        }
      } catch (e) {
        setCamError('Camera access denied or unavailable. Please allow camera access.');
      }
      try {
        await loadFaceModels();
        if (!cancelled) setModelsReady(true);
      } catch (e) {
        if (!cancelled) setCamError((prev) => prev || 'Failed to load face models. Check your internet connection.');
      }
    })();
    return () => {
      cancelled = true;
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const getLocation = () =>
    new Promise((resolve) => {
      if (!navigator.geolocation) return resolve(null);
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => resolve(null),
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });

  const captureDescriptor = async () => {
    if (!videoRef.current) throw new Error('Camera not ready');
    const desc = await getFaceDescriptor(videoRef.current);
    if (!desc) throw new Error('No face detected. Center your face in the frame with good lighting.');
    return desc;
  };

  const enroll = async () => {
    setBusy(true);
    setResult(null);
    try {
      const descriptor = await captureDescriptor();
      await selfAttendanceApi.enrollFace(descriptor);
      toast.success('Face enrolled');
      await refreshStatus();
      setResult({ ok: true, message: 'Face enrolled successfully. You can now mark attendance.' });
    } catch (e) {
      setResult({ ok: false, message: e?.response?.data?.message || e.message || 'Enrollment failed' });
    } finally {
      setBusy(false);
    }
  };

  const markPresent = async () => {
    setBusy(true);
    setResult(null);
    try {
      const needFace = status?.faceRequired;
      const [descriptor, location] = await Promise.all([
        needFace ? captureDescriptor() : Promise.resolve(undefined),
        getLocation(),
      ]);
      const r = await selfAttendanceApi.checkIn({ descriptor, location, liveness: true });
      const when = new Date(r.data?.at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setResult({ ok: true, message: `${r.message} at ${when}` });
      toast.success('Marked present');
    } catch (e) {
      setResult({ ok: false, message: e?.response?.data?.message || e.message || 'Could not mark attendance' });
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <div className="flex justify-center py-16"><Spinner className="w-8 h-8" /></div>;

  const enrolled = status?.enrolled;
  const mode = status?.mode === 'per_lecture' ? 'per-lecture (current class)' : 'daily check-in';

  return (
    <div>
      <PageHeader
        title="Mark Attendance"
        subtitle={`GPS + Face verification · ${mode}`}
      />
      <div className="grid lg:grid-cols-2 gap-5 max-w-4xl">
        <Card>
          <div className="relative rounded-xl overflow-hidden bg-slate-900 aspect-[4/3] flex items-center justify-center">
            <video ref={videoRef} playsInline muted className="w-full h-full object-cover" />
            {!camReady && !camError && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-300 gap-2">
                <Spinner className="w-7 h-7" />
                <span className="text-xs">Starting camera…</span>
              </div>
            )}
            {camError && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-rose-300 gap-2 p-4 text-center">
                <Icon name="camera" className="w-8 h-8" />
                <span className="text-xs">{camError}</span>
              </div>
            )}
            <div className="absolute inset-6 border-2 border-white/40 rounded-[40%] pointer-events-none" />
          </div>
          <div className="mt-3 flex items-center gap-3 text-xs text-slate-500">
            <span className="flex items-center gap-1"><Icon name={modelsReady ? 'check' : 'clock'} className="w-4 h-4" /> Face engine {modelsReady ? 'ready' : 'loading…'}</span>
            {status?.geofence?.enabled && <span className="flex items-center gap-1"><Icon name="pin" className="w-4 h-4" /> Geofence on</span>}
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-11 h-11 rounded-lg bg-brand-100 text-brand-700 flex items-center justify-center">
              <Icon name="face" className="w-6 h-6" />
            </div>
            <div>
              <div className="font-semibold text-slate-900">{user?.name}</div>
              <div className="text-xs text-slate-500 capitalize">{user?.role?.replace('_', ' ')}</div>
            </div>
          </div>

          <ol className="text-sm text-slate-600 space-y-2 mb-5">
            <li className="flex items-center gap-2"><Icon name="pin" className="w-4 h-4 text-slate-400" /> {status?.geofence?.enabled ? 'Confirm you are on campus (GPS)' : 'GPS check disabled'}</li>
            <li className="flex items-center gap-2"><Icon name="face" className="w-4 h-4 text-slate-400" /> {status?.faceRequired ? 'Verify your face' : 'Face check disabled'}</li>
            <li className="flex items-center gap-2"><Icon name="check" className="w-4 h-4 text-slate-400" /> Get marked present</li>
          </ol>

          {result && (
            <div className={`mb-4 rounded-lg px-3 py-3 text-sm flex items-start gap-2 ${result.ok ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'}`}>
              <Icon name={result.ok ? 'check' : 'alert'} className="w-5 h-5 shrink-0" />
              <span>{result.message}</span>
            </div>
          )}

          {!enrolled ? (
            <div>
              <div className="mb-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs px-3 py-2">
                You haven't enrolled your face yet. Do this once so we can recognize you.
              </div>
              <button className="btn-primary w-full flex items-center justify-center gap-2" disabled={busy || !camReady || !modelsReady} onClick={enroll}>
                {busy ? <Spinner className="w-4 h-4" /> : <Icon name="camera" className="w-4 h-4" />}
                Enroll my face
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <button className="btn-primary w-full flex items-center justify-center gap-2" disabled={busy || !camReady || (status?.faceRequired && !modelsReady)} onClick={markPresent}>
                {busy ? <Spinner className="w-4 h-4" /> : <Icon name="check" className="w-4 h-4" />}
                Mark me present
              </button>
              <button className="btn-ghost w-full text-xs" disabled={busy || !camReady || !modelsReady} onClick={enroll}>
                Re-enroll face
              </button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
