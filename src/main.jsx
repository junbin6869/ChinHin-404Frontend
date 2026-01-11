import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'                     //function used to render HTML page
import './index.css'
import App from './App.jsx'                                       //import default export

createRoot(document.getElementById('root')).render(             //render define what is render in the page
  <StrictMode>
    <App />
  </StrictMode>,
)
