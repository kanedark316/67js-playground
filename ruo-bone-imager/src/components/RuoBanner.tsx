import { RUO_BANNER_LINES } from '../claim-lint/forbiddenPhrases.ts';

export function RuoBanner() {
  return (
    <div className="ruo-banner" role="status" aria-live="polite" data-testid="ruo-banner">
      <strong>{RUO_BANNER_LINES[0]}</strong>
      <span>{RUO_BANNER_LINES[1]}</span>
    </div>
  );
}
