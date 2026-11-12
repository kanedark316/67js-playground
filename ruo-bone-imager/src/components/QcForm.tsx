import type { QcForm as QcFormState } from '../session/types.ts';

type Props = {
  qc: QcFormState;
  onChange: (next: QcFormState) => void;
};

function BoolToggle({
  label,
  value,
  onPick,
}: {
  label: string;
  value: boolean | null;
  onPick: (v: boolean) => void;
}) {
  return (
    <div>
      <div className="muted">{label}</div>
      <div className="qc-bool btn-row" style={{ marginTop: 0 }}>
        <button
          type="button"
          className={`secondary ${value === true ? 'selected' : ''}`}
          onClick={() => onPick(true)}
        >
          Yes
        </button>
        <button
          type="button"
          className={`secondary ${value === false ? 'selected' : ''}`}
          onClick={() => onPick(false)}
        >
          No
        </button>
      </div>
    </div>
  );
}

export function QcForm({ qc, onChange }: Props) {
  return (
    <section className="panel">
      <h2>QC form (S2)</h2>
      <p className="muted">
        Operator checklist for coupling, landmark visibility, and motion. Scores are
        research QC only — not a clinical finding.
      </p>
      <div className="field-grid">
        <BoolToggle
          label="Coupling OK?"
          value={qc.coupling_ok}
          onPick={(v) => onChange({ ...qc, coupling_ok: v })}
        />
        <BoolToggle
          label="Landmark visible?"
          value={qc.landmark_visible}
          onPick={(v) => onChange({ ...qc, landmark_visible: v })}
        />
        <BoolToggle
          label="Motion acceptable?"
          value={qc.motion_acceptable}
          onPick={(v) => onChange({ ...qc, motion_acceptable: v })}
        />
        <label>
          cortical_line_qc
          <select
            value={qc.cortical_line_qc ?? ''}
            onChange={(e) =>
              onChange({
                ...qc,
                cortical_line_qc:
                  (e.target.value || null) as QcFormState['cortical_line_qc'],
              })
            }
          >
            <option value="">unset</option>
            <option value="good">good</option>
            <option value="fair">fair</option>
            <option value="poor">poor</option>
          </select>
        </label>
        <label style={{ gridColumn: '1 / -1' }}>
          notes
          <textarea
            value={qc.notes}
            onChange={(e) => onChange({ ...qc, notes: e.target.value })}
            placeholder="Coupling, landmark, motion notes"
          />
        </label>
      </div>
    </section>
  );
}
