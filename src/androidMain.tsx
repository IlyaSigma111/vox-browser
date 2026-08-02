// Android entry — install the native bridge first, then boot the React UI.
import './android/shim'
import { createRoot } from 'react-dom/client'
import App from './App'

createRoot(document.getElementById('root')!).render(<App />)
