import React, { useEffect, useRef, useState } from 'react';
import { LineChart, Line, ResponsiveContainer, YAxis, BarChart, Bar, XAxis } from 'recharts';
import { useNeuroStream } from '../hooks/useNeuroStream';

const NeuroKinematicDashboard = ({ useLiveBackend = false }) => {
  const [data, setData] = useState([]);
  const [freqData, setFreqData] = useState([]);
  const [currentAction, setCurrentAction] = useState('STAND');
  const canvasRef = useRef(null);
  const vectorRef = useRef(null);
  
  // Connect to backend if useLiveBackend is true
  const { data: backendData, isConnected, error } = useNeuroStream(
    '/ws/stream', 
    useLiveBackend
  );

  // Physics Parameters (local simulation fallback)
  const params = useRef({
    alpha: 0.5,
    beta: 0.5,
    time: 0
  });

  // Process backend data when received
  useEffect(() => {
    if (!backendData || !useLiveBackend) return;
    
    const { sim_params, fluidity_index, current_action } = backendData;
    if (sim_params) {
      params.current.alpha = sim_params.alpha || 0.5;
      params.current.beta = sim_params.beta || 0.5;
    }
    if (current_action) {
      setCurrentAction(current_action);
    }
  }, [backendData, useLiveBackend]);

  useEffect(() => {
    let animationFrame;
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    const loop = () => {
      params.current.time += 0.05;
      const t = params.current.time;
      
      // Get values from backend or simulate locally
      let theta, beta, alphaPower, betaPower;
      
      if (useLiveBackend && backendData?.sim_params) {
        // Use REAL backend data
        theta = backendData.sim_params.theta || 0.5;
        beta = backendData.sim_params.beta || 0.5;
        alphaPower = (1 - theta) * 100; // Inverse relation for visualization
        betaPower = beta * 100;
      } else {
        // MOCK: Local simulation
        const alphaWave = Math.sin(t * 2) * (0.5 + Math.random() * 0.2); 
        const betaWave = Math.sin(t * 5) * 0.3;
        alphaPower = Math.abs(alphaWave) * 100;
        betaPower = Math.abs(betaWave) * 100;
        theta = alphaWave;
        beta = betaWave;
      }
      
      const rawSignal = theta + beta;

      // Update Chart Data (Rolling Buffer)
      setData(prev => {
        const next = [...prev, { time: t, value: rawSignal }];
        if (next.length > 50) next.shift();
        return next;
      });

      // Frequency Domain Data
      setFreqData([
        { name: 'Theta', power: 20 + Math.random() * 10, fill: '#8884d8' },
        { name: 'Alpha', power: alphaPower, fill: '#00d4ff' },
        { name: 'Beta', power: betaPower, fill: '#ff00ff' },
      ]);

      // Spin Wave Visualization
      const damping = 1.0 - (alphaPower / 100) * 0.5;
      const freq = 5 + (betaPower / 100) * 5;
      
      const imgData = ctx.createImageData(width, height);
      for (let x = 0; x < width; x += 4) {
        for (let y = 0; y < height; y += 4) {
          const dx = x - width / 2;
          const dy = y - height / 2;
          const dist = Math.sqrt(dx*dx + dy*dy);
          
          const wave = Math.sin(dist * 0.1 - t * freq) * damping;
          
          const r = wave > 0 ? wave * 255 : 0;
          const b = wave < 0 ? -wave * 255 : 0;
          
          for(let i=0; i<4; i++){
              for(let j=0; j<4; j++){
                  if(x+i < width && y+j < height){
                     const idx = ((x+i) + (y+j)*width) * 4;
                     imgData.data[idx] = r;
                     imgData.data[idx+1] = 0;
                     imgData.data[idx+2] = b + 50;
                     imgData.data[idx+3] = 255;
                  }
              }
          }
        }
      }
      ctx.putImageData(imgData, 0, 0);

      // Kinematic Vector
      const mx = Math.cos(t * (freq * 0.1)) * (damping * 100);
      const my = Math.sin(t * (freq * 0.1)) * (damping * 100);
      
      if (vectorRef.current) {
        vectorRef.current.style.transform = `translate(-50%, -50%) rotate(${Math.atan2(my, mx)}rad)`;
        vectorRef.current.style.height = `${Math.sqrt(mx*mx + my*my) * 2}px`;
      }

      animationFrame = requestAnimationFrame(loop);
    };

    loop();
    return () => cancelAnimationFrame(animationFrame);
  }, [useLiveBackend, backendData]);

  return (
    <div className="neuro-dashboard" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', height: '100%', padding: '10px' }}>
      
      {/* Connection Status Banner */}
      {useLiveBackend && (
        <div style={{ 
          gridColumn: '1 / -1', 
          padding: '8px', 
          borderRadius: '8px',
          background: isConnected ? 'rgba(0, 255, 100, 0.2)' : 'rgba(255, 100, 0, 0.2)',
          border: `1px solid ${isConnected ? '#00ff64' : '#ff6400'}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span style={{ color: isConnected ? '#00ff64' : '#ff6400' }}>
            {isConnected ? '🔗 LIVE: Backend Connected' : '⚠️ Connecting to Backend...'}
          </span>
          {currentAction && <span style={{ color: '#00d4ff' }}>Action: {currentAction}</span>}
        </div>
      )}

      {/* PANEL 1: EEG Signal */}
      <div className="glass-panel" style={{ padding: '10px' }}>
        <h4 className="neon-cyan">1. EEG SIGNAL {useLiveBackend ? '(LIVE)' : '(MOCK)'}</h4>
        <div style={{ width: '100%', height: '150px' }}>
            <ResponsiveContainer>
            <LineChart data={data}>
                <YAxis domain={[-1.5, 1.5]} hide />
                <Line type="monotone" dataKey="value" stroke="#00d4ff" strokeWidth={2} dot={false} isAnimationActive={false} />
            </LineChart>
            </ResponsiveContainer>
        </div>
      </div>

      {/* PANEL 2: FFT */}
      <div className="glass-panel" style={{ padding: '10px' }}>
        <h4 className="neon-magenta">2. SPECTRAL DENSITY (FFT)</h4>
        <div style={{ width: '100%', height: '150px' }}>
            <ResponsiveContainer>
            <BarChart data={freqData}>
                <XAxis dataKey="name" tick={{fill:'white', fontSize: 10}} />
                <Bar dataKey="power" isAnimationActive={false} />
            </BarChart>
            </ResponsiveContainer>
        </div>
      </div>

      {/* PANEL 3: Spin Waves */}
      <div className="glass-panel" style={{ padding: '10px', position: 'relative' }}>
         <h4 className="neon-green">3. SPIN WAVE FIELD {useLiveBackend ? '(PHYSICS)' : '(SIM)'}</h4>
         <canvas ref={canvasRef} width={200} height={150} style={{ width: '100%', height: '150px', background: 'black', borderRadius: '8px' }} />
         <div style={{ position: 'absolute', bottom: 5, right: 5, fontSize: '0.7em', color: '#aaa' }}>
            {useLiveBackend ? 'MagnonicController Active' : 'Local Simulation'}
         </div>
      </div>

      {/* PANEL 4: Kinematics */}
      <div className="glass-panel" style={{ padding: '10px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
         <h4 style={{color: 'white'}}>4. KINEMATIC VECTOR</h4>
         <div style={{ width: '100px', height: '100px', border: '1px dashed #555', borderRadius: '50%', position: 'relative', marginTop: '20px' }}>
            <div 
                ref={vectorRef}
                style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    width: '4px',
                    backgroundColor: '#fff',
                    boxShadow: '0 0 10px #fff',
                    transformOrigin: 'top center',
                    transition: 'height 0.1s linear'
                }}
            />
            <div style={{ position: 'absolute', top: '50%', left: '50%', width: '10px', height: '10px', background: 'red', borderRadius: '50%', transform: 'translate(-50%, -50%)' }} />
         </div>
         <p style={{ marginTop: '10px', fontSize: '0.8em', color: '#aaa' }}>AVATAR MOTION DRIVER</p>
      </div>

    </div>
  );
};

export default NeuroKinematicDashboard;
