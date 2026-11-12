import {
  DEFAULT_DUAL_MOD_ID,
  DEFAULT_PROTOCOL_ID,
} from '../session/sampleSession.ts';
import type {
  Laterality,
  Modality,
  ReferenceImaging,
  SessionMeta,
} from '../session/types.ts';

type Props = {
  meta: SessionMeta;
  onChange: (next: SessionMeta) => void;
  onNewSession: () => void;
  gateErrors: string[];
};

export function SessionForm({ meta, onChange, onNewSession, gateErrors }: Props) {
  function patch<K extends keyof SessionMeta>(key: K, value: SessionMeta[K]) {
    onChange({ ...meta, [key]: value });
  }

  return (
    <section className="panel">
      <h2>Session metadata (S0)</h2>
      <div className="field-grid">
        <label>
          session_id
          <input value={meta.session_id} readOnly />
        </label>
        <label>
          protocol_id
          <input
            value={meta.protocol_id}
            onChange={(e) => patch('protocol_id', e.target.value || DEFAULT_PROTOCOL_ID)}
            list="protocol-options"
          />
          <datalist id="protocol-options">
            <option value={DEFAULT_PROTOCOL_ID} />
            <option value="PHANTOM-RADIUS-ULNA-v1" />
          </datalist>
        </label>
        <label>
          dual_mod_id (optional)
          <input
            value={meta.dual_mod_id ?? ''}
            placeholder="leave empty or set DUAL-MW-US-E3-v1"
            onChange={(e) =>
              patch('dual_mod_id', e.target.value.trim() ? e.target.value.trim() : undefined)
            }
            list="dual-mod-options"
          />
          <datalist id="dual-mod-options">
            <option value={DEFAULT_DUAL_MOD_ID} />
          </datalist>
        </label>
        <label>
          modality
          <select
            value={meta.modality}
            onChange={(e) => patch('modality', e.target.value as Modality)}
          >
            <option value="us_bone_interface">us_bone_interface</option>
            <option value="us_qus">us_qus</option>
            <option value="mw_radar">mw_radar</option>
            <option value="hybrid">hybrid</option>
          </select>
        </label>
        <label>
          anatomical_site
          <input
            value={meta.anatomical_site}
            onChange={(e) => patch('anatomical_site', e.target.value)}
          />
        </label>
        <label>
          laterality
          <select
            value={meta.laterality}
            onChange={(e) => patch('laterality', e.target.value as Laterality)}
          >
            <option value="NA">NA</option>
            <option value="L">L</option>
            <option value="R">R</option>
          </select>
        </label>
        <label>
          subject_id
          <input
            value={meta.subject_id}
            onChange={(e) => patch('subject_id', e.target.value)}
          />
        </label>
        <label>
          operator_id
          <input
            value={meta.operator_id}
            onChange={(e) => patch('operator_id', e.target.value)}
          />
        </label>
        <label>
          acoustic_or_rf_budget_id
          <input
            value={meta.acoustic_or_rf_budget_id}
            onChange={(e) => patch('acoustic_or_rf_budget_id', e.target.value)}
          />
        </label>
        <label>
          reference_imaging
          <select
            value={meta.reference_imaging}
            onChange={(e) =>
              patch('reference_imaging', e.target.value as ReferenceImaging)
            }
          >
            <option value="none">none</option>
            <option value="xray_pending">xray_pending</option>
            <option value="xray_available_not_linked">xray_available_not_linked</option>
          </select>
        </label>
        <label>
          phantom_serial
          <input
            value={meta.phantom_serial ?? ''}
            onChange={(e) => patch('phantom_serial', e.target.value)}
          />
        </label>
      </div>
      {gateErrors.length > 0 ? (
        <div className="error" role="alert">
          Capture gated until metadata is complete:
          <ul>
            {gateErrors.map((err) => (
              <li key={err}>{err}</li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="muted">Metadata gate clear — annotation and export enabled.</p>
      )}
      <div className="btn-row">
        <button type="button" className="secondary" onClick={onNewSession}>
          Create new session
        </button>
      </div>
    </section>
  );
}
