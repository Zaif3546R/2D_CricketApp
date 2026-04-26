import React, { useState, useEffect, useRef } from 'react';
import './App.css';

function App() {
  const [battingStyle, setBattingStyle] = useState('aggressive');
  const [score, setScore] = useState({ runs: 0, wickets: 0, ballsLeft: 12 });
  
  const [sliderPosition, setSliderPosition] = useState(0);
  const [isSliderMoving, setIsSliderMoving] = useState(false);
  const [gamePhase, setGamePhase] = useState('idle'); // idle, bowling, calculating, batting, result
  const [resultText, setResultText] = useState('Press Play Shot');
  const [ballDirection, setBallDirection] = useState('');
  
  const sliderPosRef = useRef(0); // Real-time ref for freeze logic

  // Probability Configurations
  const probabilities = {
    aggressive: [
      { outcome: 'W', label: 'Wicket', prob: 0.40, color: '#e74c3c' },
      { outcome: '0', label: 'Dot Ball', prob: 0.10, color: '#95a5a6' },
      { outcome: '1', label: '1 Run', prob: 0.10, color: '#3498db' },
      { outcome: '2', label: '2 Runs', prob: 0.10, color: '#2ecc71' },
      { outcome: '3', label: '3 Runs', prob: 0.05, color: '#9b59b6' },
      { outcome: '4', label: 'FOUR!', prob: 0.10, color: '#f1c40f' },
      { outcome: '6', label: 'SIX!', prob: 0.15, color: '#e67e22' }
    ],
    defensive: [
      { outcome: 'W', label: 'Wicket', prob: 0.05, color: '#e74c3c' },
      { outcome: '0', label: 'Dot Ball', prob: 0.30, color: '#95a5a6' },
      { outcome: '1', label: '1 Run', prob: 0.30, color: '#3498db' },
      { outcome: '2', label: '2 Runs', prob: 0.20, color: '#2ecc71' },
      { outcome: '3', label: '3 Runs', prob: 0.05, color: '#9b59b6' },
      { outcome: '4', label: 'FOUR!', prob: 0.08, color: '#f1c40f' },
      { outcome: '6', label: 'SIX!', prob: 0.02, color: '#e67e22' }
    ]
  };

  const currentProbs = probabilities[battingStyle];

  // Bonus: Commentary System
  const commentary = {
    W: ["OUT! Bowled him!", "Edge and gone! Wicket falls.", "Clean bowled! What a delivery!"],
    0: ["Good defensive shot. Dot ball.", "Straight to the fielder.", "Well bowled, no run."],
    1: ["Quick single taken.", "Pushed to the gap for 1.", "Rotates the strike."],
    2: ["Good running between the wickets!", "Pushed past the infield for 2.", "Solid placement."],
    3: ["Excellent running! 3 runs.", "Gap in the field, they hustle for 3.", "Well played!"],
    4: ["FOUR! Cracking shot!", "Races to the boundary!", "Timing perfection. 4 runs."],
    6: ["SIX! Out of the ground!", "Massive hit! 6 runs.", "Crowd goes wild! Maximum!"]
  };

  // Slider Animation Loop
  useEffect(() => {
    let animationFrame;
    if (isSliderMoving && gamePhase === 'idle') {
      const animate = () => {
        let pos = sliderPosRef.current + 1.5;
        if (pos > 100) pos = 0;
        sliderPosRef.current = pos;
        setSliderPosition(pos);
        animationFrame = requestAnimationFrame(animate);
      };
      animationFrame = requestAnimationFrame(animate);
    }
    return () => cancelAnimationFrame(animationFrame);
  }, [isSliderMoving, gamePhase]);

  const handlePlayShot = () => {
    if (score.ballsLeft <= 0 || score.wickets >= 2 || gamePhase !== 'idle') return;

    // 1. Start Bowling Animation
    setGamePhase('bowling');
    setBallDirection('');

    // 2. After ball reaches batsman (1s), freeze slider & calculate
    setTimeout(() => {
      setIsSliderMoving(false);
      setGamePhase('calculating');

      const frozenPos = sliderPosRef.current;
      let cumulativeProb = 0;
      let selectedOutcome = null;

      for (let segment of currentProbs) {
        const segmentEnd = cumulativeProb + (segment.prob * 100);
        if (frozenPos >= cumulativeProb && frozenPos < segmentEnd) {
          selectedOutcome = segment;
          break;
        }
        cumulativeProb = segmentEnd;
      }
      if (!selectedOutcome) selectedOutcome = currentProbs[currentProbs.length - 1];

      // 3. Trigger Batting Animation & Set Direction
      setGamePhase('batting');
      setBallDirection(selectedOutcome.outcome);

      // 4. Update Score & Commentary after batting animation (0.6s)
      setTimeout(() => {
        const newScore = { ...score };
        newScore.ballsLeft -= 1;

        let displayText = '';
        if (selectedOutcome.outcome === 'W') {
          newScore.wickets += 1;
          displayText = `OUT! ${commentary.W[Math.floor(Math.random() * commentary.W.length)]}`;
        } else {
          const runs = parseInt(selectedOutcome.outcome);
          newScore.runs += runs;
          const comments = commentary[selectedOutcome.outcome];
          displayText = `${selectedOutcome.label} ${comments[Math.floor(Math.random() * comments.length)]}`;
        }

        setResultText(displayText);
        setScore(newScore);
        setGamePhase('result');

        // 5. Reset for next ball after 2s
        setTimeout(() => {
          if (newScore.ballsLeft > 0 && newScore.wickets < 2) {
            setGamePhase('idle');
            setIsSliderMoving(true);
            setBallDirection('');
            setResultText('Press Play Shot');
          }
        }, 2000);
      }, 600);
    }, 1000); // Matches CSS bowling duration
  };

  const isGameOver = score.ballsLeft === 0 || score.wickets >= 2;

  return (
    <div className="cricket-app">
      <div className="scoreboard">
        <h1> 2D Cricket</h1>
        <div className="stats">
          <span>Runs: <b>{score.runs}</b></span>
          <span>Wickets: <b>{score.wickets}/2</b></span>
          <span>Balls: <b>{score.ballsLeft}/12</b></span>
        </div>
        {isGameOver && (
          <div className="game-over">
            Innings Over! Final: {score.runs}/{score.wickets}
            <button onClick={() => {
              setScore({ runs: 0, wickets: 0, ballsLeft: 12 });
              setGamePhase('idle');
              setIsSliderMoving(true);
              setResultText('Press Play Shot');
              setBallDirection('');
            }}>Restart Match</button>
          </div>
        )}
      </div>

      <div className="field">
        <div className="pitch"></div>
        <div className={`batsman ${gamePhase === 'batting' ? 'swinging' : ''}`}>
          <div className="batsman-head"></div>
          <div className="batsman-body"></div>
          <div className="batsman-bat"></div>
        </div>
        <div className={`ball ${gamePhase === 'bowling' ? 'bowling' : ''} ${gamePhase === 'batting' ? `fly-${ballDirection}` : ''}`} id="ball"></div>
      </div>

      <div className="result-display" style={{ color: gamePhase === 'result' && ballDirection === 'W' ? '#e74c3c' : '#f9ca24' }}>
        {resultText}
      </div>

      <div className="controls">
        <button 
          className={`style-btn ${battingStyle === 'aggressive' ? 'active' : ''}`} 
          onClick={() => setBattingStyle('aggressive')}
          disabled={gamePhase !== 'idle' || score.ballsLeft < 12}
        >
           Aggressive
        </button>
        <button 
          className={`style-btn ${battingStyle === 'defensive' ? 'active' : ''}`} 
          onClick={() => setBattingStyle('defensive')}
          disabled={gamePhase !== 'idle' || score.ballsLeft < 12}
        >
          🛡️ Defensive
        </button>
        <button 
          className="play-btn" 
          disabled={isGameOver || gamePhase !== 'idle'}
          onClick={handlePlayShot}
        >
          {gamePhase === 'bowling' ? 'Bowling...' : gamePhase === 'batting' ? 'Shot!' : 'Play Shot'}
        </button>
      </div>

      <div className="power-bar-section">
        <div className="power-bar-labels">
          <span>Style: <b>{battingStyle.toUpperCase()}</b> | Slider Pos: <b>{Math.round(sliderPosition)}%</b></span>
        </div>
        <div className="power-bar-container">
          {currentProbs.map((segment, index) => (
            <div key={index} className="power-segment" style={{ width: `${segment.prob * 100}%`, backgroundColor: segment.color }}>
              <span className="segment-label">{segment.outcome}</span>
            </div>
          ))}
          <div className="slider" style={{ left: `${sliderPosition}%`, display: gamePhase === 'idle' ? 'block' : 'none' }}></div>
        </div>
      </div>
    </div>
  );
}

export default App;