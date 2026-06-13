import { useState, useEffect, useRef, useCallback } from "react";

const PHASES = {
  IDLE: "idle",
  LOADING: "loading",
  QUESTION_INTRO: "question_intro",
  COUNTDOWN: "countdown",
  ANSWER: "answer",
  EXPLANATION: "explanation",
  PAUSED: "paused",
  FINISHED: "finished",
};

const PHASE_TIMEOUTS = {
  [PHASES.QUESTION_INTRO]: 8000,
  [PHASES.COUNTDOWN]: 12000,
  [PHASES.ANSWER]: 6000,
  [PHASES.EXPLANATION]: 8000,
};

const PHASE_ORDER = [
  PHASES.QUESTION_INTRO,
  PHASES.COUNTDOWN,
  PHASES.ANSWER,
  PHASES.EXPLANATION,
];

function getNextPhase(currentPhase) {
  const idx = PHASE_ORDER.indexOf(currentPhase);
  if (idx >= 0 && idx < PHASE_ORDER.length - 1) {
    return PHASE_ORDER[idx + 1];
  }
  return null;
}

function shuffleArray(arr) {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function shuffleQuestion(question) {
  if (!question.alternatives || question.alternatives.length < 2) {
    return question;
  }

  const originalCorrect = question.correct;
  const indices = question.alternatives.map((_, i) => i);
  const shuffledIndices = shuffleArray(indices);

  const shuffled = {
    ...question,
    alternatives: shuffledIndices.map((i) => question.alternatives[i]),
    correct: shuffledIndices.indexOf(originalCorrect),
  };

  const articlePattern = /^(Um |Uma |Um\b|Uma\b)/i;
  if (
    shuffled.alternatives[0] &&
    articlePattern.test(shuffled.alternatives[0].trim())
  ) {
    for (let swap = 1; swap < shuffled.alternatives.length; swap++) {
      if (!articlePattern.test(shuffled.alternatives[swap].trim())) {
        [
          shuffled.alternatives[0],
          shuffled.alternatives[swap],
        ] = [
          shuffled.alternatives[swap],
          shuffled.alternatives[0],
        ];
        if (shuffled.correct === 0) {
          shuffled.correct = swap;
        } else if (shuffled.correct === swap) {
          shuffled.correct = 0;
        }
        break;
      }
    }
  }

  return shuffled;
}

export default function useQuizEngine({
  onSpeak,
  onCancel,
  onPhaseChange,
  onQuestionChange,
  onCountdownTick,
  onFinished,
}) {
  const [phase, setPhase] = useState(PHASES.IDLE);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [countdown, setCountdown] = useState(12);
  const [paused, setPaused] = useState(false);

  const phaseRef = useRef(PHASES.IDLE);
  const indexRef = useRef(0);
  const questionsRef = useRef([]);
  const pausedRef = useRef(false);
  const audioGenRef = useRef(0);
  const countdownIntervalRef = useRef(null);
  const fallbackTimerRef = useRef(null);
  const configRef = useRef({
    category: null,
    count: null,
    shouldLoop: true,
  });

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  useEffect(() => {
    indexRef.current = currentIndex;
  }, [currentIndex]);

  useEffect(() => {
    questionsRef.current = questions;
  }, [questions]);

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  const stopAllTimers = useCallback(() => {
    console.log("[QUIZ] stopAllTimers");
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    if (fallbackTimerRef.current) {
      clearTimeout(fallbackTimerRef.current);
      fallbackTimerRef.current = null;
    }
  }, []);

  const stopAudio = useCallback(() => {
    console.log("[AUDIO] stopAudio");
    audioGenRef.current++;
    if (onCancel) onCancel();
  }, [onCancel]);

  const goToPhase = useCallback(
    (nextPhase, questionIdx) => {
      console.log("[PHASE] goToPhase", nextPhase, questionIdx !== undefined ? `q#${questionIdx}` : ``);
      if (pausedRef.current && nextPhase !== PHASES.PAUSED) {
        return;
      }

      stopAllTimers();
      stopAudio();

      if (questionIdx !== undefined) {
        setCurrentIndex(questionIdx);
        indexRef.current = questionIdx;
      }

      setPhase(nextPhase);
      phaseRef.current = nextPhase;

      if (onPhaseChange) {
        onPhaseChange(nextPhase, questionIdx ?? indexRef.current);
      }
    },
    [stopAllTimers, stopAudio, onPhaseChange]
  );

  const speakText = useCallback(
    (text, onDone) => {
      console.log("[TTS] speakText", text ? `${text.slice(0, 60)}${text.length > 60 ? '...' : ''}` : "<empty>");
      const requestId = audioGenRef.current + 1;
      stopAudio();
      audioGenRef.current = requestId;

      const safeDone = () => {
        if (audioGenRef.current === requestId) {
          console.log("[TTS] speakText done", requestId);
          if (onDone) onDone();
        } else {
          console.log("[TTS] speakText ignored stale callback", requestId);
        }
      };

      if (onSpeak) {
        onSpeak(text, safeDone);
      } else {
        safeDone();
      }
    },
    [stopAudio, onSpeak]
  );

  const startQuiz = useCallback(
    (qs) => {
      setQuestions(qs);
      questionsRef.current = qs;
      setCurrentIndex(0);
      indexRef.current = 0;
      console.log(`[QuizEngine] start — ${qs.length} questions`);
      goToPhase(PHASES.QUESTION_INTRO, 0);
    },
    [goToPhase]
  );

  const loadQuestions = useCallback(
    async (fetchFn, category, count) => {
      try {
        const limit = count || 50;
        console.log(
          `[QuizEngine] loading — category=${category || "all"}, limit=${limit}`
        );

        const data = await fetchFn(limit, category);

        if (!data.questions || data.questions.length === 0) {
          console.error(`[QuizEngine] 0 questions for ${category || "all"}`);
          return;
        }

        const shuffled = data.questions.map((q) => shuffleQuestion(q));
        startQuiz(shuffled);
      } catch (err) {
        console.error("[QuizEngine] loadQuestions error:", err);
      }
    },
    [startQuiz]
  );

  const pause = useCallback(() => {
    console.log("[QUIZ] pause");
    stopAllTimers();
    stopAudio();
    setPaused(true);
    pausedRef.current = true;
    setPhase(PHASES.PAUSED);
    phaseRef.current = PHASES.PAUSED;
  }, [stopAllTimers, stopAudio]);

  const resume = useCallback(() => {
    console.log("[QUIZ] resume");
    setPaused(false);
    pausedRef.current = false;
  }, []);

  const nextQuestion = useCallback(() => {
    console.log("[QUIZ] nextQuestion");
    stopAllTimers();
    stopAudio();
    setPaused(false);
    pausedRef.current = false;

    const cur = phaseRef.current;
    const next = getNextPhase(cur);

    if (next) {
      goToPhase(next);
    } else {
      const nextIdx = indexRef.current + 1;
      if (nextIdx >= questionsRef.current.length) {
        const cfg = configRef.current;
        if (cfg.shouldLoop) {
          setPhase(PHASES.LOADING);
          phaseRef.current = PHASES.LOADING;
          if (onFinished) onFinished(true);
        } else {
          setPhase(PHASES.FINISHED);
          phaseRef.current = PHASES.FINISHED;
          if (onFinished) onFinished(false);
        }
      } else {
        goToPhase(PHASES.QUESTION_INTRO, nextIdx);
      }
    }
  }, [stopAllTimers, stopAudio, goToPhase, onFinished]);
  const restart = useCallback(() => {
    stopAllTimers();
    stopAudio();
    setPaused(false);
    pausedRef.current = false;
    setPhase(PHASES.LOADING);
    phaseRef.current = PHASES.LOADING;
    const cfg = configRef.current;
    if (onFinished) onFinished(true);
  }, [stopAllTimers, stopAudio, onFinished]);

  const setConfig = useCallback((config) => {
    configRef.current = { ...configRef.current, ...config };
  }, []);

  // Phase driver effect
  useEffect(() => {
    if (paused || phase === PHASES.IDLE || phase === PHASES.LOADING || phase === PHASES.PAUSED || phase === PHASES.FINISHED) {
      return;
    }

    const q = questions[currentIndex];
    if (!q) return;

    const gen = audioGenRef.current;
    const myPhase = phase;
    console.log(`[PHASE] enter ${myPhase} q#${currentIndex}`);

    const scheduleFallback = (timeoutMs) => {
      if (fallbackTimerRef.current) {
        clearTimeout(fallbackTimerRef.current);
        fallbackTimerRef.current = null;
      }
      fallbackTimerRef.current = setTimeout(() => {
        if (audioGenRef.current !== gen || phaseRef.current !== myPhase) return;
        console.log(`[QUIZ] fallback ${myPhase}`);
        const next = getNextPhase(myPhase);
        if (next) {
          goToPhase(next);
        } else {
          const nextIdx = indexRef.current + 1;
          if (nextIdx >= questionsRef.current.length) {
            const cfg = configRef.current;
            if (cfg.shouldLoop) {
              setPhase(PHASES.LOADING);
              phaseRef.current = PHASES.LOADING;
              if (onFinished) onFinished(true);
            } else {
              setPhase(PHASES.FINISHED);
              phaseRef.current = PHASES.FINISHED;
              if (onFinished) onFinished(false);
            }
          } else {
            goToPhase(PHASES.QUESTION_INTRO, nextIdx);
          }
        }
      }, timeoutMs);
    };

    if (myPhase === PHASES.COUNTDOWN) {
      setCountdown(12);
      const start = Date.now();
      countdownIntervalRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - start) / 1000);
        const remaining = Math.max(0, 12 - elapsed);
        setCountdown(remaining);
        if (onCountdownTick) onCountdownTick(remaining);
        if (remaining === 0) {
          clearInterval(countdownIntervalRef.current);
          countdownIntervalRef.current = null;
          if (audioGenRef.current === gen) {
            console.log("[PHASE] countdown → answer");
            goToPhase(PHASES.ANSWER);
          }
        }
      }, 100);
      scheduleFallback(PHASE_TIMEOUTS[PHASES.COUNTDOWN] + 5000);
    } else if (myPhase === PHASES.QUESTION_INTRO) {
      console.log("[PHASE] speak question");
      speakText(q.question, () => {
        if (audioGenRef.current === gen && phaseRef.current === myPhase) {
          console.log("[PHASE] question spoken → countdown");
          goToPhase(PHASES.COUNTDOWN);
        }
      });
      scheduleFallback(30000);
    } else if (myPhase === PHASES.ANSWER) {
      console.log("[PHASE] speak answer");
      const answerText = q.alternatives[q.correct] || "Resposta correta.";
      speakText(answerText, () => {
        if (audioGenRef.current === gen && phaseRef.current === myPhase) {
          console.log("[PHASE] answer spoken → explanation");
          goToPhase(PHASES.EXPLANATION);
        }
      });
      scheduleFallback(30000);
    } else if (myPhase === PHASES.EXPLANATION) {
      const text = q.explanation && q.explanation.trim().length > 10
        ? q.explanation
        : "Muito bem! Vamos para a próxima!";
      console.log("[PHASE] speak explanation");
      speakText(text, () => {
        if (audioGenRef.current === gen && phaseRef.current === myPhase) {
          console.log("[PHASE] explanation spoken → next question");
          const nextIdx = indexRef.current + 1;
          if (nextIdx >= questionsRef.current.length) {
            const cfg = configRef.current;
            if (cfg.shouldLoop) {
              setPhase(PHASES.LOADING);
              phaseRef.current = PHASES.LOADING;
              if (onFinished) onFinished(true);
            } else {
              setPhase(PHASES.FINISHED);
              phaseRef.current = PHASES.FINISHED;
              if (onFinished) onFinished(false);
            }
          } else {
            goToPhase(PHASES.QUESTION_INTRO, nextIdx);
          }
        }
      });
      scheduleFallback(30000);
    }

    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
      if (fallbackTimerRef.current) {
        clearTimeout(fallbackTimerRef.current);
        fallbackTimerRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, currentIndex, paused]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAudio();
      stopAllTimers();
    };
  }, [stopAudio, stopAllTimers]);

  return {
    phase,
    questions,
    currentIndex,
    countdown,
    paused,
    currentQuestion: questions[currentIndex] || null,
    PHASES,
    startQuiz,
    loadQuestions,
    pause,
    resume,
    nextQuestion,
    restart,
    setConfig,
    goToPhase,
    speakText,
  };
}
