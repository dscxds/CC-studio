import { ElectronAPI } from '@electron-toolkit/preload'
import type { StudioApi } from '../shared/studio'

declare global {
  interface Window {
    electron: ElectronAPI
    api: StudioApi
  }
}
