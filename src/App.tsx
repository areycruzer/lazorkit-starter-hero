import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { WalletProvider } from './context/WalletContext';
import { Layout } from './components';
import { HomePage, DemoPage, TutorialsPage, SubscriptionPage } from './pages';
import { TutorialDetail } from './tutorials';

function App() {
  return (
    <BrowserRouter>
      <WalletProvider>
        <Layout>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/demo" element={<DemoPage />} />
            <Route path="/subscription" element={<SubscriptionPage />} />
            <Route path="/tutorials" element={<TutorialsPage />} />
            <Route path="/tutorials/:tutorialId" element={<TutorialDetail />} />
          </Routes>
        </Layout>
      </WalletProvider>
    </BrowserRouter>
  );
}

export default App;
