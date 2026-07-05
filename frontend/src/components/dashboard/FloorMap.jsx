import { roomStatusMeta } from '../../utils/format';

// Visual 4-floor building layout with color-coded room tiles.
export default function FloorMap({ floors, onRoomClick }) {
  return (
    <div className="space-y-4">
      {[...floors].reverse().map(({ floor, rooms }) => (
        <div key={floor._id} className="flex gap-3">
          <div className="w-20 shrink-0 flex flex-col items-center justify-center bg-slate-100 rounded-lg py-2">
            <div className="text-lg font-bold text-slate-700">F{floor.number}</div>
            <div className="text-[10px] text-slate-400 text-center">{floor.name}</div>
          </div>
          <div className="flex-1 grid grid-cols-3 sm:grid-cols-5 gap-2">
            {rooms.map((room) => {
              const meta = roomStatusMeta[room.liveStatus?.status || room.status] || roomStatusMeta.free;
              return (
                <button
                  key={room._id}
                  onClick={() => onRoomClick?.(room)}
                  className={`rounded-lg px-2 py-2.5 text-left transition hover:ring-2 hover:ring-brand-300 ${meta.color} ${meta.text}`}
                  title={`${room.roomNumber} · ${meta.label}`}
                >
                  <div className="text-sm font-bold">{room.roomNumber}</div>
                  <div className="text-[10px] opacity-90 truncate">
                    {room.type === 'lab' ? 'Lab' : 'Room'}
                    {room.liveStatus?.subject ? ` · ${room.liveStatus.subject}` : ''}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ))}
      <div className="flex flex-wrap gap-3 pt-2 text-xs">
        {Object.entries(roomStatusMeta).map(([k, v]) => (
          <span key={k} className="flex items-center gap-1.5">
            <span className={`w-3 h-3 rounded ${v.color}`} /> {v.label}
          </span>
        ))}
      </div>
    </div>
  );
}
