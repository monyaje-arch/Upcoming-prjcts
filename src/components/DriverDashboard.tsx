import React, { useState } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Play, CheckCircle, Navigation, TrendingUp, DollarSign, Award, Clock, MapPin, Eye, Bell, Shield } from 'lucide-react';
import { Booking, DriverStats } from '../types';

interface DriverDashboardProps {
  pendingBookings: Booking[];
  activeBooking?: Booking;
  onAcceptBooking: (bookingId: string) => void;
  onUpdateBookingStatus: (bookingId: string, status: Booking['status']) => void;
  driverStats: DriverStats;
  isOnline: boolean;
  onToggleOnline: () => void;
}

// Simulated data for Earnings trend chart
const EARNINGS_TREND = [
  { day: 'Mon', amount: 45 },
  { day: 'Tue', amount: 80 },
  { day: 'Wed', amount: 65 },
  { day: 'Thu', amount: 120 },
  { day: 'Fri', amount: 140 },
  { day: 'Sat', amount: 210 },
  { day: 'Sun', amount: 175 },
];

export default function DriverDashboard({
  pendingBookings,
  activeBooking,
  onAcceptBooking,
  onUpdateBookingStatus,
  driverStats,
  isOnline,
  onToggleOnline,
}: DriverDashboardProps) {
  const [activeSubTab, setActiveSubTab] = useState<'orders' | 'analytics' | 'history'>('orders');

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col gap-4">
      {/* Header section with Partner Toggle */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-sm font-semibold text-slate-100 uppercase tracking-wider font-mono flex items-center gap-2">
            <Shield className="w-4 h-4 text-amber-500" />
            Partner Drive Console
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage your rides, parcel dispatch, and services
          </p>
        </div>

        {/* Status toggle button */}
        <button
          onClick={onToggleOnline}
          className={`px-4 py-2 rounded-xl text-xs font-bold font-mono tracking-wide border transition-all cursor-pointer flex items-center gap-2 ${
            isOnline
              ? 'bg-emerald-950/40 border-emerald-500/80 text-emerald-400 hover:bg-emerald-950/60 shadow-[0_0_12px_rgba(16,185,129,0.15)]'
              : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-300'
          }`}
        >
          <span className={`w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-700'}`}></span>
          <span>{isOnline ? 'DUTY ACTIVE' : 'DUTY OFF-LINE'}</span>
        </button>
      </div>

      {/* Analytics highlights */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-slate-950 border border-slate-800/85 p-3.5 rounded-xl flex items-center gap-3">
          <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] text-slate-500 font-mono">TODAY'S EARNINGS</div>
            <div className="text-base font-bold text-slate-100 font-mono">${driverStats.totalEarnings.toFixed(2)}</div>
          </div>
        </div>

        <div className="bg-slate-950 border border-slate-800/85 p-3.5 rounded-xl flex items-center gap-3">
          <div className="p-2 bg-sky-500/10 text-sky-400 rounded-lg">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] text-slate-500 font-mono">JOBS COMPLETED</div>
            <div className="text-base font-bold text-slate-100 font-mono">{driverStats.completedJobs}</div>
          </div>
        </div>

        <div className="bg-slate-950 border border-slate-800/85 p-3.5 rounded-xl flex items-center gap-3">
          <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] text-slate-500 font-mono">ONLINE TIME</div>
            <div className="text-base font-bold text-slate-100 font-mono">{driverStats.hoursOnline} hrs</div>
          </div>
        </div>

        <div className="bg-slate-950 border border-slate-800/85 p-3.5 rounded-xl flex items-center gap-3">
          <div className="p-2 bg-purple-500/10 text-purple-400 rounded-lg">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] text-slate-500 font-mono">PARTNER RATING</div>
            <div className="text-base font-bold text-slate-100 font-mono">★ {driverStats.rating.toFixed(1)}</div>
          </div>
        </div>
      </div>

      {/* Internal Subtabs */}
      <div className="flex border-b border-slate-800/60 pb-1 gap-1.5 text-xs">
        {[
          { id: 'orders', label: 'Incoming Orders', icon: Bell },
          { id: 'analytics', label: 'Earnings Trends', icon: TrendingUp },
          { id: 'history', label: 'Earning Records', icon: Eye },
        ].map((tab) => {
          const isSelected = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg border font-medium flex items-center gap-1.5 transition cursor-pointer ${
                isSelected
                  ? 'bg-slate-800 border-slate-700 text-sky-400'
                  : 'bg-transparent border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* CONDITIONAL SUBVIEWS */}

      {/* 1. ORDERS FEED TAB */}
      {activeSubTab === 'orders' && (
        <div className="space-y-3">
          {!isOnline ? (
            <div className="py-8 text-center bg-slate-950/40 border border-slate-800/50 border-dashed rounded-xl flex flex-col items-center justify-center gap-2">
              <span className="text-2xl">💤</span>
              <p className="text-xs text-slate-400 font-semibold font-mono">DUTY STATUS SET TO INACTIVE</p>
              <p className="text-[10px] text-slate-500">Go online to stream live customer bookings, parcel courier demands, and helper requests.</p>
            </div>
          ) : activeBooking ? (
            /* ACTIVE JOB ON-DUTY BOARD */
            <div className="p-4 bg-slate-950/90 border border-slate-800 rounded-xl flex flex-col gap-3 relative">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[9px] font-mono uppercase bg-amber-950 text-amber-400 border border-amber-800/50 px-2 py-0.5 rounded-full font-bold">
                    ONGOING ASSIGNMENT
                  </span>
                  <h3 className="text-sm font-bold text-white mt-2">
                    Client booking: #{activeBooking.id.slice(0, 8)}
                  </h3>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-500 font-mono block">Earning</span>
                  <span className="text-base font-bold text-emerald-400 font-mono">${activeBooking.price.toFixed(2)}</span>
                </div>
              </div>

              {/* Specific job instructions */}
              <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800/50 flex flex-col gap-1.5 text-xs text-slate-300">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Pickup: <strong className="text-slate-100">{activeBooking.pickup}</strong></span>
                </div>
                {activeBooking.destination && (
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0" />
                    <span>Drop: <strong className="text-slate-100">{activeBooking.destination}</strong></span>
                  </div>
                )}
                {activeBooking.itemType && (
                  <div>Parcel detail: <strong className="text-slate-100">{activeBooking.itemType} ({activeBooking.weight})</strong></div>
                )}
                {activeBooking.durationHours && (
                  <div>Helper Duration: <strong className="text-slate-100">{activeBooking.durationHours} hours</strong></div>
                )}
                {activeBooking.specificTask && (
                  <div>Details: <strong className="text-slate-100">{activeBooking.specificTask}</strong></div>
                )}
              </div>

              {/* Driving controls simulation steppers */}
              <div className="grid grid-cols-3 gap-2 pt-2">
                {activeBooking.status === 'accepted' && (
                  <button
                    onClick={() => onUpdateBookingStatus(activeBooking.id, 'in_progress')}
                    className="col-span-3 py-2.5 bg-sky-500 hover:bg-sky-400 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow transition cursor-pointer"
                  >
                    <Navigation className="w-4 h-4 animate-bounce" />
                    <span>Confirm Arrival at Pickup</span>
                  </button>
                )}

                {activeBooking.status === 'in_progress' && (
                  <button
                    onClick={() => onUpdateBookingStatus(activeBooking.id, 'completed')}
                    className="col-span-3 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow transition cursor-pointer"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Complete Trip / Work</span>
                  </button>
                )}
              </div>
            </div>
          ) : pendingBookings.length === 0 ? (
            <div className="py-8 text-center bg-slate-950/40 border border-slate-800/50 border-dashed rounded-xl flex flex-col items-center justify-center gap-2">
              <span className="text-2xl animate-pulse">📡</span>
              <p className="text-xs text-slate-400 font-semibold font-mono">SCANNING FOR INCOMING DISPATCHES...</p>
              <p className="text-[10px] text-slate-500">Wait for a client to request a taxi, parcel courier, or helper service.</p>
            </div>
          ) : (
            /* LIST OF PENDING JOBS TO ACCEPT */
            <div className="space-y-2.5">
              {pendingBookings.map((bk) => (
                <div
                  key={bk.id}
                  className="p-3.5 bg-slate-950 border border-slate-800/80 hover:border-slate-700 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition duration-150"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-mono uppercase bg-slate-900 border border-slate-700/60 px-2 py-0.5 rounded text-slate-300 font-bold capitalize">
                        {bk.type}
                      </span>
                      {bk.offline && (
                        <span className="text-[8px] font-mono uppercase bg-amber-950 text-amber-500 border border-amber-800 px-1 py-0.5 rounded font-bold">
                          Offline Sync
                        </span>
                      )}
                    </div>
                    <div className="text-xs font-semibold text-slate-100 flex flex-wrap items-center gap-1">
                      <span className="text-emerald-400">{bk.pickup}</span>
                      {bk.destination && (
                        <>
                          <span className="text-slate-500">➔</span>
                          <span className="text-red-400">{bk.destination}</span>
                        </>
                      )}
                    </div>
                    {bk.specificTask && (
                      <p className="text-[10px] text-slate-400 max-w-sm line-clamp-1 italic">{bk.specificTask}</p>
                    )}
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3.5 shrink-0">
                    <div className="text-right">
                      <div className="text-[9px] text-slate-500 font-mono">Payout</div>
                      <div className="text-sm font-bold text-emerald-400 font-mono">${bk.price.toFixed(2)}</div>
                    </div>

                    <button
                      onClick={() => onAcceptBooking(bk.id)}
                      className="px-3 py-1.5 bg-sky-500 hover:bg-sky-400 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition duration-150"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Accept</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 2. ANALYTICS TRENDS TAB */}
      {activeSubTab === 'analytics' && (
        <div className="space-y-3">
          <div className="bg-slate-950 p-4 border border-slate-800/80 rounded-xl">
            <h3 className="text-xs font-semibold text-slate-200 mb-3 uppercase tracking-wider font-mono">
              Partner Weekly Earnings ($)
            </h3>
            <div className="h-[180px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={EARNINGS_TREND}>
                  <defs>
                    <linearGradient id="earningsGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(30, 41, 59, 0.4)" />
                  <XAxis dataKey="day" stroke="#475569" fontSize={10} tickLine={false} />
                  <YAxis stroke="#475569" fontSize={10} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#1e293b',
                      borderRadius: '8px',
                      fontSize: '11px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="amount"
                    stroke="#10b981"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#earningsGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* 3. HISTORY LEDGER TAB */}
      {activeSubTab === 'history' && (
        <div className="space-y-2">
          {driverStats.recentJobs.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500 italic">
              No jobs completed today yet. Go online to earn!
            </div>
          ) : (
            <div className="space-y-2 max-h-[220px] overflow-y-auto scrollbar-thin">
              {driverStats.recentJobs.map((jb, index) => (
                <div
                  key={`history-job-${index}`}
                  className="p-3 bg-slate-950/80 border border-slate-900 rounded-xl flex items-center justify-between text-xs"
                >
                  <div className="space-y-0.5">
                    <span className="text-[9px] font-mono uppercase text-emerald-400 font-semibold">Completed</span>
                    <div className="text-slate-200 font-medium">
                      {jb.pickup} {jb.destination ? `➔ ${jb.destination}` : ''}
                    </div>
                    <div className="text-[10px] text-slate-500 capitalize">{jb.type} ride service</div>
                  </div>
                  <div className="text-right font-mono font-bold text-slate-200">+${jb.price.toFixed(2)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
