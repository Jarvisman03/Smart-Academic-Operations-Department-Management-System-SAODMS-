import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { PageHeader, Card, Loading, EmptyState, Avatar, Modal, Icon } from '../components/ui';
import { chatApi, searchApi } from '../api/endpoints';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { formatTime } from '../utils/format';

export default function Chat() {
  const { user } = useAuth();
  const socket = useSocket();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [newOpen, setNewOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [people, setPeople] = useState([]);
  const bottomRef = useRef();

  const loadConversations = async () => {
    setLoading(true);
    try { const r = await chatApi.list(); setConversations(r.data); }
    finally { setLoading(false); }
  };
  useEffect(() => { loadConversations(); }, []);

  // Live incoming messages.
  useEffect(() => {
    const s = socket?.chat?.current;
    if (!s) return undefined;
    const onMessage = ({ chatId, message }) => {
      if (active && chatId === active._id) setMessages((m) => [...m, message]);
      loadConversations();
    };
    s.on('chat:message', onMessage);
    return () => s.off('chat:message', onMessage);
  }, [socket, active]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const openChat = async (c) => {
    try {
      const r = await chatApi.get(c._id);
      setActive(r.data);
      setMessages(r.data.messages || []);
      socket?.chat?.current?.emit('chat:join', { chatId: c._id });
    } catch { toast.error('Failed to open'); }
  };

  const send = (e) => {
    e.preventDefault();
    if (!text.trim() || !active) return;
    const s = socket?.chat?.current;
    if (!s) return toast.error('Not connected');
    s.emit('chat:message', { chatId: active._id, text: text.trim() });
    // Optimistic append.
    setMessages((m) => [...m, { sender: { _id: user.id || user._id }, text: text.trim(), createdAt: new Date() }]);
    setText('');
  };

  const searchPeople = async (q) => {
    setQuery(q);
    if (q.trim().length < 2) return setPeople([]);
    try {
      const r = await searchApi.global({ q, type: 'faculty' });
      setPeople(r.data?.faculty || []);
    } catch { setPeople([]); }
  };

  const startDirect = async (f) => {
    try {
      const r = await chatApi.direct(f.user._id);
      setNewOpen(false); setQuery(''); setPeople([]);
      await loadConversations();
      openChat(r.data);
    } catch { toast.error('Failed to start chat'); }
  };

  const title = (c) => c.type === 'group' ? c.name : (c.participants || []).find((p) => (p._id !== (user.id || user._id)))?.name || 'Conversation';
  const myId = user?.id || user?._id;

  return (
    <div>
      <PageHeader title="Messages" subtitle="Department chat" actions={<button onClick={() => setNewOpen(true)} className="btn-primary text-xs"><Icon name="plus" className="w-4 h-4" />New Chat</button>} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4" style={{ minHeight: '70vh' }}>
        <Card className="lg:col-span-1 overflow-hidden" pad={false}>
          <div className="px-4 py-3 border-b border-slate-100 font-semibold text-sm">Conversations</div>
          {loading ? <Loading /> : conversations.length === 0 ? <EmptyState title="No conversations" hint="Start a new chat." /> : (
            <div className="divide-y divide-slate-100 max-h-[65vh] overflow-y-auto">
              {conversations.map((c) => (
                <button key={c._id} onClick={() => openChat(c)} className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 ${active?._id === c._id ? 'bg-brand-50' : ''}`}>
                  <Avatar name={title(c)} size="w-9 h-9" />
                  <div className="min-w-0">
                    <div className="font-medium text-sm truncate">{title(c)}</div>
                    <div className="text-xs text-slate-400">{c.type === 'group' ? 'Group' : 'Direct'}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </Card>

        <Card className="lg:col-span-2 flex flex-col" pad={false}>
          {!active ? <div className="flex-1 flex items-center justify-center"><EmptyState title="Select a conversation" hint="Choose a chat to start messaging." /></div> : (
            <>
              <div className="px-4 py-3 border-b border-slate-100 font-semibold text-sm flex items-center gap-2">
                <Avatar name={title(active)} size="w-8 h-8" />{title(active)}
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-2" style={{ maxHeight: '55vh' }}>
                {messages.map((m, i) => {
                  const mine = (m.sender?._id || m.sender) === myId;
                  return (
                    <div key={i} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${mine ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-700'}`}>
                        {m.text}
                        <div className={`text-[10px] mt-0.5 ${mine ? 'text-brand-100' : 'text-slate-400'}`}>{m.createdAt ? formatTime(m.createdAt) : ''}</div>
                      </div>
                    </div>
                  );
                })}
                {messages.length === 0 && <p className="text-center text-sm text-slate-400 py-8">No messages yet. Say hello!</p>}
                <div ref={bottomRef} />
              </div>
              <form onSubmit={send} className="border-t border-slate-100 p-3 flex gap-2">
                <input className="input" placeholder="Type a message…" value={text} onChange={(e) => setText(e.target.value)} />
                <button className="btn-primary" type="submit"><Icon name="send" className="w-4 h-4" /></button>
              </form>
            </>
          )}
        </Card>
      </div>

      <Modal open={newOpen} onClose={() => setNewOpen(false)} title="Start a Direct Chat">
        <input className="input mb-3" placeholder="Search faculty by name…" value={query} onChange={(e) => searchPeople(e.target.value)} />
        <div className="space-y-1 max-h-72 overflow-y-auto">
          {people.map((f) => (
            <button key={f._id} onClick={() => startDirect(f)} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-50 text-left">
              <Avatar name={f.user?.name} src={f.user?.avatar} size="w-8 h-8" />
              <span className="text-sm font-medium">{f.user?.name}</span>
            </button>
          ))}
          {query.length >= 2 && people.length === 0 && <p className="text-sm text-slate-400 text-center py-4">No matches</p>}
        </div>
      </Modal>
    </div>
  );
}
