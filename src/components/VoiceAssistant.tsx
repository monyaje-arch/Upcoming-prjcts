import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mic, MicOff, Send, MessageSquare, Sparkles, Volume2, VolumeX, AlertCircle, HelpCircle } from 'lucide-react';
import { AssistantMessage, Booking } from '../types';

interface VoiceAssistantProps {
  onFormParsed: (details: Partial<Booking>, message: string) => void;
  isOnline: boolean;
  historyCount: number;
  onSelectTab: (tab: string) => void;
}

// Sample offline fallback keywords matching MAP_NODES for parsing
const SAMPLE_LOCATIONS = [
  'central station',
  'metro mall',
  'lakeside park',
  'tech district',
  'symphony hall',
  'greenwood heights',
  'industrial port',
];

export default function VoiceAssistant({
  onFormParsed,
  isOnline,
  historyCount,
  onSelectTab,
}: VoiceAssistantProps) {
  const [messages, setMessages] = useState<AssistantMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: "Hello! I'm your on-demand local assistant. Speak or type to book rides, deliveries, queue help, or heavy lifting!",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isTTSMuted, setIsTTSMuted] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Auto scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Speech Synthesis (Speak out loud)
  const speakText = (text: string) => {
    if (isTTSMuted) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.05;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('Speech synthesis not fully supported:', e);
    }
  };

  // Web Speech API Setup
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'en-US';

      rec.onstart = () => {
        setIsListening(true);
        setSpeechError(null);
      };

      rec.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputQuery(transcript);
        handleSendQuery(transcript);
      };

      rec.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          setSpeechError('Microphone permission denied. Please allow mic access or type.');
        } else if (event.error === 'no-speech') {
          setSpeechError('No speech detected. Please speak clearly.');
        } else {
          setSpeechError(`Error: ${event.error}`);
        }
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = rec;
    } else {
      console.warn('Web Speech API is not supported in this browser.');
    }
  }, []);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      setSpeechError(null);
      try {
        recognitionRef.current?.start();
      } catch (e) {
        setSpeechError('Could not start microphone. Please try again.');
      }
    }
  };

  // Local Offline Client-Side Matcher to support 100% offline usage
  const parseLocalQuery = (text: string): Partial<Booking> => {
    const cleanText = text.toLowerCase();
    const result: Partial<Booking> = {};

    // Detect locations in query
    const detectedLocations: string[] = [];
    SAMPLE_LOCATIONS.forEach((loc) => {
      if (cleanText.includes(loc)) {
        // Find proper case node name
        const match = loc
          .split(' ')
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' ');
        detectedLocations.push(match);
      }
    });

    if (detectedLocations.length >= 2) {
      // Best guess for from -> to
      const fromIdx = cleanText.indexOf('from');
      const toIdx = cleanText.indexOf('to');

      if (fromIdx !== -1 && toIdx !== -1 && fromIdx < toIdx) {
        result.pickup = detectedLocations[0];
        result.destination = detectedLocations[1];
      } else {
        result.pickup = detectedLocations[0];
        result.destination = detectedLocations[1];
      }
    } else if (detectedLocations.length === 1) {
      result.pickup = detectedLocations[0];
    }

    // Detect services
    if (cleanText.includes('lifting') || cleanText.includes('heavy') || cleanText.includes('furniture') || cleanText.includes('weight')) {
      result.type = 'lifting';
      result.specificTask = 'Heavy weight lifting assistance';
      // extract duration if mentioned (e.g. 2 hours)
      const hoursMatch = cleanText.match(/(\d+)\s*hour/);
      if (hoursMatch) result.durationHours = parseInt(hoursMatch[1]);
    } else if (cleanText.includes('queue') || cleanText.includes('line') || cleanText.includes('wait')) {
      result.type = 'queue';
      result.specificTask = 'Queue standing & management help';
      const hoursMatch = cleanText.match(/(\d+)\s*hour/);
      if (hoursMatch) result.durationHours = parseInt(hoursMatch[1]);
    } else if (cleanText.includes('deliver') || cleanText.includes('parcel') || cleanText.includes('courier') || cleanText.includes('package')) {
      result.type = 'delivery';
      result.itemType = cleanText.includes('document') ? 'Documents' : 'Box package';
    } else {
      result.type = 'ride';
      if (cleanText.includes('auto')) result.vehicleType = 'auto';
      else if (cleanText.includes('cab') || cleanText.includes('taxi')) result.vehicleType = 'cab';
      else result.vehicleType = 'bike';
    }

    return result;
  };

  const handleSendQuery = async (queryText?: string) => {
    const q = queryText || inputQuery;
    if (!q.trim()) return;

    // Add user message to log
    const userMsgId = Date.now().toString();
    setMessages((prev) => [
      ...prev,
      {
        id: userMsgId,
        sender: 'user',
        text: q,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
    setInputQuery('');
    setIsLoading(true);

    // If Offline or Network is toggled off, handle immediately with local match
    if (!isOnline) {
      setTimeout(() => {
        const offlineDetails = parseLocalQuery(q);
        let offlineMsg = "Internet offline. I used my offline voice model to fill out your form!";
        if (offlineDetails.type === 'ride') {
          offlineMsg = `Offline Match: I set up a bike ride from ${offlineDetails.pickup || 'Central Station'} to ${offlineDetails.destination || 'Metro Mall'}. Please verify and submit offline booking!`;
        } else if (offlineDetails.type === 'delivery') {
          offlineMsg = `Offline Match: Registered courier package dispatch form from ${offlineDetails.pickup || 'Lakeside Park'}. Check details!`;
        } else if (offlineDetails.type === 'lifting') {
          offlineMsg = `Offline Match: Pre-filled weight lifting request at ${offlineDetails.pickup || 'Symphony Hall'}. Complete configuration!`;
        } else if (offlineDetails.type === 'queue') {
          offlineMsg = `Offline Match: Pre-filled queue management form. Review and submit!`;
        }

        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            sender: 'assistant',
            text: offlineMsg,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
        setIsLoading(false);
        speakText(offlineMsg);
        onFormParsed(offlineDetails, offlineMsg);
      }, 700);
      return;
    }

    // Server-side AI parse
    try {
      const res = await fetch('/api/assistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: q }),
      });

      const data = await res.json();
      const assistantResponse = data.responseMessage || "I've updated your booking details according to your request.";

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          sender: 'assistant',
          text: assistantResponse,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);

      speakText(assistantResponse);

      // Handle intents like check history or check earnings directly in frontend!
      if (data.intent === 'check_history') {
        onSelectTab('history');
      } else if (data.intent === 'check_earnings') {
        onSelectTab('driver');
      } else {
        // Populate fields in booking dashboard
        const prefilledDetails: Partial<Booking> = {
          type: data.intent === 'ride_booking' ? 'ride' :
                data.intent === 'delivery_booking' ? 'delivery' :
                data.intent === 'lifting_assistance' ? 'lifting' :
                data.intent === 'queue_management' ? 'queue' : undefined,
          pickup: data.extractedDetails?.pickupLocation,
          destination: data.extractedDetails?.dropLocation,
          vehicleType: data.extractedDetails?.vehicleType,
          itemType: data.extractedDetails?.itemType,
          weight: data.extractedDetails?.weight,
          durationHours: data.extractedDetails?.durationHours,
          specificTask: data.extractedDetails?.specificTask,
        };
        onFormParsed(prefilledDetails, assistantResponse);
      }
    } catch (e) {
      console.error('AI voice model error, using offline backup:', e);
      // Fallback
      const backupDetails = parseLocalQuery(q);
      const backupMsg = "My AI server is starting up. I've processed your request locally. Check the form details!";
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          sender: 'assistant',
          text: backupMsg,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
      speakText(backupMsg);
      onFormParsed(backupDetails, backupMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestion = (txt: string) => {
    handleSendQuery(txt);
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
      {/* Header */}
      <div className="px-4 py-3 bg-slate-950/70 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
          <span className="text-sm font-semibold tracking-wide text-slate-100 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-sky-400" />
            AI Voice Assistant
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsTTSMuted(!isTTSMuted)}
            className={`p-1.5 rounded-lg border text-xs font-mono transition-all duration-200 ${
              isTTSMuted
                ? 'border-red-900/30 bg-red-950/30 text-red-400 hover:bg-red-950/50'
                : 'border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800'
            }`}
            title={isTTSMuted ? 'Unmute verbal feedback' : 'Mute verbal feedback'}
          >
            {isTTSMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Voice Transcript Window */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3 font-sans h-[180px] md:h-[220px] bg-slate-950/40">
        <AnimatePresence initial={false}>
          {messages.map((m) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[85%] px-3 py-2 rounded-xl text-xs leading-relaxed ${
                  m.sender === 'user'
                    ? 'bg-sky-500 text-white rounded-tr-none font-medium'
                    : 'bg-slate-800 text-slate-200 rounded-tl-none border border-slate-700/50'
                }`}
              >
                {m.text}
              </div>
              <span className="text-[9px] text-slate-500 mt-1 px-1 font-mono">{m.timestamp}</span>
            </motion.div>
          ))}
        </AnimatePresence>

        {isLoading && (
          <div className="flex items-center gap-1.5 text-xs text-sky-400/80 font-mono px-1">
            <span className="animate-bounce">●</span>
            <span className="animate-bounce" style={{ animationDelay: '0.2s' }}>●</span>
            <span className="animate-bounce" style={{ animationDelay: '0.4s' }}>●</span>
            <span className="text-[10px]">Processing voice intent...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Mic pulse and soundwave visuals */}
      <div className="px-4 py-3 bg-slate-900 border-t border-slate-800 flex flex-col gap-3">
        {speechError && (
          <div className="flex items-center gap-1.5 text-[11px] text-red-400 bg-red-950/20 border border-red-900/30 p-2 rounded-lg">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{speechError}</span>
          </div>
        )}

        <div className="flex items-center gap-3">
          {/* Big Mic Button */}
          <button
            onClick={toggleListening}
            className={`relative p-3.5 rounded-full transition-all duration-300 focus:outline-none flex items-center justify-center shrink-0 shadow-lg ${
              isListening
                ? 'bg-red-500 text-white scale-105'
                : 'bg-slate-800 hover:bg-slate-700 text-sky-400 border border-slate-700'
            }`}
          >
            {isListening ? (
              <>
                <Mic className="w-5 h-5 animate-pulse" />
                <span className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-25"></span>
              </>
            ) : (
              <Mic className="w-5 h-5" />
            )}
          </button>

          {/* Text Input Fallback */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendQuery();
            }}
            className="flex-1 flex gap-2"
          >
            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder={isListening ? 'Speak clearly now...' : 'Type order or say: "Bike to Mall"...'}
              disabled={isListening}
              className="flex-1 bg-slate-950 border border-slate-800 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 transition-all focus:outline-none disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={isListening || !inputQuery.trim()}
              className="p-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white transition-all disabled:opacity-45 disabled:hover:bg-sky-500 flex items-center justify-center cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* Waving voice feedback */}
        {isListening && (
          <div className="flex items-center justify-center gap-1.5 h-4 py-2">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((val) => (
              <motion.div
                key={val}
                className="w-1 bg-red-400 rounded-full"
                animate={{
                  height: [4, Math.floor(Math.random() * 16) + 6, 4],
                }}
                transition={{
                  repeat: Infinity,
                  duration: 0.4 + val * 0.05,
                  ease: 'easeInOut',
                }}
              />
            ))}
          </div>
        )}

        {/* Suggested Quick Prompts */}
        <div className="pt-1">
          <div className="text-[10px] text-slate-500 font-mono flex items-center gap-1 mb-1.5">
            <HelpCircle className="w-3 h-3 text-slate-400" />
            <span>Try speaking or clicking:</span>
          </div>
          <div className="flex flex-wrap gap-1.5 max-h-[64px] overflow-y-auto scrollbar-thin">
            <button
              onClick={() => handleSuggestion('Book a bike ride from Central Station to Metro Mall')}
              className="px-2 py-1 text-[10px] bg-slate-950 border border-slate-800 rounded-lg text-slate-400 hover:text-sky-300 hover:border-sky-800 transition duration-150"
            >
              🏍️ Bike to Metro Mall
            </button>
            <button
              onClick={() => handleSuggestion('Deliver parcel from Lakeside Park to Industrial Port')}
              className="px-2 py-1 text-[10px] bg-slate-950 border border-slate-800 rounded-lg text-slate-400 hover:text-sky-300 hover:border-sky-800 transition duration-150"
            >
              📦 Send Box to Port
            </button>
            <button
              onClick={() => handleSuggestion('Need heavy lifting assistance at Tech District for 3 hours')}
              className="px-2 py-1 text-[10px] bg-slate-950 border border-slate-800 rounded-lg text-slate-400 hover:text-sky-300 hover:border-sky-800 transition duration-150"
            >
              💪 3hr Lifting Help
            </button>
            <button
              onClick={() => handleSuggestion('I need someone for queue management at Symphony Hall for 2 hours')}
              className="px-2 py-1 text-[10px] bg-slate-950 border border-slate-800 rounded-lg text-slate-400 hover:text-sky-300 hover:border-sky-800 transition duration-150"
            >
              🚶 Stand in line at Concert
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
