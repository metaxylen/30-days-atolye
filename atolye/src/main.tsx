import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { installPreloadGuard } from './lib/chunkError'
import { BUILD_ID, installVersionWatch } from './lib/version'
import './styles/tokens.css'
import './styles/base.css'
import './styles/home.css'
import './styles/reader.css'
import './styles/learn.css'
import './styles/pyview.css'
import './styles/scenes.css'
import './styles/band.css'
import './styles/play.css'
import './styles/cards.css'

installPreloadGuard()
// the build id this tab runs (the tests and the version check read it); the dev server has no version.json to compare with
document.documentElement.dataset.build = BUILD_ID
if (!import.meta.env.DEV) installVersionWatch()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
