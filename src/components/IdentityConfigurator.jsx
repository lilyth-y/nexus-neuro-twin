import React, { useState, useEffect, Suspense } from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import DNAHelix from './DNAHelix';
import BrainWaveVisualizer from './BrainWaveVisualizer';
import NeuroKinematicDashboard from './NeuroKinematicDashboard';

const IdentityConfigurator = ({ onComplete, onCancel, coupling, setCoupling }) => {
  const [step, setStep] = useState('genomics'); // genomics | personality | neural | kinematics | sync
  const [progress, setProgress] = useState(0);
  // Removed local coupling state

  // Simulated Personality Data (Big Five)
  const [traits, setTraits] = useState([
    { subject: 'Openness', A: 80, fullMark: 100 },
    { subject: 'Conscientiousness', A: 65, fullMark: 100 },
    { subject: 'Extroversion', A: 90, fullMark: 100 },
    { subject: 'Agreeableness', A: 70, fullMark: 100 },
    { subject: 'Neuroticism', A: 40, fullMark: 100 },
  ]);

  useEffect(() => {
    if (step === 'sync') {
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            setTimeout(() => onComplete(traits), 500);
            return 100;
          }
          return prev + 2;
        });
      }, 50);
      return () => clearInterval(interval);
    }
  }, [step, onComplete, traits]);

  const randomizeTraits = () => {
    const newTraits = traits.map(t => ({
      ...t,
      A: Math.floor(Math.random() * 60) + 40 // Random value between 40 and 100
    }));
    setTraits(newTraits);
  };

  return (
    <div className="identity-configurator-overlay glass-panel" style={{ width: step === 'kinematics' ? '900px' : '500px', transition: 'width 0.3s' }}>
      <div className="config-header">
        <h2>BIO-DIGITAL LINK INTERFACE</h2>
        <button onClick={onCancel} className="btn-close">×</button>
      </div>

      <div className="config-content">
        {/* TAB NAVIGATION For Dev/Demo */}
        <div style={{ display: 'flex', gap: '5px', marginBottom: '10px', justifyContent: 'center' }}>
            <button className={`btn-xs ${step === 'genomics' ? 'active' : ''}`} onClick={() => setStep('genomics')}>DNA</button>
            <button className={`btn-xs ${step === 'personality' ? 'active' : ''}`} onClick={() => setStep('personality')}>PSYCHE</button>
            <button className={`btn-xs ${step === 'neural' ? 'active' : ''}`} onClick={() => setStep('neural')}>PHYSICS</button>
            <button className={`btn-xs ${step === 'kinematics' ? 'active' : ''}`} onClick={() => setStep('kinematics')}>MATH</button>
        </div>

        {step === 'genomics' && (
          <div className="step-genomics fade-in" style={{ width: '100%', textAlign: 'center' }}>
             <div className="dna-viz-container" style={{ width: '100%', height: '300px' }}>
                <Canvas camera={{ position: [0, 0, 15], fov: 45 }}>
                    <ambientLight intensity={0.5} />
                    <pointLight position={[10, 10, 10]} intensity={1} />
                    <Suspense fallback={null}>
                        <DNAHelix />
                    </Suspense>
                    <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={2} />
                </Canvas>
            </div>
            <p className="status-text blink" style={{ marginTop: '1rem' }}>ANALYZING GENOMIC SEQUENCES...</p>
            <div className="trait-list" style={{ maxWidth: '400px', margin: '20px auto' }}>
              <div className="trait-item"><span>ORIGIN:</span> <span className="neon-cyan">EARTH-PRIME</span></div>
              <div className="trait-item"><span>BLOODLINE:</span> <span className="neon-magenta">AUGMENTED</span></div>
              <div className="trait-item"><span>POTENTIAL:</span> <span className="neon-green">UNLIMITED</span></div>
            </div>
            <button className="btn btn-primary glow-effect mt-4" onClick={() => setStep('personality')}>
              DECODE PERSONALITY MATRIX
            </button>
          </div>
        )}

        {step === 'personality' && (
          <div className="step-personality fade-in">
            <h3>PSYCHE MATRIX CONFIGURATION</h3>
            <div className="chart-container" style={{ width: '100%', height: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={traits}>
                  <PolarGrid stroke="#ffffff33" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#00d4ff', fontSize: 12 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar
                    name="Identity"
                    dataKey="A"
                    stroke="#ff00ff"
                    strokeWidth={3}
                    fill="#ff00ff"
                    fillOpacity={0.4}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <div className="controls">
              <button className="btn btn-secondary" onClick={randomizeTraits}>RANDOMIZE TRAITS</button>
              <button className="btn btn-primary glow-effect" onClick={() => setStep('neural')}>
                INITIALIZE NEURAL ENGINE
              </button>
            </div>
          </div>
        )}

        {step === 'neural' && (
          <div className="step-neural fade-in" style={{ width: '100%', textAlign: 'center' }}>
            <h3>NEURAL PHYSICS SIMULATION</h3>
            <div className="neural-viz-container" style={{ width: '100%', height: '300px', background: '#000' }}>
               <Canvas camera={{ position: [0, 0, 10], fov: 60 }}>
                  <ambientLight intensity={0.2} />
                  <Suspense fallback={null}>
                      <BrainWaveVisualizer couplingStrength={coupling} />
                  </Suspense>
                  <OrbitControls />
               </Canvas>
            </div>
            
            <div className="controls" style={{ marginTop: '20px', width: '80%', margin: '20px auto' }}>
                <label style={{ display: 'block', marginBottom: '10px' }}>
                  SYNCHRONIZATION COUPLING (K): <span className="neon-green">{coupling}</span>
                </label>
                <input 
                  type="range" 
                  min="0" 
                  max="10" 
                  step="0.1" 
                  value={coupling} 
                  onChange={(e) => setCoupling(parseFloat(e.target.value))}
                  style={{ width: '100%' }}
                />
                <p style={{ fontSize: '0.8rem', color: '#aaa', marginTop: '5px' }}>
                  Adjust K to observe Phase Transition (Chaos → Sync)
                </p>
                
                <div style={{display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '20px'}}>
                     <button className="btn btn-secondary" onClick={() => setStep('kinematics')}>
                        VIEW MATHEMATICS
                     </button>
                     <button className="btn btn-primary glow-effect" onClick={() => setStep('sync')}>
                        COMMENCE BIO-SYNC
                     </button>
                </div>
            </div>
          </div>
        )}

        {step === 'kinematics' && (
            <div className="step-kinematics fade-in" style={{ width: '100%', height: '500px' }}>
                <h3 style={{ textAlign: 'center' }}>NEURO-KINEMATIC SKELETON</h3>
                <NeuroKinematicDashboard />
                <div className="controls" style={{ marginTop: '20px', textAlign: 'center' }}>
                    <button className="btn btn-primary glow-effect" onClick={() => setStep('sync')}>
                        COMMENCE BIO-SYNC
                    </button>
                </div>
            </div>
        )}

        {step === 'sync' && (
          <div className="step-sync fade-in">
            <div className="sync-loader">
              <div className="sync-circle" style={{ width: `${progress}%`, height: `${progress}%` }}></div>
              <span className="sync-percentage">{progress}%</span>
            </div>
            <p className="status-text">SYNCHRONIZING BIO-DATA WITH DIGITAL HOST...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default IdentityConfigurator;
