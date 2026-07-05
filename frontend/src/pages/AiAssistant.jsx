import { useEffect, useRef, useState } from 'react';
import { PageHeader, Card, Icon, Badge } from '../components/ui';
import { BarChart } from '../components/ui/Charts';
import { aiApi } from '../api/endpoints';
import { useAuth } from '../context/AuthContext';

export default function AiAssistant() {
  const { departmentId } = useAuth();
  const [messages, setMessages] = useState([{ role: 'ai', text: 'Hello! I am the SAODMS AI assistant. Ask me about attendance, timetables, workload, or substitutions.' }]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [risks, setRisks] = useState([]);
  const [workload, setWorkload] = useState([]);
  const [aiStatus, setAiStatus] = useState(null);
  const endRef = useRef();

  useEffect(() => {
    const p = departmentId ? { department: departmentId } : {};
    aiApi.risks(p).then((r) => setRisks(r.data.risks || [])).catch(() => {});
    aiApi.predictWorkload(p).then((r) => setWorkload(r.data || [])).catch(() => {});
    aiApi.status().then((r) => setAiStatus(r.data)).catch(() => {});
  }, [departmentId]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const send = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    const userMsg = input;
    const history = messages.map((m) => ({ role: m.role === 'user' ? 'user' : 'ai', text: m.text }));
    setMessages((m) => [...m, { role: 'user', text: userMsg }]);
    setInput('');
    setSending(true);
    try {
      const r = await aiApi.chat({ message: userMsg, history, department: departmentId });
      setMessages((m) => [...m, { role: 'ai', text: r.data.reply }]);
      if (r.data.provider) setAiStatus({ provider: r.data.provider, enabled: r.data.enabled, model: r.data.model });
    } catch (err) {
      setMessages((m) => [...m, { role: 'ai', text: 'Sorry, I could not process that.' }]);
    } finally {
      setSending(false);
    }
  };

  const riskColor = { critical: 'bg-rose-100 text-rose-700', high: 'bg-amber-100 text-amber-700', medium: 'bg-yellow-100 text-yellow-700', low: 'bg-slate-100 text-slate-600' };

  return (
    <div>
      <PageHeader title="AI Assistant" subtitle="Smart insights, predictions and risk detection" />
      <div className="grid lg:grid-cols-3 gap-5">
        <Card className="lg:col-span-2 flex flex-col" pad={false}>
          <div className="border-b border-slate-100 px-5 py-3 font-semibold text-slate-800 flex items-center gap-2">
            <Icon name="sparkles" className="w-5 h-5 text-brand-600" /> Chat Assistant
            {aiStatus && (
              aiStatus.enabled
                ? <Badge className="bg-emerald-100 text-emerald-700 ml-auto">{`Live · ${aiStatus.provider}${aiStatus.model ? ` (${aiStatus.model})` : ''}`}</Badge>
                : <Badge className="bg-slate-100 text-slate-500 ml-auto">Offline mode</Badge>
            )}
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[420px] min-h-[300px]">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${m.role === 'user' ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-700'}`}>{m.text}</div>
              </div>
            ))}
            {sending && (
              <div className="flex justify-start">
                <div className="bg-slate-100 rounded-2xl px-4 py-2.5 flex items-center gap-2 text-slate-500 text-sm">
                  <span>AI is thinking</span>
                  <span className="flex gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </span>
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>
          <form onSubmit={send} className="border-t border-slate-100 p-3 flex gap-2">
            <input className="input" placeholder={sending ? 'AI is thinking…' : 'Ask something...'} value={input} onChange={(e) => setInput(e.target.value)} disabled={sending} />
            <button className="btn-primary" disabled={sending || !input.trim()}><Icon name="send" className="w-4 h-4" /></button>
          </form>
        </Card>

        <div className="space-y-5">
          <Card>
            <span className="section-title">Risk Detection</span>
            <div className="mt-3 space-y-2">
              {risks.length === 0 ? <p className="text-sm text-slate-400">No risks detected</p> : risks.map((r, i) => (
                <div key={i} className="flex items-start gap-2">
                  <Badge className={riskColor[r.level]}>{r.level}</Badge>
                  <span className="text-sm text-slate-600">{r.message}</span>
                </div>
              ))}
            </div>
          </Card>
          <Card>
            <span className="section-title">Faculty Workload</span>
            <div className="mt-3">
              <BarChart labels={workload.slice(0, 6).map((w) => (w.faculty || '').split(' ').slice(-1)[0])} datasets={[{ label: 'Utilization %', data: workload.slice(0, 6).map((w) => w.utilization) }]} height={180} />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
