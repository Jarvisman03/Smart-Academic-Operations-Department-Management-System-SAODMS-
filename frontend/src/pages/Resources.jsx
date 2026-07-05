import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { PageHeader, Card, Loading, EmptyState, StatCard, Tabs, Table, Badge, Modal, Field, ConfirmDialog, IconButton, Icon } from '../components/ui';
import FloorMap from '../components/dashboard/FloorMap';
import { roomApi, buildingApi, floorApi, labApi, bookingApi, maintenanceApi } from '../api/endpoints';
import { useAuth } from '../context/AuthContext';
import { formatDate } from '../utils/format';

const roomBlank = { roomNumber: '', name: '', floor: '', type: 'classroom', capacity: 60, hasProjector: false, hasAC: false };
const bookingBlank = { room: '', date: '', startTime: '', endTime: '', purpose: '' };
const maintBlank = { room: '', title: '', description: '', priority: 'medium' };

export default function Resources() {
  const { departmentId, hasPermission } = useAuth();
  const canManage = hasPermission('resource:manage');
  const canBook = hasPermission('resource:book');
  const [building, setBuilding] = useState(null);
  const [map, setMap] = useState(null);
  const [floors, setFloors] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [labs, setLabs] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [availability, setAvailability] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('map');

  const [roomModal, setRoomModal] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [roomForm, setRoomForm] = useState(roomBlank);
  const [bookModal, setBookModal] = useState(false);
  const [bookForm, setBookForm] = useState(bookingBlank);
  const [maintModal, setMaintModal] = useState(false);
  const [maintForm, setMaintForm] = useState(maintBlank);
  const [confirm, setConfirm] = useState(null);
  const [saving, setSaving] = useState(false);

  const loadAll = async (bid) => {
    const [m, av, fl, rm, lb, bk] = await Promise.all([
      roomApi.map(bid), roomApi.availability({ building: bid }),
      floorApi.list({ building: bid }), roomApi.list({ building: bid }),
      labApi.list(), bookingApi.list().catch(() => ({ data: [] })),
    ]);
    setMap(m.data); setAvailability(av.data.summary); setFloors(fl.data);
    setRooms(rm.data); setLabs(lb.data); setBookings(bk.data);
  };

  const boot = async () => {
    setLoading(true);
    try {
      const buildings = await buildingApi.list();
      if (buildings.data?.length) { setBuilding(buildings.data[0]); await loadAll(buildings.data[0]._id); }
    } finally { setLoading(false); }
  };
  useEffect(() => { boot(); /* eslint-disable-next-line */ }, []);
  const refresh = () => building && loadAll(building._id);

  const openRoomCreate = () => { setEditingRoom(null); setRoomForm(roomBlank); setRoomModal(true); };
  const openRoomEdit = (r) => {
    setEditingRoom(r);
    setRoomForm({ roomNumber: r.roomNumber, name: r.name || '', floor: r.floor?._id || r.floor || '', type: r.type, capacity: r.capacity, hasProjector: r.hasProjector, hasAC: r.hasAC });
    setRoomModal(true);
  };
  const saveRoom = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const fl = floors.find((f) => f._id === roomForm.floor);
      const payload = { ...roomForm, capacity: Number(roomForm.capacity), building: building._id, floorNumber: fl?.number };
      if (editingRoom) { await roomApi.update(editingRoom._id, payload); toast.success('Room updated'); }
      else { await roomApi.create(payload); toast.success('Room created'); }
      setRoomModal(false); refresh();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const book = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await bookingApi.create({ ...bookForm, ...(departmentId && { department: departmentId }) });
      toast.success('Room booked'); setBookModal(false); setBookForm(bookingBlank); refresh();
    } catch (err) { toast.error(err.response?.data?.message || 'Booking failed'); }
    finally { setSaving(false); }
  };

  const reportMaint = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await maintenanceApi.create(maintForm);
      toast.success('Issue reported'); setMaintModal(false); setMaintForm(maintBlank); refresh();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const cancelBooking = async (b) => {
    try { await bookingApi.remove(b._id); toast.success('Booking cancelled'); refresh(); } catch { toast.error('Failed'); }
  };
  const setBookingStatus = async (b, status) => {
    try { await bookingApi.setStatus(b._id, status); toast.success(`Booking ${status}`); refresh(); } catch { toast.error('Failed'); }
  };

  const removeRoom = async () => {
    try { await roomApi.remove(confirm._id); toast.success('Room deleted'); setConfirm(null); refresh(); } catch { toast.error('Failed'); }
  };

  if (loading) return <div><PageHeader title="Resource Management" /><Loading /></div>;

  const roomColumns = [
    { key: 'roomNumber', label: 'Room', render: (r) => <span className="font-medium">{r.roomNumber}{r.name ? ` · ${r.name}` : ''}</span> },
    { key: 'type', label: 'Type', render: (r) => <Badge className="bg-slate-100 text-slate-600 capitalize">{r.type}</Badge> },
    { key: 'floor', label: 'Floor', render: (r) => r.floorNumber },
    { key: 'capacity', label: 'Capacity' },
    { key: 'features', label: 'Features', render: (r) => [r.hasProjector && 'Projector', r.hasAC && 'AC'].filter(Boolean).join(', ') || '—' },
    { key: 'status', label: 'Status', render: (r) => <Badge className="bg-slate-100 text-slate-600 capitalize">{r.liveStatus?.status || r.status}</Badge> },
    ...(canManage ? [{ key: 'actions', label: '', render: (r) => (
      <div className="flex items-center justify-end gap-0.5">
        <IconButton icon="edit" label="Edit" tone="brand" onClick={() => openRoomEdit(r)} />
        <IconButton icon="trash" label="Delete" tone="rose" onClick={() => setConfirm(r)} />
      </div>
    ) }] : []),
  ];

  const bookingColumns = [
    { key: 'room', label: 'Room', render: (b) => b.room?.roomNumber || '—' },
    { key: 'purpose', label: 'Purpose' },
    { key: 'by', label: 'Booked by', render: (b) => b.bookedBy?.name || '—' },
    { key: 'date', label: 'Date', render: (b) => formatDate(b.date) },
    { key: 'time', label: 'Time', render: (b) => `${b.startTime}-${b.endTime}` },
    { key: 'status', label: 'Status', render: (b) => <Badge className={b.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : b.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}>{b.status}</Badge> },
    { key: 'actions', label: '', render: (b) => (
      <div className="flex items-center justify-end gap-0.5">
        {canManage && b.status === 'pending' && <IconButton icon="check" label="Approve" tone="emerald" onClick={() => setBookingStatus(b, 'approved')} />}
        {b.status !== 'cancelled' && <IconButton icon="ban" label="Cancel" tone="rose" onClick={() => cancelBooking(b)} />}
      </div>
    ) },
  ];

  const roomOptions = rooms.map((r) => <option key={r._id} value={r._id}>{r.roomNumber}{r.name ? ` · ${r.name}` : ''}</option>);

  return (
    <div>
      <PageHeader
        title="Resource Management"
        subtitle="Buildings, floors, rooms, labs and bookings"
        actions={(
          <div className="flex gap-2">
            {canBook && <button onClick={() => setBookModal(true)} className="btn-ghost text-xs"><Icon name="calendar" className="w-4 h-4" />Book Room</button>}
            <button onClick={() => setMaintModal(true)} className="btn-ghost text-xs"><Icon name="alert" className="w-4 h-4" />Report Issue</button>
            {canManage && <button onClick={openRoomCreate} className="btn-primary text-xs"><Icon name="plus" className="w-4 h-4" />Add Room</button>}
          </div>
        )}
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <StatCard label="Occupied" value={availability?.occupied ?? 0} tone="emerald" icon="building" />
        <StatCard label="Free" value={availability?.free ?? 0} tone="slate" icon="building" />
        <StatCard label="Reserved" value={availability?.reserved ?? 0} tone="amber" icon="building" />
        <StatCard label="Maintenance" value={availability?.maintenance ?? 0} tone="rose" icon="building" />
      </div>

      <Tabs
        tabs={[{ id: 'map', label: 'Floor Map' }, { id: 'rooms', label: 'Rooms' }, { id: 'labs', label: 'Labs' }, { id: 'bookings', label: 'Bookings' }]}
        active={tab}
        onChange={setTab}
      />

      {tab === 'map' && map && (
        <Card>
          <span className="section-title">{map.building?.name} · Building Layout</span>
          <div className="mt-4"><FloorMap floors={map.floors} onRoomClick={(r) => toast(`${r.roomNumber}: ${r.liveStatus?.status || r.status}`)} /></div>
        </Card>
      )}

      {tab === 'rooms' && <Card><Table columns={roomColumns} rows={rooms} empty="No rooms" /></Card>}

      {tab === 'labs' && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {labs.length === 0 ? <Card><EmptyState title="No labs" /></Card> : labs.map((lab) => (
            <Card key={lab._id}>
              <div className="font-semibold text-slate-800">{lab.name}</div>
              <div className="text-xs text-slate-500 mt-0.5">Room {lab.room?.roomNumber} · {lab.specialization}</div>
              <div className="mt-2 text-sm text-slate-600">Systems: {lab.workingSystems}/{lab.systemsCount}</div>
              <div className="mt-1"><span className={`badge ${lab.equipmentStatus === 'operational' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{lab.equipmentStatus}</span></div>
            </Card>
          ))}
        </div>
      )}

      {tab === 'bookings' && <Card><Table columns={bookingColumns} rows={bookings} empty="No bookings" /></Card>}

      <Modal open={roomModal} onClose={() => setRoomModal(false)} title={editingRoom ? 'Edit Room' : 'Add Room'}>
        <form onSubmit={saveRoom} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Room Number" value={roomForm.roomNumber} onChange={(e) => setRoomForm({ ...roomForm, roomNumber: e.target.value })} required />
            <Field label="Name" value={roomForm.name} onChange={(e) => setRoomForm({ ...roomForm, name: e.target.value })} />
            <Field label="Floor" as="select" value={roomForm.floor} onChange={(e) => setRoomForm({ ...roomForm, floor: e.target.value })} required>
              <option value="">Select floor</option>
              {floors.map((f) => <option key={f._id} value={f._id}>{f.name || `Floor ${f.number}`}</option>)}
            </Field>
            <Field label="Type" as="select" value={roomForm.type} onChange={(e) => setRoomForm({ ...roomForm, type: e.target.value })}>
              <option value="classroom">Classroom</option><option value="lab">Lab</option><option value="seminar">Seminar</option><option value="office">Office</option>
            </Field>
            <Field label="Capacity" type="number" value={roomForm.capacity} onChange={(e) => setRoomForm({ ...roomForm, capacity: e.target.value })} />
          </div>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={roomForm.hasProjector} onChange={(e) => setRoomForm({ ...roomForm, hasProjector: e.target.checked })} /> Projector</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={roomForm.hasAC} onChange={(e) => setRoomForm({ ...roomForm, hasAC: e.target.checked })} /> AC</label>
          </div>
          <button className="btn-primary w-full" disabled={saving}>{saving ? 'Saving…' : editingRoom ? 'Save Changes' : 'Create Room'}</button>
        </form>
      </Modal>

      <Modal open={bookModal} onClose={() => setBookModal(false)} title="Book a Room">
        <form onSubmit={book} className="space-y-3">
          <Field label="Room" as="select" value={bookForm.room} onChange={(e) => setBookForm({ ...bookForm, room: e.target.value })} required>
            <option value="">Select room</option>{roomOptions}
          </Field>
          <Field label="Purpose" value={bookForm.purpose} onChange={(e) => setBookForm({ ...bookForm, purpose: e.target.value })} required />
          <div className="grid grid-cols-3 gap-3">
            <Field label="Date" type="date" value={bookForm.date} onChange={(e) => setBookForm({ ...bookForm, date: e.target.value })} required />
            <Field label="Start" type="time" value={bookForm.startTime} onChange={(e) => setBookForm({ ...bookForm, startTime: e.target.value })} required />
            <Field label="End" type="time" value={bookForm.endTime} onChange={(e) => setBookForm({ ...bookForm, endTime: e.target.value })} required />
          </div>
          <button className="btn-primary w-full" disabled={saving}>{saving ? 'Booking…' : 'Book Room'}</button>
        </form>
      </Modal>

      <Modal open={maintModal} onClose={() => setMaintModal(false)} title="Report Maintenance Issue">
        <form onSubmit={reportMaint} className="space-y-3">
          <Field label="Room" as="select" value={maintForm.room} onChange={(e) => setMaintForm({ ...maintForm, room: e.target.value })} required>
            <option value="">Select room</option>{roomOptions}
          </Field>
          <Field label="Issue Title" value={maintForm.title} onChange={(e) => setMaintForm({ ...maintForm, title: e.target.value })} required />
          <Field label="Description" as="textarea" rows={2} value={maintForm.description} onChange={(e) => setMaintForm({ ...maintForm, description: e.target.value })} />
          <Field label="Priority" as="select" value={maintForm.priority} onChange={(e) => setMaintForm({ ...maintForm, priority: e.target.value })}>
            <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="urgent">Urgent</option>
          </Field>
          <button className="btn-primary w-full" disabled={saving}>{saving ? 'Reporting…' : 'Report Issue'}</button>
        </form>
      </Modal>

      <ConfirmDialog open={!!confirm} onClose={() => setConfirm(null)} onConfirm={removeRoom} title="Delete room?" message={`Room ${confirm?.roomNumber} will be removed.`} confirmLabel="Delete" />
    </div>
  );
}
