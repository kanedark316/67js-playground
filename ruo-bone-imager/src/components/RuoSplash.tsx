import { useEffect, useRef } from 'react';

type Props = {
  scrolled: boolean;
  checked: boolean;
  onScroll: (complete: boolean) => void;
  onCheck: (value: boolean) => void;
  onContinue: () => void;
};

function noticeFullyRead(el: HTMLElement): boolean {
  if (el.scrollHeight <= el.clientHeight + 8) {
    return true;
  }
  return el.scrollTop + el.clientHeight >= el.scrollHeight - 8;
}

export function RuoSplash({
  scrolled,
  checked,
  onScroll,
  onCheck,
  onContinue,
}: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) {
      return undefined;
    }
    const sync = () => onScroll(noticeFullyRead(el));
    sync();
    const observer = new ResizeObserver(sync);
    observer.observe(el);
    window.addEventListener('resize', sync);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', sync);
    };
  }, [onScroll]);

  return (
    <section className="splash-hero" aria-label="Research use acknowledgment">
      <div className="splash-visual" aria-hidden="true" />
      <div className="splash-content">
        <p className="splash-kicker">Project Fixer · Track A</p>
        <h1>
          RUO Bone Imager
          <span>Cortical-interface ultrasound research on phantoms</span>
        </h1>
        <p className="support">
          Annotate fixture B-mode cine for PHANTOM-TIBIA-v1. Non-ionizing stubs
          only — no live probe drivers in this build.
        </p>

        <div className="splash-ack">
          <div
            className="scroll-box"
            ref={scrollRef}
            data-testid="ruo-notice-scroll"
            onScroll={(event) => {
              onScroll(noticeFullyRead(event.currentTarget));
            }}
          >
            <p>
              Intended use: research and investigational data collection on
              phantoms and approved protocols. The system may display
              reconstructed views and operator annotations of cortical interfaces
              and discontinuity candidates.
            </p>
            <p>
              Do not use outputs as the sole basis for clinical decisions. Do not
              configure or connect ionizing radiation sources through this
              software. Live ultrasound probe drivers and microwave hardware are
              out of scope for this Phase-1 shell (fixtures and stubs only).
            </p>
            <p>
              Preferred language: cortical interface, periosteal line,
              discontinuity candidate, research finding, operator annotation.
              Avoid clinical rule-out or confirmation wording in the viewer.
            </p>
            <p>
              Phantom protocol reference: PHANTOM-TIBIA-v1. Optional dual-mod
              meta: DUAL-MW-US-E3-v1.
            </p>
            <p>
              By continuing you confirm you will keep the RESEARCH USE ONLY
              banner visible and will not present this tool as a diagnostic
              product.
            </p>
          </div>
          {!scrolled ? (
            <div className="btn-row" style={{ marginTop: '0.75rem' }}>
              <button
                type="button"
                className="ghost"
                data-testid="ruo-mark-notice-read"
                onClick={() => {
                  const el = scrollRef.current;
                  if (el) {
                    el.scrollTop = el.scrollHeight;
                  }
                  onScroll(true);
                }}
              >
                Mark notice as read
              </button>
            </div>
          ) : null}
          <label className="check-row">
            <input
              type="checkbox"
              checked={checked}
              disabled={!scrolled}
              data-testid="ruo-ack-checkbox"
              onChange={(event) => onCheck(event.target.checked)}
            />
            <span>
              I acknowledge Research Use Only limits
              {!scrolled ? ' (read the notice first)' : ''}
            </span>
          </label>
          <div className="btn-row">
            <button
              type="button"
              className="primary"
              disabled={!scrolled || !checked}
              data-testid="ruo-start-session"
              onClick={onContinue}
            >
              Start research session
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
