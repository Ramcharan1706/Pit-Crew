import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import AppShell from '../components/AppShell';
import DashboardPage from '../pages/DashboardPage';
import CreateIntentPage from '../pages/CreateIntentPage';
import IntentDetailsPage from '../pages/IntentDetailsPage';
import ApprovalsPage from '../pages/ApprovalsPage';
import ActivityPage from '../pages/ActivityPage';
import TransactionsPage from '../pages/TransactionsPage';

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/create" element={<CreateIntentPage />} />
        <Route path="/intents/:intentId" element={<IntentDetailsPage />} />
        <Route path="/approvals" element={<ApprovalsPage />} />
        <Route path="/activity" element={<ActivityPage />} />
        <Route path="/transactions" element={<TransactionsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
};

export default AppRoutes;
