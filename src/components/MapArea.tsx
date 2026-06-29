import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MapPin, Navigation, Compass, Flag } from 'lucide-react';
import { Booking } from '../types';

export const MAP_NODES = [
  { id: 'central_station', name: 'Central Station', x: 150, y: 150, description: 'Main transit hub' },
  { id: 'metro_mall', name: 'Metro Mall', x: 450, y: 150, description: 'Shopping & food zone' },
  { id: 'lakeside_park', name: 'Lakeside Park', x: 150, y: 350, description: 'Recreation & greenery' },
  { id: 'tech_district', name: 'Tech District', x: 450, y: 350, description: 'Software parks' },
  { id: 'symphony_hall', name: 'Symphony Hall', x: 300, y: 250, description: 'Arts & music' },
  { id: 'greenwood', name: 'Greenwood Heights', x: 100, y: 100, description: 'Residential zone' },
  { id: 'industrial_port', name: 'Industrial Port', x: 500, y: 400, description: 'Warehousing & cargo' },
];

export const MAP_ROADS = [
  { from: 'greenwood', to: 'central_station' },
  { from: 'central_station', to: 'metro_mall' },
  { from: 'central_station', to: 'symphony_hall' },
  { from: 'metro_mall', to: 'tech_district' },
  { from: 'lakeside_park', to: 'symphony_hall' },
  { from: 'tech_district', to: 'symphony_hall' },
  { from: 'lakeside_park', to: 'industrial_port' },
  { from: 'tech_district', to: 'industrial_port' },
];

interface MapAreaProps {
  activeBooking?: Booking;
  onSelectNode?: (nodeName: string, role: 'pickup' | 'destination') => void;
  selectionRole?: 'pickup' | 'destination' | null;
  driverCoords?: { x: number; y: number };
}

export default function MapArea({
  activeBooking,
  onSelectNode,
  selectionRole,
  driverCoords,
}: MapAreaProps) {
  // Find node by its exact name or partial name
  const findNodeCoords = (name?: string) => {
    if (!name) return null;
    const cleanName = name.toLowerCase();
    const node = MAP_NODES.find(
      (n) =>
        n.name.toLowerCase().includes(cleanName) ||
        cleanName.includes(n.name.toLowerCase())
    );
    return node ? { x: node.x, y: node.y, name: node.name } : null;
  };

  const pickupCoords = findNodeCoords(activeBooking?.pickup);
  const destCoords = findNodeCoords(activeBooking?.destination);

  // Compute live driver coordinates based on activeBooking progress if no absolute coordinates passed
  let liveDriverCoords = driverCoords;
  if (!liveDriverCoords && activeBooking && (activeBooking.status === 'accepted' || activeBooking.status === 'in_progress')) {
    const start = pickupCoords || { x: 300, y: 250 };
    const end = destCoords || { x: 450, y: 350 };
    const progress = activeBooking.progress;

    if (progress < 50) {
      // Moving to pickup (starts from Symphony Hall or some location)
      const driverOrigin = { x: 300, y: 250 };
      const ratio = progress / 50; // 0 to 1
      liveDriverCoords = {
        x: driverOrigin.x + (start.x - driverOrigin.x) * ratio,
        y: driverOrigin.y + (start.y - driverOrigin.y) * ratio,
      };
    } else {
      // Moving from pickup to destination
      const ratio = (progress - 50) / 50; // 0 to 1
      liveDriverCoords = {
        x: start.x + (end.x - start.x) * ratio,
        y: start.y + (end.y - start.y) * ratio,
      };
    }
  }

  return (
    <div className="relative w-full h-[320px] md:h-[400px] bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-inner">
      {/* Background HUD Layer */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-1 text-xs font-mono text-slate-400 bg-slate-900/95 border border-slate-800 px-3 py-2 rounded-lg pointer-events-none backdrop-blur-sm shadow">
        <div className="flex items-center gap-1.5 font-semibold text-sky-400">
          <Compass className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '6s' }} />
          <span>LIVE SAT-GRID ACTIVE</span>
        </div>
        <div>LAT: 12.9716° N | LON: 77.5946° E</div>
        <div>ZOOM: 14.5x (AUTO-PAN)</div>
      </div>

      {activeBooking && (
        <div className="absolute top-4 right-4 z-10 text-xs font-mono bg-slate-900/95 border border-slate-800 px-3 py-2 rounded-lg pointer-events-none backdrop-blur-sm shadow flex flex-col gap-1">
          <div className="flex items-center gap-1.5 text-emerald-400">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="capitalize">{activeBooking.type} status: {activeBooking.status.replace('_', ' ')}</span>
          </div>
          {activeBooking.progress > 0 && (
            <div className="text-slate-300">Transit Progress: {Math.round(activeBooking.progress)}%</div>
          )}
        </div>
      )}

      {/* Interactive Selection Overlay Prompt */}
      {selectionRole && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 text-xs text-center bg-sky-500/95 text-white px-4 py-2 rounded-full font-medium tracking-wide shadow-lg animate-bounce backdrop-blur">
          Click any city node to set <span className="underline font-bold uppercase">{selectionRole}</span> location
        </div>
      )}

      {/* SVG Container */}
      <svg
        viewBox="0 0 600 500"
        className="w-full h-full select-none"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(30, 41, 59, 0.5)" strokeWidth="1" />
          </pattern>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="8" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Cyber Grid */}
        <rect width="100%" height="100%" fill="url(#grid)" />

        {/* Draw Roads (Background grid network) */}
        {MAP_ROADS.map((road, idx) => {
          const fromNode = MAP_NODES.find((n) => n.id === road.from);
          const toNode = MAP_NODES.find((n) => n.id === road.to);
          if (!fromNode || !toNode) return null;
          return (
            <line
              key={`road-${idx}`}
              x1={fromNode.x}
              y1={fromNode.y}
              x2={toNode.x}
              y2={toNode.y}
              stroke="#1e293b"
              strokeWidth="6"
              strokeLinecap="round"
            />
          );
        })}

        {/* Draw Highlighted active road route */}
        {pickupCoords && destCoords && (
          <>
            {/* Background trace glowing path */}
            <line
              x1={pickupCoords.x}
              y1={pickupCoords.y}
              x2={destCoords.x}
              y2={destCoords.y}
              stroke="rgba(14, 165, 233, 0.3)"
              strokeWidth="8"
              strokeLinecap="round"
              filter="url(#glow)"
            />
            {/* Animated dashed progress path */}
            <line
              x1={pickupCoords.x}
              y1={pickupCoords.y}
              x2={destCoords.x}
              y2={destCoords.y}
              stroke="#0ea5e9"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeDasharray="8 6"
              className="animate-[dash_15s_linear_infinite]"
              style={{
                strokeDashoffset: -20,
              }}
            />
          </>
        )}

        {/* Landmark Nodes */}
        {MAP_NODES.map((node) => {
          const isPickup = pickupCoords && pickupCoords.name === node.name;
          const isDest = destCoords && destCoords.name === node.name;
          const isClickable = !!selectionRole;

          return (
            <g
              key={node.id}
              transform={`translate(${node.x}, ${node.y})`}
              className={`cursor-pointer group`}
              onClick={() => onSelectNode && selectionRole && onSelectNode(node.name, selectionRole)}
              id={`node-${node.id}`}
            >
              {/* Highlight Circle behind node on hover */}
              <circle
                r="30"
                fill="transparent"
                className="group-hover:fill-slate-800/20 transition-all duration-300"
              />

              {/* Glowing ring if pickup or destination */}
              {isPickup && (
                <circle
                  r="16"
                  className="animate-ping"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2"
                  style={{ animationDuration: '2.5s' }}
                />
              )}
              {isDest && (
                <circle
                  r="16"
                  className="animate-ping"
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth="2"
                  style={{ animationDuration: '2.5s' }}
                />
              )}

              {/* Interactive Node Body */}
              <circle
                r={isPickup || isDest ? "10" : "7"}
                fill={isPickup ? '#10b981' : isDest ? '#ef4444' : '#1e293b'}
                stroke={isPickup ? '#34d399' : isDest ? '#f87171' : isClickable ? '#0ea5e9' : '#334155'}
                strokeWidth={isClickable ? '2.5' : '1.5'}
                className="transition-colors duration-300"
              />

              {/* Mini dot core */}
              <circle
                r="2.5"
                fill="#ffffff"
              />

              {/* Label */}
              <text
                y="-18"
                textAnchor="middle"
                className="text-[10px] font-sans font-semibold tracking-wide"
                fill={isPickup ? '#34d399' : isDest ? '#f87171' : '#94a3b8'}
              >
                {node.name}
              </text>
            </g>
          );
        })}

        {/* Live Driver / Courier Vehicle Dot */}
        {liveDriverCoords && (
          <g transform={`translate(${liveDriverCoords.x}, ${liveDriverCoords.y})`}>
            {/* Outer locator radar */}
            <circle
              r="22"
              fill="rgba(245, 158, 11, 0.15)"
              className="animate-pulse"
              filter="url(#glow)"
            />
            <circle
              r="12"
              fill="#f59e0b"
              stroke="#ffffff"
              strokeWidth="2"
              className="shadow"
            />
            {/* Simple pointer or direction arrow */}
            <path
              d="M -4 -4 L 4 0 L -4 4 Z"
              fill="#ffffff"
              transform="rotate(-45)"
            />
          </g>
        )}
      </svg>

      {/* Map Footer Helper */}
      <div className="absolute bottom-3 right-3 z-10 flex gap-2 text-[10px] bg-slate-900/90 border border-slate-800 text-slate-400 px-2.5 py-1.5 rounded-lg pointer-events-none font-mono">
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Pickup
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-red-500"></span> Dest
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-amber-500"></span> Live Agent
        </div>
      </div>
    </div>
  );
}
