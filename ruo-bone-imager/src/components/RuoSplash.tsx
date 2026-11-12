type Props = {
  scrolled: boolean;
  checked: boolean;
  onScroll: (complete: boolean) => void;
  onCheck: (value: boolean) => void;
  onContinue: () => void;
};

export function RuoSplash({
  scrolled,
  checked,
  onScroll,
  onCheck,
  onContinue,
}: Props) {
  return (
    <section className="panel splash">
      <h2>Acknowledge research use</h2>
      <p className="muted">
        This application acquires and annotates non-ionizing bone-interface sensor
        data for research protocols only. It is not a cleared diagnostic device.
      </p>
      <div
        className="scroll-box"
        onScroll={(event) => {
          const el = event.currentTarget;
          const complete = el.scrollTop + el.clientHeight >= el.scrollHeight - 8;
          onScroll(complete);
        }}
      >
        <p>
          Intended use: research and investigational data collection on phantoms
          and approved protocols. The system may display reconstructed views and
          operator annotations of cortical interfaces and discontinuity candidates.
        </p>
        <p>
          Do not use outputs as the sole basis for clinical decisions. Do not
          configure or connect ionizing radiation sources through this software.
          Live ultrasound probe drivers and microwave hardware are out of scope
          for this Phase-1 shell (fixtures and stubs only).
        </p>
        <p>
          Preferred language: cortical interface, periosteal line, discontinuity
          candidate, research finding, operator annotation. Avoid clinical rule-out
          or confirmation wording in the viewer.
        </p>
        <p>
          Phantom protocol reference: PHANTOM-TIBIA-v1 (Project docs:
          phantom-tibia-v1-spec.md). Optional dual-mod meta: DUAL-MW-US-E3-v1.
        </p>
        <p>
          By continuing you confirm you will keep the RESEARCH USE ONLY banner
          visible and will not present this tool as a diagnostic product.
        </p>
      </div>
      <label style={{ marginTop: '0.85rem', flexDirection: 'row', alignItems: 'center', gap: '0.5rem' }}>
        <input
          type="checkbox"
          checked={checked}
          disabled={!scrolled}
          onChange={(event) => onCheck(event.target.checked)}
        />
        <span>
          I acknowledge Research Use Only limits
          {!scrolled ? ' (scroll the notice first)' : ''}
        </span>
      </label>
      <div className="btn-row">
        <button
          type="button"
          className="primary"
          disabled={!scrolled || !checked}
          onClick={onContinue}
        >
          Open research workspace
        </button>
      </div>
    </section>
  );
}
