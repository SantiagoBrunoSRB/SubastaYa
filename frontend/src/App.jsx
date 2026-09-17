import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/common/Layout';
import HomePage from './pages/HomePage';
import CreateAuctionPage from './pages/CreateAuctionPage';
import ProfilePage from './pages/ProfilePage';
import AuctionDetailPage from './pages/AuctionDetailPage';
import WalletPage from './pages/WalletPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="crear-subasta" element={<CreateAuctionPage />} />
          <Route path="mi-perfil" element={<ProfilePage />} />
          <Route path="subasta/:id" element={<AuctionDetailPage />} />
          <Route path="billetera" element={<WalletPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
