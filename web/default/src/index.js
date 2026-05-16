import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import Sidebar from './components/Sidebar';
import Footer from './components/Footer';
import 'semantic-ui-css/semantic.min.css';
import './index.css';
import { UserProvider } from './context/User';
import { ThemeProvider } from './context/Theme';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { StatusProvider } from './context/Status';
import './i18n';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ThemeProvider>
      <StatusProvider>
        <UserProvider>
          <BrowserRouter>
            <div className='yiapi-layout'>
              <Sidebar>
                <App />
                <Footer />
              </Sidebar>
            </div>
            <ToastContainer />
          </BrowserRouter>
        </UserProvider>
      </StatusProvider>
    </ThemeProvider>
  </React.StrictMode>
);