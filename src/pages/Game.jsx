import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from "../utils";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "../components/ui/Button";
import { ArrowLeft, Volume2, VolumeX } from 'lucide-react';
import GameHeader from '../components/game/GameHeader';
import MathProblem from '../components/game/MathProblem';
import LevelComplete from '../components/game/LevelComplete';
import Confetti from '../components/game/Confetti';
import NewBadgeModal from '../components/game/NewBadgeModal';

const levelConfigs = {
  1: { operations: ['+'], maxNum: 10, timeLimit: 15, questions: 10 },
  2: { operations: ['-'], maxNum: 10, timeLimit: 15, questions: 10 },
  3: { operations: ['+', '-'], maxNum: 20, timeLimit: 12, questions: 10 },
  4: { operations: ['×'], maxNum: 10, timeLimit: 15, questions: 10 },
  5: { operations: ['÷'], maxNum: 50, timeLimit: 15, questions: 10 },
  6: { operations: ['×', '÷'], maxNum: 12, timeLimit: 12, questions: 10 },
  7: { operations: ['+', '-', '×', '÷'], maxNum: 20, timeLimit: 12, questions: 12 },
  8: { operations: ['+', '-', '×', '÷'], maxNum: 50, timeLimit: 10, questions: 12 },
  9: { operations: ['+', '-', '×', '÷'], maxNum: 100, timeLimit: 8, questions: 15 },
  10: { operations: ['+', '-', '×', '÷'], maxNum: 100, timeLimit: 6, questions: 20 },
};

const gradients = [
  'from-pink-500 via-rose-500 to-red-500',
  'from-orange-500 via-amber-500 to-yellow-500',
  'from-lime-500 via-green-500 to-emerald-500',
  'from-teal-500 via-cyan-500 to-sky-500',
  'from-blue-500 via-indigo-500 to-violet-500',
  'from-purple-500 via-fuchsia-500 to-pink-500',
  'from-rose-500 via-pink-500 to-fuchsia-500',
  'from-amber-500 via-orange-500 to-red-500',
  'from-emerald-500 via-teal-500 to-cyan-500',
  'from-violet-500 via-purple-500 to-indigo-500',
];

export default function Game() {
  const urlParams = new URLSearchParams(window.location.search);
  const level = parseInt(urlParams.get('level')) || 1;
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [problem, setProblem] = useState(null);
  const [options, setOptions] = useState([]);
  const [gameComplete, setGameComplete] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [newBadge, setNewBadge] = useState(null);
  const [muted, setMuted] = useState(false);
  const [answerStartTime, setAnswerStartTime] = useState(null);

  const config = levelConfigs[level] || levelConfigs[1];
  const gradient = gradients[(level - 1) % gradients.length];

  const { data: progressList } = useQuery({
    queryKey: ['playerProgress'],
    queryFn: () => base44.entities.PlayerProgress.list(),
  });

  const progress = progressList?.[0];

  const updateProgressMutation = useMutation({
    mutationFn: (data) => base44.entities.PlayerProgress.update(progress.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playerProgress'] });
    }
  });

  const generateProblem = useCallback(() => {
    const operation = config.operations[Math.floor(Math.random() * config.operations.length)];
    let num1, num2, answer;

    switch (operation) {
      case '+':
        num1 = Math.floor(Math.random() * config.maxNum) + 1;
        num2 = Math.floor(Math.random() * config.maxNum) + 1;
        answer = num1 + num2;
        break;
      case '-':
        num1 = Math.floor(Math.random() * config.maxNum) + 1;
        num2 = Math.floor(Math.random() * num1) + 1;
        answer = num1 - num2;
        break;
      case '×':
        num1 = Math.floor(Math.random() * config.maxNum) + 1;
        num2 = Math.floor(Math.random() * config.maxNum) + 1;
        answer = num1 * num2;
        break;
      case '÷':
        num2 = Math.floor(Math.random() * 10) + 1;
        answer = Math.floor(Math.random() * 10) + 1;
        num1 = num2 * answer;
        break;
      default:
        num1 = 1;
        num2 = 1;
        answer = 2;
    }

    // Generate wrong options
    const wrongOptions = new Set();
    while (wrongOptions.size < 3) {
      let wrong;
      const offset = Math.floor(Math.random() * 10) - 5;
      wrong = answer + (offset === 0 ? 1 : offset);
      if (wrong !== answer && wrong > 0) {
        wrongOptions.add(wrong);
      }
    }

    const allOptions = [answer, ...wrongOptions];
    allOptions.sort(() => Math.random() - 0.5);

    setProblem({
      display: `${num1} ${operation} ${num2} = ?`,
      answer,
    });
    setOptions(allOptions);
    setAnswerStartTime(Date.now());
  }, [config]);

  useEffect(() => {
    generateProblem();
  }, [generateProblem]);

  const checkNewBadges = (updatedProgress) => {
    const badges = [...(updatedProgress.badges || [])];
    let newBadgeId = null;

    // First problem
    if (updatedProgress.total_problems_solved === 1 && !badges.includes('first_problem')) {
      badges.push('first_problem');
      newBadgeId = 'first_problem';
    }
    // Streak badges
    if (updatedProgress.current_streak >= 5 && !badges.includes('streak_5')) {
      badges.push('streak_5');
      newBadgeId = 'streak_5';
    }
    if (updatedProgress.current_streak >= 10 && !badges.includes('streak_10')) {
      badges.push('streak_10');
      newBadgeId = 'streak_10';
    }
    // Level badges
    if (level >= 5 && !badges.includes('level_5')) {
      badges.push('level_5');
      newBadgeId = 'level_5';
    }
    if (level >= 10 && !badges.includes('level_10')) {
      badges.push('level_10');
      newBadgeId = 'level_10';
    }
    // Problems solved badges
    if (updatedProgress.total_problems_solved >= 50 && !badges.includes('problems_50')) {
      badges.push('problems_50');
      newBadgeId = 'problems_50';
    }
    if (updatedProgress.total_problems_solved >= 100 && !badges.includes('problems_100')) {
      badges.push('problems_100');
      newBadgeId = 'problems_100';
    }
    // Accuracy badge
    if (updatedProgress.accuracy_percentage >= 90 && !badges.includes('accuracy_90')) {
      badges.push('accuracy_90');
      newBadgeId = 'accuracy_90';
    }

    return { badges, newBadgeId };
  };

  const handleAnswer = async (answer) => {
    const isCorrect = answer === problem.answer;
    const timeTaken = (Date.now() - answerStartTime) / 1000;
    
    let newStreak = isCorrect ? streak + 1 : 0;
    let newScore = isCorrect ? score + 1 : score;
    
    setStreak(newStreak);
    setScore(newScore);

    // Speed demon badge check
    const speedBadgeEarned = isCorrect && timeTaken < 3 && !(progress?.badges || []).includes('speed_demon');

    if (currentQuestion + 1 >= config.questions) {
      // Level complete
      const percentage = (newScore / config.questions) * 100;
      const starsEarned = percentage >= 90 ? 3 : percentage >= 70 ? 2 : percentage >= 50 ? 1 : 0;
      const xpEarned = newScore * 10 + starsEarned * 20;
      
      const updatedProgress = {
        ...progress,
        total_problems_solved: (progress?.total_problems_solved || 0) + newScore,
        total_attempts: (progress?.total_attempts || 0) + config.questions,
        current_streak: newStreak,
        best_streak: Math.max(progress?.best_streak || 0, newStreak),
        total_stars: (progress?.total_stars || 0) + starsEarned,
        xp_points: (progress?.xp_points || 0) + xpEarned,
        accuracy_percentage: Math.round(
          (((progress?.total_problems_solved || 0) + newScore) / 
          ((progress?.total_attempts || 0) + config.questions)) * 100
        ),
        current_level: Math.max(progress?.current_level || 1, level + 1),
        completed_levels: [...new Set([...(progress?.completed_levels || []), level])],
      };

      const { badges, newBadgeId } = checkNewBadges(updatedProgress);
      
      // Perfect level badge
      if (percentage === 100 && !badges.includes('perfect_level')) {
        badges.push('perfect_level');
        if (!newBadgeId) setNewBadge('perfect_level');
      }
      
      // Speed demon badge
      if (speedBadgeEarned && !badges.includes('speed_demon')) {
        badges.push('speed_demon');
        if (!newBadgeId) setNewBadge('speed_demon');
      }

      updatedProgress.badges = badges;
      if (newBadgeId) setNewBadge(newBadgeId);

      await updateProgressMutation.mutateAsync(updatedProgress);
      
      if (starsEarned >= 2) setShowConfetti(true);
      setGameComplete(true);
    } else {
      setCurrentQuestion(currentQuestion + 1);
      generateProblem();
    }
  };

  const handleNextLevel = () => {
    navigate(createPageUrl(`Game?level=${level + 1}`));
    setCurrentQuestion(0);
    setScore(0);
    setStreak(0);
    setGameComplete(false);
    setShowConfetti(false);
  };

  const handleRetry = () => {
    setCurrentQuestion(0);
    setScore(0);
    setStreak(0);
    setGameComplete(false);
    setShowConfetti(false);
    generateProblem();
  };

  const handleHome = () => {
    navigate(createPageUrl('Home'));
  };

  const percentage = Math.round((score / config.questions) * 100);
  const starsEarned = percentage >= 90 ? 3 : percentage >= 70 ? 2 : percentage >= 50 ? 1 : 0;
  const xpEarned = score * 10 + starsEarned * 20;

  return (
    <div className={`min-h-screen bg-gradient-to-br ${gradient} p-4 md:p-6`}>
      <Confetti trigger={showConfetti} />
      
      {newBadge && (
        <NewBadgeModal 
          badgeId={newBadge} 
          onClose={() => setNewBadge(null)} 
        />
      )}

      <div className="max-w-4xl mx-auto">
        {/* Navigation */}
        <div className="flex items-center justify-between mb-6">
          <Link to={createPageUrl('Home')}>
            <Button 
              variant="ghost" 
              className="text-white hover:bg-white/20 rounded-xl"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back
            </Button>
          </Link>
          
          <div className="flex items-center gap-4">
            <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-2xl">
              <span className="text-white font-bold">Level {level}</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20 rounded-xl"
              onClick={() => setMuted(!muted)}
            >
              {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Header */}
        <GameHeader 
          stars={progress?.total_stars || 0}
          xp={progress?.xp_points || 0}
          streak={streak}
          level={level}
        />

        {/* Game Area */}
        <div className="mt-8">
          <AnimatePresence mode="wait">
            {!gameComplete && problem && (
              <MathProblem
                key={currentQuestion}
                problem={problem}
                options={options}
                onAnswer={handleAnswer}
                questionNumber={currentQuestion + 1}
                totalQuestions={config.questions}
                timeLimit={config.timeLimit}
              />
            )}
          </AnimatePresence>
        </div>

        {/* Level Complete Modal */}
        {gameComplete && (
          <LevelComplete
            level={level}
            score={score}
            totalQuestions={config.questions}
            starsEarned={starsEarned}
            xpEarned={xpEarned}
            onNextLevel={handleNextLevel}
            onRetry={handleRetry}
            onHome={handleHome}
            isLastLevel={level >= 10}
          />
        )}
      </div>
    </div>
  );
}