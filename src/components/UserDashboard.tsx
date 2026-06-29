import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Bike, Car, Truck, Package, Dumbbell, Clock, MapPin, DollarSign, Send, XCircle, AlertTriangle, CheckCircle, Navigation } from 'lucide-react';
import { Booking, BookingType } from '../types';
import { MAP_NODES } from './MapArea';

interface UserDashboardProps {
  prefilledDetails?: Partial<Booking>;
  onAddBooking: (booking: Omit<Booking, 'id' | 'status' | 'progress' | 'createdAt'>) => void;
  activeBooking?: Booking;
  onCancelBooking: (id: string) => void;
  onTriggerMapSelection: (role: 'pickup' | 'destination' | null) => void;
  selectionRole: 'pickup' | 'destination' | null;
  isOnline: boolean;
}

export default function UserDashboard({
  prefilledDetails,
  onAddBooking,
  activeBooking,
  onCancelBooking,
  onTriggerMapSelection,
  selectionRole,
  isOnline,
}: UserDashboardProps) {
  const [activeTab, setActiveTab] = useState<BookingType>('ride');

  // Form states
  const [pickup, setPickup] = useState('Central Station');
  const [destination, setDestination] = useState('Metro Mall');
  const [vehicleType, setVehicleType] = useState<'bike' | 'auto' | 'cab'>('bike');
  const [itemType, setItemType] = useState('Documents');
  const [weight, setWeight] = useState('Light (under 5 kg)');
  const [durationHours, setDurationHours] = useState(2);
  const [specificTask, setSpecificTask] = useState('');

  // Handle prefilled options from Voice Assistant
  useEffect(() => {
    if (prefilledDetails) {
      if (prefilledDetails.type) {
        setActiveTab(prefilledDetails.type);
      }
      if (prefilledDetails.pickup) {
        setPickup(prefilledDetails.pickup);
      }
      if (prefilledDetails.destination) {
        setDestination(prefilledDetails.destination);
      }
      if (prefilledDetails.vehicleType) {
        setVehicleType(prefilledDetails.vehicleType);
      }
      if (prefilledDetails.itemType) {
        setItemType(prefilledDetails.itemType);
      }
      if (prefilledDetails.weight) {
        setWeight(prefilledDetails.weight);
      }
      if (prefilledDetails.durationHours) {
        setDurationHours(prefilledDetails.durationHours);
      }
      if (prefilledDetails.specificTask) {
        setSpecificTask(prefilledDetails.specificTask);
      }
    }
  }, [prefilledDetails]);

  // Pricing calculations
  const calculatePrice = (): number => {
    let basePrice = 0;
    if (activeTab === 'ride') {
      const rate = vehicleType === 'bike' ? 12 : vehicleType === 'auto' ? 20 : 35;
      basePrice = rate;
    } else if (activeTab === 'delivery') {
      const weightMultiplier = weight.toLowerCase().includes('heavy') ? 30 : 15;
      basePrice = 18 + weightMultiplier;
    } else if (activeTab === 'lifting') {
      basePrice = durationHours * 25; // $25 per hour
    } else if (activeTab === 'queue') {
      basePrice = durationHours * 18; // $18 per hour
    }
    return basePrice;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const price = calculatePrice();
    const payload = {
      type: activeTab,
      pickup,
      destination: activeTab === 'ride' || activeTab === 'delivery' ? destination : '',
      vehicleType: activeTab === 'ride' ? vehicleType : undefined,
      itemType: activeTab === 'delivery' ? itemType : undefined,
      weight: activeTab === 'delivery' || activeTab === 'lifting' ? weight : undefined,
      durationHours: activeTab === 'lifting' || activeTab === 'queue' ? durationHours : undefined,
      specificTask: activeTab === 'lifting' || activeTab === 'queue' ? specificTask : undefined,
      price,
    };
    onAddBooking(payload);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col gap-4">
      {/* Title section */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-100 uppercase tracking-wider font-mono">
            Booking Console
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Book local services instantly
          </p>
        </div>

        {!isOnline && (
          <div className="flex items-center gap-1.5 text-[11px] font-semibold font-mono text-amber-500 bg-amber-950/20 border border-amber-900/30 px-2 py-1 rounded-full animate-pulse">
            <AlertTriangle className="w-3 h-3" />
            <span>OFFLINE QUEUE ACTIVE</span>
          </div>
        )}
      </div>

      {/* ACTIVE TRACKING INTERFACE */}
      {activeBooking ? (
        <div className="space-y-4">
          <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl flex flex-col gap-3 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-sky-500/10 to-transparent pointer-events-none"></div>

            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider bg-sky-950 text-sky-400 border border-sky-800 px-2 py-0.5 rounded-full font-bold">
                  {activeBooking.type === 'ride' ? `Ride (${activeBooking.vehicleType})` : activeBooking.type}
                </span>
                <h3 className="text-sm font-semibold text-white mt-1.5">
                  OrderID: #{activeBooking.id.slice(0, 8)}
                </h3>
              </div>
              <div className="text-right">
                <div className="text-xs text-slate-400 font-mono">Estimated Fare</div>
                <div className="text-lg font-bold text-emerald-400 font-mono">${activeBooking.price.toFixed(2)}</div>
              </div>
            </div>

            {/* Stepper Status Indicators */}
            <div className="grid grid-cols-5 gap-1.5 pt-2">
              {[
                { status: 'pending', label: 'Requested' },
                { status: 'accepted', label: 'Accepted' },
                { status: 'in_progress', label: 'Arriving' },
                { status: 'completed', label: 'Done' },
              ].map((step, idx) => {
                const stepOrder = ['pending', 'accepted', 'in_progress', 'completed'];
                const currentIdx = stepOrder.indexOf(activeBooking.status);
                const isPassed = idx <= currentIdx;
                const isCurrent = idx === currentIdx;

                return (
                  <div key={step.status} className="flex flex-col gap-1.5 items-center">
                    <div
                      className={`h-1.5 w-full rounded-full transition-colors duration-300 ${
                        isCurrent
                          ? 'bg-sky-500'
                          : isPassed
                          ? 'bg-emerald-500'
                          : 'bg-slate-800'
                      }`}
                    ></div>
                    <span
                      className={`text-[9px] font-mono tracking-tight text-center ${
                        isCurrent
                          ? 'text-sky-400 font-bold'
                          : isPassed
                          ? 'text-emerald-500'
                          : 'text-slate-500'
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="border-t border-slate-900 pt-3 flex flex-col gap-2 text-xs">
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="text-slate-300">From: <strong className="text-slate-100">{activeBooking.pickup}</strong></span>
              </div>
              {activeBooking.destination && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-red-400 shrink-0" />
                  <span className="text-slate-300">To: <strong className="text-slate-100">{activeBooking.destination}</strong></span>
                </div>
              )}
              {activeBooking.driverName && (
                <div className="flex items-center gap-2 pt-1 border-t border-slate-900">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono text-[9px] flex items-center justify-center font-bold">
                    {activeBooking.driverName.charAt(0)}
                  </div>
                  <span className="text-slate-400">
                    Assigned Agent: <strong className="text-slate-200">{activeBooking.driverName}</strong>
                  </span>
                </div>
              )}
            </div>

            {/* Cancel Action */}
            {activeBooking.status !== 'completed' && (
              <button
                onClick={() => onCancelBooking(activeBooking.id)}
                className="mt-2 w-full py-2 bg-slate-900 border border-red-950/30 hover:bg-red-950/20 text-red-400 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors duration-200 cursor-pointer"
              >
                <XCircle className="w-4 h-4" />
                <span>Cancel Service</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        /* BOOKING FORM CONSOLE */
        <div className="space-y-4">
          {/* Service Selector Tabs */}
          <div className="grid grid-cols-4 gap-1 p-1 bg-slate-950 rounded-xl border border-slate-800">
            {[
              { id: 'ride', label: 'Ride', icon: Bike },
              { id: 'delivery', label: 'Delivery', icon: Package },
              { id: 'lifting', label: 'Lifting', icon: Dumbbell },
              { id: 'queue', label: 'Queue', icon: Clock },
            ].map((tab) => {
              const Icon = tab.icon;
              const isSelected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id as BookingType);
                    onTriggerMapSelection(null);
                  }}
                  className={`py-2 rounded-lg flex flex-col items-center gap-1 text-[10px] font-medium transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-sky-500 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* Input fields based on selected service tab */}

            {/* Common Pickup Selector */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                Pickup Landmark / Node
              </label>
              <div className="relative flex items-center">
                <MapPin className="absolute left-3 w-4 h-4 text-emerald-400" />
                <select
                  value={pickup}
                  onChange={(e) => setPickup(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-24 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-sky-500"
                >
                  {MAP_NODES.map((n) => (
                    <option key={n.id} value={n.name}>
                      {n.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => onTriggerMapSelection(selectionRole === 'pickup' ? null : 'pickup')}
                  className={`absolute right-2 px-2.5 py-1 text-[9px] font-bold font-mono border rounded-lg flex items-center gap-1 transition cursor-pointer ${
                    selectionRole === 'pickup'
                      ? 'bg-emerald-500 border-emerald-400 text-white animate-pulse'
                      : 'bg-slate-900 border-slate-800 text-sky-400 hover:border-sky-800'
                  }`}
                >
                  <Navigation className="w-2.5 h-2.5" />
                  <span>{selectionRole === 'pickup' ? 'SELECTING' : 'MAP'}</span>
                </button>
              </div>
            </div>

            {/* Ride Booking Fields */}
            {activeTab === 'ride' && (
              <div className="space-y-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                    Drop-off Node
                  </label>
                  <div className="relative flex items-center">
                    <MapPin className="absolute left-3 w-4 h-4 text-red-400" />
                    <select
                      value={destination}
                      onChange={(e) => setDestination(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-24 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-sky-500"
                    >
                      {MAP_NODES.filter((n) => n.name !== pickup).map((n) => (
                        <option key={n.id} value={n.name}>
                          {n.name}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() =>
                        onTriggerMapSelection(selectionRole === 'destination' ? null : 'destination')
                      }
                      className={`absolute right-2 px-2.5 py-1 text-[9px] font-bold font-mono border rounded-lg flex items-center gap-1 transition cursor-pointer ${
                        selectionRole === 'destination'
                          ? 'bg-red-500 border-red-400 text-white animate-pulse'
                          : 'bg-slate-900 border-slate-800 text-sky-400 hover:border-sky-800'
                      }`}
                    >
                      <Navigation className="w-2.5 h-2.5" />
                      <span>{selectionRole === 'destination' ? 'SELECTING' : 'MAP'}</span>
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                    Vehicle Preference
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'bike', label: 'Moto Bike', rate: '$12', icon: Bike },
                      { id: 'auto', label: 'Auto Rick', rate: '$20', icon: Car },
                      { id: 'cab', label: 'Prime Cab', rate: '$35', icon: Truck },
                    ].map((v) => {
                      const Icon = v.icon;
                      const isSelected = vehicleType === v.id;
                      return (
                        <button
                          key={v.id}
                          type="button"
                          onClick={() => setVehicleType(v.id as any)}
                          className={`p-2.5 border rounded-xl flex flex-col items-center justify-center gap-1 cursor-pointer transition ${
                            isSelected
                              ? 'border-sky-500 bg-sky-950/40 text-sky-400'
                              : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          <span className="text-[10px] font-semibold">{v.label}</span>
                          <span className="text-[9px] font-mono text-slate-500">{v.rate} flat</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Courier/Delivery Fields */}
            {activeTab === 'delivery' && (
              <div className="space-y-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                    Recipient Location
                  </label>
                  <div className="relative flex items-center">
                    <MapPin className="absolute left-3 w-4 h-4 text-red-400" />
                    <select
                      value={destination}
                      onChange={(e) => setDestination(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-24 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-sky-500"
                    >
                      {MAP_NODES.filter((n) => n.name !== pickup).map((n) => (
                        <option key={n.id} value={n.name}>
                          {n.name}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() =>
                        onTriggerMapSelection(selectionRole === 'destination' ? null : 'destination')
                      }
                      className={`absolute right-2 px-2.5 py-1 text-[9px] font-bold font-mono border rounded-lg flex items-center gap-1 transition cursor-pointer ${
                        selectionRole === 'destination'
                          ? 'bg-red-500 border-red-400 text-white animate-pulse'
                          : 'bg-slate-900 border-slate-800 text-sky-400 hover:border-sky-800'
                      }`}
                    >
                      <Navigation className="w-2.5 h-2.5" />
                      <span>{selectionRole === 'destination' ? 'SELECTING' : 'MAP'}</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-mono text-slate-500 uppercase">
                      Item Description
                    </label>
                    <input
                      type="text"
                      value={itemType}
                      onChange={(e) => setItemType(e.target.value)}
                      placeholder="e.g. Laptop, Documents"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-mono text-slate-500 uppercase">
                      Estimated Weight
                    </label>
                    <select
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
                    >
                      <option value="Light (under 5 kg)">Light (under 5 kg)</option>
                      <option value="Medium (5 - 15 kg)">Medium (5 - 15 kg)</option>
                      <option value="Heavy (above 15 kg)">Heavy (above 15 kg)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Heavy Lifting Fields */}
            {activeTab === 'lifting' && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-mono text-slate-500 uppercase">
                      Estimated Load Size
                    </label>
                    <select
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
                    >
                      <option value="Single furniture item">Single furniture item</option>
                      <option value="Moving boxes (Multiple)">Moving boxes (Multiple)</option>
                      <option value="Full apartment offload">Full apartment offload</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-mono text-slate-500 uppercase">
                      Duration (Hours)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="12"
                      value={durationHours}
                      onChange={(e) => setDurationHours(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500 font-mono"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-mono text-slate-500 uppercase">
                    Specific Tasks / Requirements
                  </label>
                  <textarea
                    rows={2}
                    value={specificTask}
                    onChange={(e) => setSpecificTask(e.target.value)}
                    placeholder="e.g. Unloading a dining table up to 3rd floor..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500 resize-none"
                  />
                </div>
              </div>
            )}

            {/* Queue Management Fields */}
            {activeTab === 'queue' && (
              <div className="space-y-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-mono text-slate-500 uppercase">
                    Estimated Duration (Hours)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="12"
                    value={durationHours}
                    onChange={(e) => setDurationHours(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500 font-mono"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-mono text-slate-500 uppercase">
                    Queue Venue / Purpose Details
                  </label>
                  <textarea
                    rows={2}
                    value={specificTask}
                    onChange={(e) => setSpecificTask(e.target.value)}
                    placeholder="e.g. Stand in line for vaccine registration or ticket counter..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500 resize-none"
                  />
                </div>
              </div>
            )}

            {/* Estimated Price Display */}
            <div className="p-3 bg-slate-950 border border-slate-800/80 rounded-xl flex items-center justify-between font-mono">
              <span className="text-xs text-slate-400">Calculated Service Price</span>
              <div className="flex items-center gap-1 text-emerald-400 font-bold text-base">
                <DollarSign className="w-4 h-4" />
                <span>{calculatePrice().toFixed(2)}</span>
              </div>
            </div>

            {/* Submit Action */}
            <button
              type="submit"
              className="w-full py-3 bg-sky-500 hover:bg-sky-400 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-lg transition-all"
            >
              <Send className="w-4 h-4" />
              <span>{isOnline ? 'Confirm Instant Booking' : 'Queue Offline Booking'}</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
