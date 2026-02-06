import React from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import 'react-toastify/dist/ReactToastify.css'
import App from './App.jsx'
import { ToastContainer } from 'react-toastify'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext'
import { AuthProvider } from './context/AuthContext'

const queryClient = new QueryClient();

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ThemeProvider>
          <AuthProvider>
            <App />
            {/* Toast container for react-toastify */}
            <ToastContainer />
          </AuthProvider>
        </ThemeProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
)
