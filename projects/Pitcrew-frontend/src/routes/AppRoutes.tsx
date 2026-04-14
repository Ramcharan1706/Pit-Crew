import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { MainLayout } from '../components/layout/MainLayout';
import { Dashboard } from '../pages/Dashboard';
import { CreateIntent } from '../pages/CreateIntent';
import { Intents } from '../pages/Intents';
import { TriggerCenter } from '../pages/TriggerCenter';
import { IntentDetails } from '../pages/IntentDetails';
import { History } from '../pages/History';
import { Market } from '../pages/Market';
import { Profile } from '../pages/Profile';
import Account from '../pages/Account';

export const AppRoutes: React.FC = () => {
  return (
    <MainLayout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/create" element={<CreateIntent />} />
        <Route path="/intents" element={<Intents />} />
        <Route path="/trigger-center" element={<TriggerCenter />} />
        <Route path="/intent/:id" element={<IntentDetails />} />
        <Route path="/intents/:id" element={<IntentDetails />} />
        <Route path="/history" element={<History />} />
        <Route path="/market" element={<Market />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/account" element={<Account />} />

        {/* 404 Fallback */}
        <Route
          path="*"
          element={
            <div className="text-center py-12">
              <p className="text-2xl font-bold text-white mb-2">404 - Page Not Found</p>
              <p className="text-slate-400">The page you're looking for doesn't exist</p>
            </div>
          }
        />
      </Routes>
    </MainLayout>
  );
};
