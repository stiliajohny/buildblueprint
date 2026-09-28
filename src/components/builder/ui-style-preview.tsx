/** Local sample of a UI style. Colours here are examples, not the product palette. */
export function StylePreview({ styleId }: { styleId: string }) {
  if (styleId === "neumorphism") {
    return (
      <div className="style-preview neumorphism">
        <div className="raised">
          <strong>Account</strong>
          <p>Raised from the background.</p>
          <input aria-label="Email" placeholder="Email" />
          <button type="button">Save</button>
        </div>
      </div>
    );
  }
  if (styleId === "claymorphism") {
    return (
      <div className="style-preview claymorphism">
        <div className="clay">
          <strong>Today</strong>
          <p>Soft clay, with a double shadow.</p>
          <button type="button">Continue</button>
        </div>
      </div>
    );
  }
  if (styleId === "neobrutalism") {
    return (
      <div className="style-preview neobrutalism">
        <div className="brut">
          <strong>Launch</strong>
          <p>Hard edge. No blur.</p>
          <button type="button">Go</button>
        </div>
      </div>
    );
  }
  if (styleId === "bento") {
    return (
      <div className="style-preview bento">
        <div className="tile wide">
          <strong>Overview</strong>
          <p>The wide tile.</p>
        </div>
        <div className="tile tall">
          <strong>Tasks</strong>
          <p>3 open</p>
        </div>
        <div className="tile">
          <strong>Notes</strong>
        </div>
        <div className="tile">
          <strong>Files</strong>
        </div>
      </div>
    );
  }
  if (styleId === "classic-desktop") {
    return (
      <div className="style-preview classic-desktop">
        <div className="window">
          <strong>Save as</strong>
          <p>Raised button, sunken field.</p>
          <input aria-label="Name" placeholder="Name" />
          <button type="button">OK</button>
        </div>
      </div>
    );
  }
  if (styleId === "terminal") {
    return (
      <div className="style-preview terminal">
        <strong>session</strong>
        <p>$ status ready</p>
        <button type="button">run</button>
      </div>
    );
  }
  if (styleId === "editorial") {
    return (
      <div className="style-preview editorial">
        <strong>Field notes</strong>
        <p>A serif headline and a thin rule.</p>
        <button type="button">Read</button>
      </div>
    );
  }
  if (styleId === "brutalism") {
    return (
      <div className="style-preview brutalism">
        <strong>Index</strong>
        <p>
          A <span className="link">link</span>, a line, and nothing else.
        </p>
        <button type="button">Open</button>
      </div>
    );
  }
  if (styleId === "gloss") {
    return (
      <div className="style-preview gloss">
        <div className="shine">
          <strong>Play</strong>
          <p>A highlight painted on the control.</p>
          <button type="button">Start</button>
        </div>
      </div>
    );
  }
  if (styleId === "hand-drawn") {
    return (
      <div className="style-preview hand-drawn">
        <div className="sketch">
          <strong>Idea</strong>
          <p>An outline that is not quite straight.</p>
          <button type="button">Keep</button>
        </div>
      </div>
    );
  }
  if (styleId === "glassmorphism") {
    return (
      <div className="style-preview glassmorphism">
        <span className="orb orb-a" aria-hidden="true" />
        <span className="orb orb-b" aria-hidden="true" />
        <span className="orb orb-c" aria-hidden="true" />
        <div className="glass">
          <strong>Inbox</strong>
          <p>A frosted panel over colour.</p>
          <button type="button">Open</button>
        </div>
      </div>
    );
  }
  return (
    <div className="style-preview minimalism">
      <strong>Notes</strong>
      <p>Only the text that matters.</p>
      <button type="button">New note</button>
    </div>
  );
}
