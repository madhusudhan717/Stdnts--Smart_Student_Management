import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, CheckCircle2, Flame, Clock } from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../services/api.ts';

interface FocusSessionWidgetProps {
  onSessionComplete?: () => void;
  initialCompletedSessions?: number;
  initialTotalMinutes?: number;
}

type SessionMode = 'focus' | 'shortBreak' | 'longBreak';

const MODE_DURATIONS: Record<SessionMode, number> = {
  focus: 25 * 60,
  shortBreak: 5 * 60,
  longBreak: 15 * 60,
};

export const FocusSessionWidget: React.FC<FocusSessionWidgetProps> = ({
  onSessionComplete,
  initialCompletedSessions = 2,
  initialTotalMinutes = 50,
}) => {
  const [mode, setMode] = useState<SessionMode>('focus');
  const [timeLeft, setTimeLeft] = useState<number>(MODE_DURATIONS.focus);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [subject, setSubject] = useState<string>('Data Structures & Algorithms');
  const [completedCount, setCompletedCount] = useState<number>(initialCompletedSessions);
  const [totalMinutes, setTotalMinutes] = useState<number>(initialTotalMinutes);
  const [completionMessage, setCompletionMessage] = useState<string | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync initial props
  useEffect(() => {
    setCompletedCount(initialCompletedSessions);
    setTotalMinutes(initialTotalMinutes);
  }, [initialCompletedSessions, initialTotalMinutes]);

  // Handle countdown
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleTimerComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, mode]);

  const handleTimerComplete = async () => {
    setIsRunning(false);
    if (timerRef.current) clearInterval(timerRef.current);

    // Trigger celebration confetti
    try {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.8 },
      });
    } catch {
      // Ignore if confetti blocked
    }

    const durationMinutes = Math.round(MODE_DURATIONS[mode] / 60);

    if (mode === 'focus') {
      try {
        await api.post('/focus-sessions', {
          session_type: 'Pomodoro Focus',
          duration_minutes: durationMinutes,
          subject,
          notes: `Completed 25m Pomodoro on ${subject}`,
        });
        setCompletedCount((c) => c + 1);
        setTotalMinutes((m) => m + durationMinutes);
        setCompletionMessage(`Focus session completed! Logged 25 mins.`);
        onSessionComplete?.();
      } catch (err) {
        console.error('Failed to save focus session:', err);
      }
    } else {
      setCompletionMessage(`Break finished! Ready for the next sprint?`);
    }

    setTimeout(() => {
      setCompletionMessage(null);
    }, 6000);
  };

  const handleModeChange = (newMode: SessionMode) => {
    setIsRunning(false);
    setMode(newMode);
    setTimeLeft(MODE_DURATIONS[newMode]);
    setCompletionMessage(null);
  };

  const toggleTimer = () => {
    if (timeLeft === 0) {
      setTimeLeft(MODE_DURATIONS[mode]);
    }
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(MODE_DURATIONS[mode]);
    setCompletionMessage(null);
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const totalDuration = MODE_DURATIONS[mode];
  const progressPercent = ((totalDuration - timeLeft) / totalDuration) * 100;

  return (
    <div className="bg-slate-950 text-white rounded-2xl p-5 border border-slate-800 shadow-md flex flex-col justify-between">
      {/* Top Header */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-white/10 text-emerald-400">
              <Clock className="w-4 h-4" />
            </span>
            <span className="text-sm font-bold tracking-tight text-white">Focus Session</span>
          </div>

          <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-300">
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span className="tabular-nums">14d Streak</span>
          </div>
        </div>

        {/* Mode Selector Tabs */}
        <div className="grid grid-cols-3 gap-1 p-1 bg-white/5 rounded-xl border border-white/10 text-[11px] font-medium text-slate-400 mb-4">
          <button
            onClick={() => handleModeChange('focus')}
            className={`py-1.5 px-2 rounded-lg text-center transition-all ${
              mode === 'focus'
                ? 'bg-white text-slate-950 font-bold shadow-xs'
                : 'hover:text-white'
            }`}
          >
            Focus 25m
          </button>
          <button
            onClick={() => handleModeChange('shortBreak')}
            className={`py-1.5 px-2 rounded-lg text-center transition-all ${
              mode === 'shortBreak'
                ? 'bg-white text-slate-950 font-bold shadow-xs'
                : 'hover:text-white'
            }`}
          >
            Break 5m
          </button>
          <button
            onClick={() => handleModeChange('longBreak')}
            className={`py-1.5 px-2 rounded-lg text-center transition-all ${
              mode === 'longBreak'
                ? 'bg-white text-slate-950 font-bold shadow-xs'
                : 'hover:text-white'
            }`}
          >
            Long 15m
          </button>
        </div>

        {/* Timer Display */}
        <div className="flex flex-col items-center justify-center my-2 py-2">
          <div className="text-5xl font-mono font-bold tracking-tight text-white tabular-nums">
            {formattedTime}
          </div>
          <div className="w-full bg-white/10 h-1.5 rounded-full mt-3 overflow-hidden">
            <div
              className="bg-emerald-400 h-full rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Subject association */}
        {mode === 'focus' && (
          <div className="mt-3">
            <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-1">
              Active Focus Target
            </label>
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full bg-white/10 border border-white/15 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-white/40"
            >
              <option value="Data Structures & Algorithms" className="bg-slate-900 text-white">
                Data Structures (CSE301)
              </option>
              <option value="Database Management Systems" className="bg-slate-900 text-white">
                Database Management (CSE302)
              </option>
              <option value="Operating Systems" className="bg-slate-900 text-white">
                Operating Systems (CSE303)
              </option>
              <option value="Artificial Intelligence" className="bg-slate-900 text-white">
                Artificial Intelligence (CSE304)
              </option>
              <option value="Discrete Mathematics" className="bg-slate-900 text-white">
                Discrete Math (MAT301)
              </option>
              <option value="Systems Programming Lab" className="bg-slate-900 text-white">
                Systems Lab (CSE305L)
              </option>
              <option value="General Academic Review" className="bg-slate-900 text-white">
                General Study & Revision
              </option>
            </select>
          </div>
        )}

        {/* Completion Toast Banner */}
        {completionMessage && (
          <div className="mt-3 p-2 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-200 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{completionMessage}</span>
          </div>
        )}
      </div>

      {/* Controls & Daily Stats */}
      <div className="mt-4 pt-3 border-t border-white/10">
        <div className="flex items-center justify-center gap-2 mb-3">
          <button
            onClick={toggleTimer}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all ${
              isRunning
                ? 'bg-amber-400 text-slate-950 hover:bg-amber-300'
                : 'bg-white text-slate-950 hover:bg-slate-100'
            }`}
          >
            {isRunning ? (
              <>
                <Pause className="w-3.5 h-3.5 fill-current" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>{timeLeft < totalDuration && timeLeft > 0 ? 'Resume' : 'Start Focus'}</span>
              </>
            )}
          </button>
          <button
            onClick={resetTimer}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors"
            title="Reset timer"
            aria-label="Reset timer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Today's Focus Stats */}
        <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
          <span>Today:</span>
          <span className="font-medium text-slate-200 tabular-nums">
            {completedCount} sessions · {totalMinutes}m focused
          </span>
        </div>
      </div>
    </div>
  );
};
