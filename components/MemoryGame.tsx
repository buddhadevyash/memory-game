"use client"
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, Trophy, Brain, Repeat, Star } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import Confetti from 'react-confetti';

interface CardType {
  id: number;
  value: number;
  isFlipped: boolean;
  isMatched: boolean;
}

interface LevelPerformance {
  attemptsUsed: number;
  baseAttempts: number;
  timeTaken: number;
  accuracy: number;
}

const MemoryMastery = () => {
  const [level, setLevel] = useState(1);
  const [cards, setCards] = useState<CardType[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [attempts, setAttempts] = useState(0);
  const [maxAttempts, setMaxAttempts] = useState(10);
  const [matchedPairs, setMatchedPairs] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [levelPerformance, setLevelPerformance] = useState<LevelPerformance[]>([]);
  const [startTime, setStartTime] = useState<number>(0);

  const getLevelConfig = (level: number) => {
    const configs = {
      1: { pairs: 6, grid: { cols: 3, rows: 4 }, attempts: 12 },
      2: { pairs: 8, grid: { cols: 4, rows: 4 }, attempts: 15 },
      3: { pairs: 10, grid: { cols: 4, rows: 5 }, attempts: 18 },
      4: { pairs: 12, grid: { cols: 4, rows: 6 }, attempts: 20 },
      5: { pairs: 15, grid: { cols: 5, rows: 6 }, attempts: 25 },
      6: { pairs: 18, grid: { cols: 6, rows: 6 }, attempts: 30 },
      7: { pairs: 21, grid: { cols: 6, rows: 7 }, attempts: 35 },
      8: { pairs: 24, grid: { cols: 6, rows: 8 }, attempts: 40 },
      9: { pairs: 28, grid: { cols: 7, rows: 8 }, attempts: 45 },
      10: { pairs: 32, grid: { cols: 8, rows: 8 }, attempts: 50 }
    };
    return configs[level as keyof typeof configs];
  };

  const calculateDynamicAttempts = (currentLevel: number, previousPerformance: LevelPerformance[]) => {
    if (currentLevel === 1) return getLevelConfig(1).attempts;
    
    const lastPerformance = previousPerformance[currentLevel - 2];
    if (!lastPerformance) return getLevelConfig(currentLevel).attempts;

    const baseAttempts = getLevelConfig(currentLevel).attempts;
    
    const attemptRatio = lastPerformance.attemptsUsed / lastPerformance.baseAttempts;
    const timePerMove = lastPerformance.timeTaken / lastPerformance.attemptsUsed;
    const accuracyScore = lastPerformance.accuracy;

    const performanceScore = (
      attemptRatio * 0.4 +      
      timePerMove * 0.3 +       
      (1 - accuracyScore) * 0.3 
    );

    let adjustmentFactor = 1;
    
    if (performanceScore < 0.5) {
      adjustmentFactor = 0.85;  
    } else if (performanceScore < 0.7) {
      adjustmentFactor = 0.92;  
    } else if (performanceScore > 0.9) {
      adjustmentFactor = 1.15;  
    } else if (performanceScore > 1.1) {
      adjustmentFactor = 1.25;  
    }
    
    const adjustedAttempts = Math.round(baseAttempts * adjustmentFactor);
    
    const minAttempts = Math.ceil(baseAttempts * 0.75);
    const maxAttempts = Math.ceil(baseAttempts * 1.5);
    
    return Math.min(Math.max(adjustedAttempts, minAttempts), maxAttempts);
  };

  const initializeCards = () => {
    const config = getLevelConfig(level);
    const dynamicAttempts = calculateDynamicAttempts(level, levelPerformance);
    
    const values = Array.from({ length: config.pairs }, (_, i) => i + 1);
    const pairs = [...values, ...values];
    const shuffled = pairs.sort(() => Math.random() - 0.5);
    
    setCards(
      shuffled.map((value, index) => ({
        id: index,
        value,
        isFlipped: false,
        isMatched: false
      }))
    );
    
    setMaxAttempts(dynamicAttempts);
    setAttempts(0);
    setMatchedPairs(0);
    setFlippedCards([]);
    setGameOver(false);
    setGameWon(false);
    setShowCelebration(false);
    setStartTime(Date.now());
  };

  useEffect(() => {
    initializeCards();
  }, [level]);

  const handleCardClick = (id: number) => {
    if (
      gameOver ||
      gameWon ||
      flippedCards.length === 2 ||
      cards[id].isFlipped ||
      cards[id].isMatched
    ) {
      return;
    }

    const newCards = [...cards];
    newCards[id].isFlipped = true;
    setCards(newCards);
    setFlippedCards([...flippedCards, id]);

    if (flippedCards.length === 1) {
      const firstCard = cards[flippedCards[0]];
      const secondCard = cards[id];

      if (firstCard.value === secondCard.value) {
        setTimeout(() => {
          const updatedCards = cards.map(card =>
            card.id === firstCard.id || card.id === secondCard.id
              ? { ...card, isMatched: true }
              : card
          );
          setCards(updatedCards);
          setMatchedPairs(prev => prev + 1);
          setFlippedCards([]);

          const config = getLevelConfig(level);
          if (matchedPairs + 1 === config.pairs) {
            const timeTaken = (Date.now() - startTime) / 1000;
            const accuracy = (matchedPairs + 1) / attempts;
            
            setLevelPerformance(prev => [
              ...prev,
              {
                attemptsUsed: attempts,
                baseAttempts: maxAttempts,
                timeTaken,
                accuracy
              }
            ]);

            if (level === 10) {
              setGameWon(true);
              setShowCelebration(true);
            } else {
              setShowCelebration(true);
              setTimeout(() => {
                setLevel(prev => prev + 1);
                setShowCelebration(false);
              }, 3000);
            }
          }
        }, 500);
      } else {
        setTimeout(() => {
          const updatedCards = cards.map(card =>
            card.id === firstCard.id || card.id === secondCard.id
              ? { ...card, isFlipped: false }
              : card
          );
          setCards(updatedCards);
          setFlippedCards([]);
          setAttempts(prev => {
            if (prev + 1 >= maxAttempts) {
              setGameOver(true);
            }
            return prev + 1;
          });
        }, 1000);
      }
    }
  };

  const resetGame = () => {
    setLevel(1);
    setLevelPerformance([]);
    initializeCards();
  };

  const config = getLevelConfig(level);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-indigo-100 to-purple-100 p-4">
      {showCelebration && !gameWon && (
        <Confetti 
          width={window.innerWidth}
          height={window.innerHeight}
          numberOfPieces={200}
          recycle={false}
          className="fixed top-0 left-0 z-50"
        />
      )}
      
      {gameWon && (
        <Confetti 
          width={window.innerWidth}
          height={window.innerHeight}
          numberOfPieces={500}
          recycle={false}
          className="fixed top-0 left-0 z-50"
        />
      )}

      <div className="w-full max-w-6xl bg-white rounded-2xl shadow-xl p-8 border-4 border-indigo-200">
        <div className="mb-8 text-center p-6 rounded-xl border-2 border-purple-200 bg-white/50">
          <div className="flex items-center justify-center gap-2 mb-6 p-4 rounded-lg border-2 border-indigo-100 bg-white">
            <Brain className="w-8 h-8 text-indigo-600" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Memory Mastery
            </h1>
          </div>
          
          <div className="flex justify-center gap-4 mb-4">
            <div className="flex items-center gap-2 bg-indigo-50 rounded-xl px-4 py-2 border-2 border-indigo-200 shadow-sm">
              <Trophy className="w-5 h-5 text-indigo-600" />
              <span className="font-semibold">Level {level}/10</span>
            </div>
            <div className="flex items-center gap-2 bg-purple-50 rounded-xl px-4 py-2 border-2 border-purple-200 shadow-sm">
              <Repeat className="w-5 h-5 text-purple-600" />
              <span className="font-semibold">
                {attempts}/{maxAttempts} Attempts
              </span>
            </div>
            <div className="flex items-center gap-2 bg-pink-50 rounded-xl px-4 py-2 border-2 border-pink-200 shadow-sm">
              <Star className="w-5 h-5 text-pink-600" />
              <span className="font-semibold">
                {matchedPairs}/{config.pairs} Pairs
              </span>
            </div>
          </div>
        </div>

        {(gameOver || gameWon) && (
          <Alert className="mb-6 border-2 border-indigo-300 bg-gradient-to-r from-indigo-50 to-purple-50 shadow-md">
            <AlertCircle className="h-5 w-5 text-indigo-600" />
            <AlertTitle className="text-xl font-bold text-indigo-900">
              {gameWon ? "🎉 Congratulations! 🎉" : "Game Over!"}
            </AlertTitle>
            <AlertDescription className="text-lg text-indigo-700">
              {gameWon
                ? "You've conquered all 10 levels! You're a true Memory Master!"
                : "Don't worry, every master was once a beginner. Try again!"}
            </AlertDescription>
            <Button
              onClick={resetGame}
              className="mt-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold px-6 py-2 rounded-full transition-all duration-300 transform hover:scale-105 border-2 border-white/20"
            >
              Play Again
            </Button>
          </Alert>
        )}

        <div
          className="grid gap-4 p-6 rounded-xl border-2 border-indigo-100 bg-white/50"
          style={{
            gridTemplateColumns: `repeat(${config.grid.cols}, minmax(0, 1fr))`,
            gridTemplateRows: `repeat(${config.grid.rows}, minmax(0, 1fr))`
          }}
        >
          {cards.map(card => (
            <Card
              key={card.id}
              className={`
                aspect-square flex items-center justify-center text-3xl font-bold cursor-pointer
                transition-all duration-300 transform hover:scale-105
                ${card.isFlipped || card.isMatched
                  ? 'bg-gradient-to-br from-indigo-500 to-purple-500 text-white shadow-lg border-2 border-indigo-300'
                  : 'bg-white hover:shadow-xl border-2 border-indigo-200 hover:border-indigo-300'}
                ${showCelebration && card.isMatched ? 'animate-bounce' : ''}
                rounded-xl
              `}
              onClick={() => handleCardClick(card.id)}
            >
              {(card.isFlipped || card.isMatched) ? (
                <div className="transform transition-all duration-300 rotate-y-180">
                  {card.value}
                </div>
              ) : (
                <div className="text-indigo-300 text-4xl">?</div>
              )}
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MemoryMastery;