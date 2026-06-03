import type { FC } from 'react'
import { useEffect, useRef } from 'react'
import { FitAddon } from '@xterm/addon-fit'
import { Terminal } from '@xterm/xterm'
import '@xterm/xterm/css/xterm.css'

interface TerminalViewProps {
  onResize?: (cols: number, rows: number) => void
}

export const TerminalView: FC<TerminalViewProps> = ({ onResize }) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const onResizeRef = useRef(onResize)

  useEffect(() => {
    onResizeRef.current = onResize
  }, [onResize])

  useEffect(() => {
    if (!containerRef.current) {
      return
    }

    const terminal = new Terminal({
      cursorBlink: true,
      fontSize: 14,
      fontFamily: 'Consolas, Monaco, "Courier New", monospace',
      theme: {
        background: '#1e1e1e',
        foreground: '#ffffff',
        cursor: '#00d2ff'
      }
    })

    const fitAddon = new FitAddon()
    terminal.loadAddon(fitAddon)
    terminal.open(containerRef.current)

    const unsubscribe = window.api.onClaudeOutput((data: string) => {
      terminal.write(data)
    })

    const keySubscription = terminal.onData((data: string) => {
      window.api.sendSessionInput(data)
    })

    const resizeObserver = new ResizeObserver(() => {
      try {
        fitAddon.fit()
        onResizeRef.current?.(terminal.cols, terminal.rows)
      } catch (error) {
        console.error('Fit error on resize:', error)
      }
    })

    resizeObserver.observe(containerRef.current)

    void document.fonts.ready.then(() => {
      try {
        fitAddon.fit()
        onResizeRef.current?.(terminal.cols, terminal.rows)
      } catch (error) {
        console.error('Fit error on fonts ready:', error)
      }
    })

    return (): void => {
      unsubscribe()
      keySubscription.dispose()
      resizeObserver.disconnect()
      terminal.dispose()
    }
  }, [])

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: '#1e1e1e',
        padding: '8px',
        boxSizing: 'border-box'
      }}
    >
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
    </div>
  )
}
