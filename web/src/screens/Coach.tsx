export function Coach() {
  return (
    <>
      <header className="top">
        <h1>Photo coach</h1>
        <p className="sub">Not switched on yet</p>
      </header>
      <div className="callout warn">
        <b>This part needs a server</b>
        <p>Reading photos uses an AI vision model, which needs an API key kept on a server, not in the app. Nothing here sends a photo anywhere yet.</p>
      </div>
      <section className="card">
        <h2>Check my work</h2>
        <p className="sub">Photograph your knitting flat in daylight. The coach will mark dropped stitches, accidental purls and twisted joins, say which step you are on, and give one fix at a time.</p>
      </section>
      <section className="card">
        <h2>Knit from a photo</h2>
        <p className="sub">Show it an item you like. The coach names the item, stitch and construction, asks for your yarn and measurements, and fills one of the tested pattern templates. It will not invent stitch counts from a picture.</p>
      </section>
    </>
  )
}
