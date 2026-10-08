import { Fragment } from 'react'

// Just enough Markdown for the legal pages: headings, paragraphs, bullet lists, **bold** and [links](url).
function inline(text, keyPrefix) {
  const parts = []
  const pattern = /\*\*(.+?)\*\*|\[([^\]]+)\]\(([^)]+)\)/g
  let last = 0
  let match
  while ((match = pattern.exec(text))) {
    if (match.index > last) parts.push(text.slice(last, match.index))
    if (match[1]) parts.push(<strong key={`${keyPrefix}-${match.index}`}>{match[1]}</strong>)
    else parts.push(<a key={`${keyPrefix}-${match.index}`} href={match[3]}>{match[2]}</a>)
    last = match.index + match[0].length
  }
  if (last < text.length) parts.push(text.slice(last))
  return parts
}

export function Markdown({ source }) {
  const blocks = []
  let list = null
  let paragraph = []
  const flush = () => {
    if (paragraph.length) blocks.push({ type: 'p', lines: paragraph })
    paragraph = []
    if (list) blocks.push({ type: 'ul', items: list })
    list = null
  }
  for (const raw of source.split('\n')) {
    const line = raw.trimEnd()
    if (!line.trim()) {
      flush()
      continue
    }
    const heading = /^(#{1,3})\s+(.*)$/.exec(line)
    if (heading) {
      flush()
      blocks.push({ type: `h${heading[1].length}`, text: heading[2] })
      continue
    }
    const item = /^\s*-\s+(.*)$/.exec(line)
    if (item) {
      if (paragraph.length) {
        blocks.push({ type: 'p', lines: paragraph })
        paragraph = []
      }
      list = list || []
      list.push(item[1])
      continue
    }
    if (list) flush()
    paragraph.push(line)
  }
  flush()

  return (
    <div className="markdown">
      {blocks.map((block, i) => {
        if (block.type === 'ul') {
          return (
            <ul key={i}>
              {block.items.map((text, j) => (
                <li key={j}>{inline(text, `${i}-${j}`)}</li>
              ))}
            </ul>
          )
        }
        if (block.type === 'p') {
          return (
            <p key={i}>
              {block.lines.map((text, j) => (
                <Fragment key={j}>
                  {j > 0 && <br />}
                  {inline(text, `${i}-${j}`)}
                </Fragment>
              ))}
            </p>
          )
        }
        const Tag = block.type
        return <Tag key={i}>{inline(block.text, `${i}`)}</Tag>
      })}
    </div>
  )
}
