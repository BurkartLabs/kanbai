export type Bands = {
  backlog: number;
  inProgress: number;
  /** Omit for a board tracked only here, whose cards have no review column. */
  inReview?: number;
  done: number;
};

export function DistBar({ bands }: { bands: Bands }) {
  const inReview = bands.inReview ?? 0;
  const total = bands.backlog + bands.inProgress + inReview + bands.done;
  const pct = (n: number) => `${total === 0 ? 0 : (n / total) * 100}%`;
  const hasReview = bands.inReview !== undefined;

  return (
    <>
      <div
        className="dist-bar"
        role="img"
        aria-label={`${bands.backlog} backlog, ${bands.inProgress} in progress, ${
          hasReview ? `${inReview} in review, ` : ''
        }${bands.done} done`}
      >
        <span style={{ width: pct(bands.backlog), background: 'var(--backlog)' }} />
        <span style={{ width: pct(bands.inProgress), background: 'var(--indigo)' }} />
        {hasReview && <span style={{ width: pct(inReview), background: 'var(--amber)' }} />}
        <span style={{ width: pct(bands.done), background: 'var(--forest)' }} />
      </div>
      <div className="dist-key">
        <span>{bands.backlog} backlog</span>
        <span>{bands.inProgress} active</span>
        {hasReview && <span>{inReview} review</span>}
        <span>{bands.done} done</span>
      </div>
    </>
  );
}
