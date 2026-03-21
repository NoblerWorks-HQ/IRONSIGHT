'use client';

const ALLIANCES = {
  us_coalition: {
    label: 'US / WESTERN COALITION',
    color: 'var(--blue)',
    members: [
      { name: 'United States', role: 'Lead', forces: 'Navy (5th Fleet), Air Force, Special Ops' },
      { name: 'Israel', role: 'Primary Ally', forces: 'IDF, Iron Dome, Arrow-3, David\'s Sling' },
      { name: 'United Kingdom', role: 'Ally', forces: 'RAF, Royal Navy' },
      { name: 'Saudi Arabia', role: 'Regional Partner', forces: 'RSAF, Patriot systems' },
      { name: 'UAE', role: 'Regional Partner', forces: 'THAAD, hosting US forces' },
      { name: 'Bahrain', role: 'Host', forces: 'US Naval Forces Central Command' },
    ],
  },
  iran_axis: {
    label: 'IRAN / AXIS OF RESISTANCE',
    color: 'var(--red)',
    members: [
      { name: 'Iran', role: 'Lead', forces: 'IRGC, Shahed drones, ballistic missiles' },
      { name: 'Hezbollah (Lebanon)', role: 'Proxy', forces: '~150k rockets/missiles' },
      { name: 'Houthis (Yemen)', role: 'Proxy', forces: 'Anti-ship missiles, drones' },
      { name: 'Iraqi Militias (PMF)', role: 'Proxy', forces: 'Iran-backed Shia militias' },
      { name: 'Hamas (Gaza)', role: 'Proxy', forces: 'Rockets, tunnel network' },
      { name: 'Syria (Assad)', role: 'Ally', forces: 'IRGC presence, supply corridor' },
    ],
  },
};

export default function AllianceMap() {
  return (
    <div className="panel h-full flex flex-col">
      <div className="panel-header">
        <span className="status-dot" style={{ background: 'var(--purple)' }} />
        FORCE DISPOSITION & ALLIANCES
      </div>
      <div className="flex-1 overflow-y-auto">
        {Object.entries(ALLIANCES).map(([key, alliance]) => (
          <div key={key}>
            <div
              className="px-3 pt-2 pb-1 text-[9px] tracking-widest font-bold"
              style={{ color: alliance.color }}
            >
              {alliance.label}
            </div>
            {alliance.members.map((member, i) => (
              <div key={i} className="data-row">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-[11px] font-medium">{member.name}</span>
                  <span
                    className="text-[9px] px-1.5 py-0.5 rounded"
                    style={{
                      color: alliance.color,
                      backgroundColor: `${alliance.color}20`,
                    }}
                  >
                    {member.role}
                  </span>
                </div>
                <p className="text-[9px] text-[var(--text-secondary)]">{member.forces}</p>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
