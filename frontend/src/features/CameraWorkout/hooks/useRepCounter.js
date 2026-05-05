import { useCallback, useEffect, useRef, useState } from 'react';

function angle3(a, b, c) {
  const rad = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
  let deg = Math.abs((rad * 180) / Math.PI);
  if (deg > 180) deg = 360 - deg;
  return deg;
}

function buildRepCounter() {
  let phase = 'up';
  return function countRep(lm, workoutType) {
    try {
      switch (workoutType) {
        case 'pushup': {
          const ang = angle3(lm[11], lm[13], lm[15]);
          if (ang < 90  && phase === 'up')   { phase = 'down'; return false; }
          if (ang > 155 && phase === 'down') { phase = 'up';   return true;  }
          return false;
        }
        case 'squat': {
          const ang = angle3(lm[23], lm[25], lm[27]);
          if (ang < 100 && phase === 'up')   { phase = 'down'; return false; }
          if (ang > 160 && phase === 'down') { phase = 'up';   return true;  }
          return false;
        }
        case 'lunge': {
          const ang = angle3(lm[23], lm[25], lm[27]);
          if (ang < 110 && phase === 'up')   { phase = 'down'; return false; }
          if (ang > 160 && phase === 'down') { phase = 'up';   return true;  }
          return false;
        }
        case 'bicep_curl': {
          const ang = angle3(lm[11], lm[13], lm[15]);
          if (ang < 60  && phase === 'up')   { phase = 'down'; return false; }
          if (ang > 150 && phase === 'down') { phase = 'up';   return true;  }
          return false;
        }
        case 'overhead': {
          const ang = angle3(lm[13], lm[11], lm[23]);
          if (ang > 160 && phase === 'up')   { phase = 'down'; return false; }
          if (ang < 80  && phase === 'down') { phase = 'up';   return true;  }
          return false;
        }
        case 'crunch':
        case 'situp': {
          const ang = angle3(lm[11], lm[23], lm[25]);
          if (ang < 80  && phase === 'up')   { phase = 'down'; return false; }
          if (ang > 140 && phase === 'down') { phase = 'up';   return true;  }
          return false;
        }
        case 'lateral_raise': {
          const shoulderY = (lm[11].y + lm[12].y) / 2;
          const elbowY    = (lm[13].y + lm[14].y) / 2;
          if (elbowY < shoulderY - 0.02 && phase === 'up')   { phase = 'down'; return false; }
          if (elbowY > shoulderY + 0.04 && phase === 'down') { phase = 'up';   return true;  }
          return false;
        }
        case 'calfraise': {
          const ankleY = (lm[27].y + lm[28].y) / 2;
          const hipY   = (lm[23].y + lm[24].y) / 2;
          const rel    = hipY - ankleY;
          if (rel > 0.52 && phase === 'up')   { phase = 'down'; return false; }
          if (rel < 0.46 && phase === 'down') { phase = 'up';   return true;  }
          return false;
        }
        default: {
          const hipY = (lm[23].y + lm[24].y) / 2;
          if (hipY < 0.40 && phase === 'up')   { phase = 'down'; return false; }
          if (hipY > 0.55 && phase === 'down') { phase = 'up';   return true;  }
          return false;
        }
      }
    } catch {
      return false;
    }
  };
}

export function speak(text, rate = 1.05, pitch = 1.0) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.rate   = rate;
  u.pitch  = pitch;
  u.volume = 1;
  const voices    = window.speechSynthesis.getVoices();
  const preferred =
    voices.find(v => /en[-_](US|GB|AU)/i.test(v.lang) && /Natural|Samantha|Google/i.test(v.name)) ||
    voices.find(v => /en/i.test(v.lang));
  if (preferred) u.voice = preferred;
  window.speechSynthesis.speak(u);
}

export function useRepCounter({ workoutType, voiceEnabled }) {
  const [repCount,      setRepCount]      = useState(0);
  const [lastSpokenRep, setLastSpokenRep] = useState(0);

  const repCountRef   = useRef(0);
  const repCounterRef = useRef(buildRepCounter());

  useEffect(() => { repCountRef.current = repCount; }, [repCount]);

  useEffect(() => {
    if (!voiceEnabled || repCount === 0 || repCount === lastSpokenRep) return;
    if (repCount % 10 === 0) {
      speak(`${repCount} reps! Great work, keep going!`, 1.1, 1.05);
    } else if (repCount % 5 === 0) {
      speak(`${repCount}!`);
    }
    setLastSpokenRep(repCount);
  }, [repCount, voiceEnabled, lastSpokenRep]);

  const countRep = useCallback((landmarks, type) => {
    const didRep = repCounterRef.current(landmarks, type);
    if (didRep) {
      setRepCount((prev) => {
        const next = prev + 1;
        repCountRef.current = next;
        return next;
      });
    }
  }, []);

  const resetReps = useCallback(() => {
    repCounterRef.current = buildRepCounter();
    setRepCount(0);
    setLastSpokenRep(0);
    repCountRef.current = 0;
  }, []);

  return { repCount, repCountRef, countRep, resetReps };
}