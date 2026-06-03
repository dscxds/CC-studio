import type { FC } from 'react'
import { useEffect, useState } from 'react'
import { diffLines, type Change } from 'diff'

interface DiffModalProps {
  projectPath: string
  taskId: string
  relativeFilePath: string
  onClose: () => void
  onRollbackFile: () => void
}

export const DiffModal: FC<DiffModalProps> = ({
  projectPath,
  taskId,
  relativeFilePath,
  onClose,
  onRollbackFile
}) => {
  const [diffChanges, setDiffChanges] = useState<Change[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function loadContent(): Promise<void> {
      setLoading(true)

      try {
        const fullPath = `${projectPath}/${relativeFilePath}`
        const currentContent = await window.api.getFileContent(fullPath)
        const originalContent = await window.api.readSnapshotContent(taskId, relativeFilePath)
        const nextDiff = diffLines(originalContent || '', currentContent || '')

        if (!cancelled) {
          setDiffChanges(nextDiff)
        }
      } catch (error) {
        console.error('Failed to calculate diff:', error)
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void loadContent()

    return (): void => {
      cancelled = true
    }
  }, [projectPath, relativeFilePath, taskId])

  function handleRollback(): void {
    if (window.confirm(`Rollback ${relativeFilePath} to the task baseline?`)) {
      onRollbackFile()
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99999,
        padding: '40px'
      }}
    >
      <div
        style={{
          background: '#121214',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '12px',
          width: '850px',
          maxWidth: '100%',
          height: '80vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)'
        }}
      >
        <div
          style={{
            padding: '16px 24px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <div>
            <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: '#f4f4f5' }}>
              File Diff
            </h4>
            <span style={{ fontSize: '11px', color: '#71717a', fontFamily: 'monospace' }}>
              {relativeFilePath}
            </span>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={handleRollback}
              style={{
                padding: '6px 14px',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                color: '#f87171',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 600
              }}
            >
              Roll Back File
            </button>
            <button
              onClick={onClose}
              style={{
                padding: '6px 14px',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#fff',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              Close
            </button>
          </div>
        </div>

        <div
          style={{
            flex: 1,
            overflow: 'auto',
            padding: '20px',
            background: '#09090b',
            fontFamily: 'Consolas, Monaco, monospace',
            fontSize: '13px',
            lineHeight: '1.5'
          }}
        >
          {loading ? (
            <div
              style={{
                display: 'flex',
                height: '100%',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#52525b'
              }}
            >
              Calculating diff...
            </div>
          ) : (
            <div style={{ whiteSpace: 'pre-wrap' }}>
              {diffChanges.map((change, index) => {
                let color = '#a1a1aa'
                let background = 'transparent'
                let prefix = ' '

                if (change.added) {
                  color = '#34d399'
                  background = 'rgba(52, 211, 153, 0.08)'
                  prefix = '+'
                } else if (change.removed) {
                  color = '#f87171'
                  background = 'rgba(248, 113, 113, 0.08)'
                  prefix = '-'
                }

                return (
                  <div
                    key={`${prefix}-${index}`}
                    style={{
                      color,
                      background,
                      padding: '2px 8px',
                      borderRadius: '2px',
                      display: 'flex'
                    }}
                  >
                    <span style={{ width: '20px', userSelect: 'none', opacity: 0.3 }}>
                      {prefix}
                    </span>
                    <span style={{ flex: 1 }}>{change.value}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default DiffModal
