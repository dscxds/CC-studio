import type { FC } from 'react'
import { useState } from 'react'

import type { ClaudeCommand } from '../templates/claudeCommands'
import type { TaskTemplate } from '../templates/taskTemplates'

interface TaskFormModalProps {
  template: TaskTemplate | ClaudeCommand
  onClose: () => void
  onSubmit: (finalPrompt: string) => void
}

type FormValues = Record<string, string>

function buildInitialFormValues(template: TaskTemplate | ClaudeCommand): FormValues {
  return template.fields.reduce<FormValues>((accumulator, field) => {
    if (field.defaultValue) {
      accumulator[field.id] = field.defaultValue
    } else if (field.type === 'checkbox') {
      accumulator[field.id] = 'false'
    } else {
      accumulator[field.id] = ''
    }

    return accumulator
  }, {})
}

export const TaskFormModal: FC<TaskFormModalProps> = ({ template, onClose, onSubmit }) => {
  const [formValues, setFormValues] = useState<FormValues>(() => buildInitialFormValues(template))
  const [manualPreview, setManualPreview] = useState<string | null>(null)

  const generatedPreview =
    'commandTemplate' in template
      ? template.commandTemplate(formValues)
      : template.promptTemplate(formValues)
  const previewValue = manualPreview ?? generatedPreview

  function handleFieldChange(fieldId: string, value: string): void {
    setFormValues((previous) => ({ ...previous, [fieldId]: value }))
    setManualPreview(null)
  }

  function handleConfirm(): void {
    onSubmit(previewValue)
  }

  const isCommand = 'commandTemplate' in template
  const riskLevel = isCommand ? 'COMMAND' : template.riskLevel.toUpperCase()

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '20px'
      }}
    >
      <div
        style={{
          background: '#121214',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '12px',
          width: '550px',
          maxWidth: '100%',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5)',
          maxHeight: '90vh'
        }}
      >
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <div>
            <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>{template.name}</h4>
            <span style={{ fontSize: '11px', color: '#71717a' }}>{template.description}</span>
          </div>
          <span
            style={{
              fontSize: '10px',
              padding: '2px 8px',
              borderRadius: '4px',
              background: isCommand
                ? 'rgba(167, 139, 250, 0.1)'
                : template.riskLevel === 'read-only'
                  ? 'rgba(16, 185, 129, 0.1)'
                  : 'rgba(245, 158, 11, 0.1)',
              color: isCommand
                ? '#a78bfa'
                : template.riskLevel === 'read-only'
                  ? '#10b981'
                  : '#f59e0b',
              border: `1px solid ${
                isCommand
                  ? 'rgba(167, 139, 250, 0.2)'
                  : template.riskLevel === 'read-only'
                    ? 'rgba(16, 185, 129, 0.2)'
                    : 'rgba(245, 158, 11, 0.2)'
              }`
            }}
          >
            {riskLevel}
          </span>
        </div>

        <div
          style={{
            padding: '20px',
            overflowY: 'auto',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: '14px'
          }}
        >
          {template.fields.map((field) => (
            <div key={field.id} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', color: '#a1a1aa', fontWeight: 500 }}>
                {field.label} {field.required && <span style={{ color: '#ef4444' }}>*</span>}
              </label>

              {field.type === 'text' && (
                <input
                  type="text"
                  value={formValues[field.id] || ''}
                  onChange={(event) => handleFieldChange(field.id, event.target.value)}
                  placeholder={field.placeholder}
                  style={{
                    padding: '8px 12px',
                    background: '#09090b',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    color: '#fff',
                    borderRadius: '6px',
                    fontSize: '13px',
                    outline: 'none'
                  }}
                />
              )}

              {field.type === 'textarea' && (
                <textarea
                  rows={4}
                  value={formValues[field.id] || ''}
                  onChange={(event) => handleFieldChange(field.id, event.target.value)}
                  placeholder={field.placeholder}
                  style={{
                    padding: '8px 12px',
                    background: '#09090b',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    color: '#fff',
                    borderRadius: '6px',
                    fontSize: '13px',
                    outline: 'none',
                    resize: 'vertical',
                    fontFamily: 'monospace'
                  }}
                />
              )}

              {field.type === 'select' && (
                <select
                  value={formValues[field.id] || ''}
                  onChange={(event) => handleFieldChange(field.id, event.target.value)}
                  style={{
                    padding: '8px 12px',
                    background: '#09090b',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    color: '#fff',
                    borderRadius: '6px',
                    fontSize: '13px',
                    outline: 'none'
                  }}
                >
                  {field.options?.map((option) => (
                    <option key={option} value={option} style={{ background: '#09090b' }}>
                      {option}
                    </option>
                  ))}
                </select>
              )}

              {field.type === 'checkbox' && (
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '13px',
                    cursor: 'pointer'
                  }}
                >
                  <input
                    type="checkbox"
                    checked={formValues[field.id] === 'true'}
                    onChange={(event) =>
                      handleFieldChange(field.id, event.target.checked ? 'true' : 'false')
                    }
                  />
                  Enable this option
                </label>
              )}
            </div>
          ))}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={{ fontSize: '12px', color: '#22d3ee', fontWeight: 600 }}>
                Prompt Preview
              </label>
              <span style={{ fontSize: '10px', color: '#52525b' }}>
                You can edit the final prompt before sending it.
              </span>
            </div>
            <textarea
              rows={5}
              value={previewValue}
              onChange={(event) => setManualPreview(event.target.value)}
              style={{
                padding: '10px',
                background: '#0c0c0e',
                border: '1px solid rgba(34, 211, 238, 0.2)',
                color: '#eaeaea',
                borderRadius: '6px',
                fontSize: '12px',
                outline: 'none',
                fontFamily: 'monospace',
                resize: 'vertical'
              }}
            />
          </div>
        </div>

        <div
          style={{
            padding: '14px 20px',
            borderTop: '1px solid rgba(255, 255, 255, 0.05)',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '10px'
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: '8px 16px',
              background: 'transparent',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#a1a1aa',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '13px'
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            style={{
              padding: '8px 20px',
              background: 'linear-gradient(135deg, #06b6d4, #0891b2)',
              border: 'none',
              color: '#fff',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 600
            }}
          >
            Send to Claude
          </button>
        </div>
      </div>
    </div>
  )
}
