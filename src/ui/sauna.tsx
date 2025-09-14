import { useState } from 'react';
import { useSaunaStore } from '../sim/sauna';

export function Sauna() {
  const sauna = useSaunaStore((s) => s.sauna);
  const toggleRally = useSaunaStore((s) => s.toggleRally);
  const [open, setOpen] = useState(false);
  const seconds = Math.ceil(sauna.timer);
  return (
    <>
      <div
        style={{ position: 'absolute', top: 8, left: 8, cursor: 'pointer' }}
        onClick={() => setOpen((o) => !o)}
      >
        Sauna ♨️
      </div>
      {open && (
        <div
          style={{
            position: 'absolute',
            top: 40,
            left: 8,
            padding: 8,
            border: '1px solid #ccc',
            background: '#fff',
            color: '#000',
          }}
        >
          <h3>Sauna</h3>
          <div>Next in 00:{seconds.toString().padStart(2, '0')}</div>
          <label>
            <input type="checkbox" checked={sauna.rally} onChange={toggleRally} />
            Rally to Front
          </label>
        </div>
      )}
    </>
  );
}
