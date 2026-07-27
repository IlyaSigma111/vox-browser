import { useStore } from '../store'

export default function HintOverlay() {
  const vimMode = useStore(s => s.vimMode)
  const active = useStore(s => s.tabs.find(t => t.id === s.activeId))
  const hasWv = active?.url && active.url !== 'about:blank'

  if (vimMode === 'normal') return null

  return (
    <div className="hint-bar">
      <span className="hint-label">{vimMode === 'hint' ? 'HINT' : vimMode === 'insert' ? 'INSERT' : 'CMD'}</span>
      <span className="hint-val">
        {vimMode === 'hint' ? (hasWv ? 'type to select (Esc to cancel)' : 'no active page')
          : vimMode === 'insert' ? 'Esc to exit insert mode'
          : ''}
      </span>
    </div>
  )
}
