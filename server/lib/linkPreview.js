// Link previews (Open Graph) for shared pages: the single-page app has one generic <head>, so the
// server fills in a page-specific title and description before sending it.
const escape = (text) =>
  String(text).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])

export function challengePreviewHtml(shell, challenge, url) {
  const title = `${challenge.name}'s film challenge · How connected is your taste?`
  const description = `Rate the same ${challenge.films.length} films ${challenge.name} rated for ReelMates Daily #${challenge.number}: liked, didn't, or haven't seen. Then see how connected you are.`
  const tags = [
    `<title>${escape(title)}</title>`,
    `<meta name="description" content="${escape(description)}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="ReelMates" />`,
    `<meta property="og:title" content="${escape(title)}" />`,
    `<meta property="og:description" content="${escape(description)}" />`,
    `<meta property="og:url" content="${escape(url)}" />`,
    `<meta name="twitter:card" content="summary" />`
  ].join('\n    ')
  return shell
    .replace(/<title>[\s\S]*?<\/title>/, '')
    .replace(/<meta name="description"[^>]*>/, '')
    .replace('</head>', `    ${tags}\n  </head>`)
}
