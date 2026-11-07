import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { cn } from '../../utils/cn';

export const AppLayout: React.FC = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  return (
    <div className="min-h-screen bg-brand-dark dark:bg-brand-darker text-slate-100 flex flex-col font-sans transition-colors duration-200">
      {/* Sidebar */}
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div
        className={cn(
          'flex-1 flex flex-col transition-all duration-300 ease-in-out',
          sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'
        )}
      >
        <Navbar
          onToggleSidebar={() => setMobileMenuOpen(!mobileMenuOpen)}
          isSidebarCollapsed={sidebarCollapsed}
        />

        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>

        {/* Global Footer */}
        <footer className="py-4 px-6 border-t border-brand-border text-center text-xs text-slate-400 font-mono">
          <p>
            Facial Emotion Recognizer AI &bull; Understand Facial Expressions with Artificial Intelligence
          </p>
          <p className="mt-1 text-slate-400">
            Powered by <span className="text-slate-300 font-medium">Saniya</span> &bull; Phase 1 Baseline
          </p>
        </footer>
      </div>
    </div>
  );
};

