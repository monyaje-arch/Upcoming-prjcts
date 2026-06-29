import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, Shield, Signal, SignalZero, Layers, HelpCircle, History, Sparkles } from 'lucide-react';
import { Booking, DriverStats } from './types';
import MapArea from './components/MapArea';
import VoiceAssistant from './components/VoiceAssistant';
import UserDashboard from './components/UserDashboard';
import DriverDashboard from './components/DriverDashboard';

export default function App() {
  const [role, setRole] = useState<'customer' | 'driver'>('customer');
  const [isOnline, setIsOnline] = useState<boolean>(true); // Simulated online/offline network status
  const [offlineQueue, setOfflineQueue] = useState<Omit<Booking, 'id' | 'status' | 'progress' | 'createdAt'>[]>([]);

  // Bookings list
  const [bookings, setBookings] = useState<Booking[]>(() => {
    const saved = localStorage.getItem('rapido_bookings');
    return saved ? JSON.parse(saved) : [];
  });

  // Selected prefilled data from Assistant
  const [prefilledDetails, setPrefilledDetails] = useState<Partial<Booking> | undefined>(undefined);

  // Driver states
  const [driverIsOnline, setDriverIsOnline] = useState<boolean>(true);
  const [driverStats, setDriverStats] = useState<DriverStats>(() => {
    const saved = localStorage.getItem('rapido_driver_stats');
    if (saved) return JSON.parse(saved);
    return {
      totalEarnings: 312.5,
      completedJobs: 14,
      hoursOnline: 36,
      rating: 4.8,
      recentJobs: [],
    };
  });

  // Map interaction role
  const [selectionRole, setSelectionRole] = useState<'pickup' | 'destination' | null>(null);

  // Save state helpers
  useEffect(() => {
    localStorage.setItem('rapido_bookings', JSON.stringify(bookings));
  }, [bookings]);

  useEffect(() => {
    localStorage.setItem('rapido_driver_stats', JSON.stringify(driverStats));
  }, [driverStats]);

  // Real-time Driver Movement & Progress Simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setBookings((prevBookings) => {
        let changed = false;
        const next = prevBookings.map((bk) => {
          if (bk.status === 'accepted') {
            changed = true;
            const nextProgress = Math.min(50, bk.progress + 1.5);
            // Auto transition to "in_progress" (arrived at pickup)
            const nextStatus = nextProgress >= 50 ? 'in_progress' : 'accepted';
            return { ...bk, progress: nextProgress, status: nextStatus };
          }
          if (bk.status === 'in_progress') {
            changed = true;
            const nextProgress = Math.min(100, bk.progress + 2);
            // If completed progress, but driver hasn't confirmed, let's keep it close to 99% until clicked
            // or let's simulate complete arrival automatically
            const isFinished = nextProgress >= 100;
            if (isFinished) {
              // We will let driver click "Complete Work" but progress completes
              return { ...bk, progress: 100 };
            }
            return { ...bk, progress: nextProgress };
          }
          return bk;
        });
        return changed ? next : prevBookings;
      });
    }, 400);

    return () => clearInterval(interval);
  }, []);

  // Sync Offline Queue when returning online
  useEffect(() => {
    if (isOnline && offlineQueue.length > 0) {
      offlineQueue.forEach((queued) => {
        const newBooking: Booking = {
          ...queued,
          id: `b-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          status: 'pending',
          progress: 0,
          createdAt: new Date().toISOString(),
          offline: true,
        };
        setBookings((prev) => [newBooking, ...prev]);
      });
      setOfflineQueue([]);
    }
  }, [isOnline, offlineQueue]);

  // ADD BOOKING HANDLER
  const handleAddBooking = (payload: Omit<Booking, 'id' | 'status' | 'progress' | 'createdAt'>) => {
    if (!isOnline) {
      // Queue offline
      setOfflineQueue((prev) => [...prev, payload]);
      alert("No internet! Your service booking is queued. It will sync automatically once connectivity is restored!");
      return;
    }

    const newBooking: Booking = {
      ...payload,
      id: `b-${Date.now()}`,
      status: 'pending',
      progress: 0,
      createdAt: new Date().toISOString(),
    };

    setBookings((prev) => [newBooking, ...prev]);
    setPrefilledDetails(undefined); // Clear prefill
  };

  // ACCEPT BOOKING HANDLER
  const handleAcceptBooking = (id: string) => {
    setBookings((prev) =>
      prev.map((bk) =>
        bk.id === id
          ? {
              ...bk,
              status: 'accepted',
              driverId: 'd-1',
              driverName: 'Agent Rohit Kumar',
              progress: 5,
            }
          : bk
      )
    );
  };

  // UPDATE STATUS HANDLER
  const handleUpdateStatus = (id: string, status: Booking['status']) => {
    setBookings((prev) =>
      prev.map((bk) => {
        if (bk.id === id) {
          const updated = { ...bk, status };
          if (status === 'completed') {
            updated.progress = 100;
            // Update partner driver analytics
            setDriverStats((prevStats) => ({
              ...prevStats,
              totalEarnings: prevStats.totalEarnings + bk.price,
              completedJobs: prevStats.completedJobs + 1,
              recentJobs: [updated, ...prevStats.recentJobs],
            }));
          }
          return updated;
        }
        return bk;
      })
    );
  };

  // CANCEL HANDLER
  const handleCancelBooking = (id: string) => {
    setBookings((prev) =>
      prev.map((bk) => (bk.id === id ? { ...bk, status: 'cancelled' } : bk))
    );
  };

  // NODE SELECTION ON MAP
  const handleSelectMapNode = (nodeName: string, targetRole: 'pickup' | 'destination') => {
    setPrefilledDetails((prev) => ({
      ...prev,
      [targetRole]: nodeName,
    }));
    setSelectionRole(null); // Reset selection overlay
  };

  // Get active pending and active current bookings
  const pendingBookings = bookings.filter((bk) => bk.status === 'pending');
  const activeBooking = bookings.find((bk) => ['pending', 'accepted', 'in_progress'].includes(bk.status));
  const completedHistory = bookings.filter((bk) => ['completed', 'cancelled'].includes(bk.status));

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans select-none antialiased selection:bg-sky-500/30">
      {/* Dynamic Header */}
      <header className="sticky top-0 z-40 bg-slate-900/90 border-b border-slate-800/80 backdrop-blur-md px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-gradient-to-br from-sky-500 to-indigo-600 rounded-xl shadow-lg flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-white flex items-center gap-1.5">
              RapidAssist
              <span className="text-[10px] font-semibold font-mono bg-sky-950 text-sky-400 border border-sky-800/50 px-1.5 py-0.5 rounded">
                v2.0
              </span>
            </h1>
            <p className="text-[10px] text-slate-400 font-mono hidden sm:block">MULTI-SERVICES ON-DEMAND PLATFORM</p>
          </div>
        </div>

        {/* Global Connection & Navigation Controls */}
        <div className="flex items-center gap-3">
          {/* Simulated Network Offline/Online Switcher */}
          <button
            onClick={() => setIsOnline(!isOnline)}
            className={`px-2.5 py-1.5 rounded-xl text-[10px] font-bold font-mono tracking-wider border flex items-center gap-1.5 cursor-pointer transition ${
              isOnline
                ? 'bg-slate-950 border-slate-800 text-emerald-400 hover:text-emerald-300'
                : 'bg-amber-950/20 border-amber-900 text-amber-500 animate-pulse'
            }`}
            title="Click to toggle offline mode (Offline Support Demo)"
          >
            {isOnline ? (
              <>
                <Signal className="w-3.5 h-3.5" />
                <span>ONLINE STATE</span>
              </>
            ) : (
              <>
                <SignalZero className="w-3.5 h-3.5" />
                <span>DEMO OFFLINE</span>
              </>
            )}
          </button>

          {/* Customer / Driver Role Switcher */}
          <div className="bg-slate-950 border border-slate-800/85 p-0.5 rounded-xl flex">
            <button
              onClick={() => setRole('customer')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                role === 'customer'
                  ? 'bg-sky-500 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Rider</span>
            </button>
            <button
              onClick={() => setRole('driver')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                role === 'driver'
                  ? 'bg-amber-500 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Partner</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-4 md:py-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Interactive Map & Booking History (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-6 h-full">
          {/* Animated SVG city Map */}
          <section className="flex flex-col gap-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-[11px] font-bold font-mono tracking-wider text-slate-400 uppercase flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-sky-400" />
                Real-Time City Grid Map
              </span>
              <span className="text-[10px] text-slate-500 font-mono">Click Nodes to Pick Location</span>
            </div>
            <MapArea
              activeBooking={activeBooking}
              onSelectNode={handleSelectMapNode}
              selectionRole={selectionRole}
            />
          </section>

          {/* Completed History and Logs Panel */}
          <section className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2 text-xs font-bold font-mono text-slate-400">
                <History className="w-4 h-4 text-sky-400" />
                <span>YOUR DISPATCH LOGS & HISTORY</span>
              </div>
              <span className="text-[10px] font-mono text-slate-500">
                Completed: {completedHistory.filter((b) => b.status === 'completed').length}
              </span>
            </div>

            {completedHistory.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-500 italic font-mono bg-slate-950/20 border border-slate-800/40 rounded-xl">
                No archived trips/jobs recorded in localStorage yet.
              </div>
            ) : (
              <div className="space-y-2 max-h-[160px] overflow-y-auto scrollbar-thin">
                {completedHistory.map((bk) => (
                  <div
                    key={bk.id}
                    className="p-3 bg-slate-950/70 border border-slate-900 hover:border-slate-800 rounded-xl flex items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded font-bold ${
                          bk.status === 'completed'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-900/40'
                            : 'bg-red-950 text-red-400 border border-red-900/40'
                        }`}>
                          {bk.status}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">ID: #{bk.id.slice(0, 8)}</span>
                      </div>
                      <p className="text-slate-200 mt-1 font-semibold flex items-center gap-1">
                        <span>{bk.pickup}</span>
                        {bk.destination && (
                          <>
                            <span className="text-slate-500 font-normal">➔</span>
                            <span>{bk.destination}</span>
                          </>
                        )}
                      </p>
                      <p className="text-[10px] text-slate-400 capitalize">{bk.type} dispatch service</p>
                    </div>
                    <div className="text-right font-mono font-bold text-slate-200">${bk.price.toFixed(2)}</div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Right Column: Assistant, Booking Console & Driver Dashboard (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* AI VOICE ASSISTANT CARD */}
          <VoiceAssistant
            onFormParsed={(details, msg) => {
              setPrefilledDetails(details);
            }}
            isOnline={isOnline}
            historyCount={bookings.length}
            onSelectTab={(tab) => {
              if (tab === 'history') {
                // Keep customer view, focus history
                setRole('customer');
              } else if (tab === 'driver') {
                setRole('driver');
              }
            }}
          />

          {/* RIDER VS PARTNER DASHBOARDS */}
          {role === 'customer' ? (
            <UserDashboard
              prefilledDetails={prefilledDetails}
              onAddBooking={handleAddBooking}
              activeBooking={activeBooking}
              onCancelBooking={handleCancelBooking}
              onTriggerMapSelection={setSelectionRole}
              selectionRole={selectionRole}
              isOnline={isOnline}
            />
          ) : (
            <DriverDashboard
              pendingBookings={pendingBookings}
              activeBooking={activeBooking}
              onAcceptBooking={handleAcceptBooking}
              onUpdateBookingStatus={handleUpdateStatus}
              driverStats={driverStats}
              isOnline={driverIsOnline}
              onToggleOnline={() => setDriverIsOnline(!driverIsOnline)}
            />
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-900 py-4 px-6 text-center text-xs text-slate-500 font-mono bg-slate-950 flex flex-col sm:flex-row justify-between items-center gap-2">
        <div>© 2026 RapidAssist Inc. Real-time Multi-Service Platform.</div>
        <div className="flex gap-4">
          <span className="hover:text-slate-400 transition cursor-help flex items-center gap-1">
            <HelpCircle className="w-3.5 h-3.5" />
            Help Guidelines
          </span>
          <span>Terms & Conditions</span>
        </div>
      </footer>
    </div>
  );
}
