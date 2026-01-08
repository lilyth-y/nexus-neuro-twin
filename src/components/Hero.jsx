import React, { Suspense } from 'react';
import GlassCard from './GlassCard';
const AvatarViewer = React.lazy(() => import('./AvatarViewer'));

const Hero = ({ onInitialize, avatarUrl, onEnterWorld, onConfigureIdentity, identityData }) => {
  return (
    <section id="home" className="hero-section">
      <div className="hero-content">
        <h1 className="glitch-text" data-text="ASCEND TO THE METAVERSE">
          ASCEND TO THE <span className="highlight-neon">METAVERSE</span>
        </h1>
        <p className="hero-subtitle">
          Forge your Digital Human Twin. Experience the next generation of virtual interaction and hyper-realistic idols.
        </p>
        <div className="hero-buttons">
          <button className="btn btn-primary glow-effect" onClick={onInitialize}>
            {avatarUrl ? 'Re-Initialize Twin' : 'Initialize Twin'}
          </button>
          
          {avatarUrl && !identityData && (
            <button className="btn btn-primary glow-effect" style={{ marginLeft: '1rem', borderColor: '#ff00ff', color: '#ff00ff' }} onClick={onConfigureIdentity}>
              Bio-Link Identity
            </button>
          )}

          {avatarUrl && identityData && (
             <button className="btn btn-primary glow-effect" style={{ marginLeft: '1rem', background: '#00f3ff', color: 'black' }} onClick={onEnterWorld}>
               Enter World
             </button>
          )}

          {!avatarUrl && <button className="btn btn-secondary glass-effect">Explore Idols</button>}
        </div>
      </div>
      
      {/* Central Visual Stage */}
      <div className="hero-visual">
         <div className="hologram-circle"></div>
         {avatarUrl && (
             <div style={{ width: '100%', height: '100%', position: 'relative', zIndex: 2 }}>
                <React.Suspense fallback={<div>Loading Avatar...</div>}>
                    <AvatarViewer avatarUrl={avatarUrl} />
                </React.Suspense>
                
                {identityData && (
                  <div className="stats-overlay glass-panel slide-up">
                    <h3 className="neon-cyan">BIO-SYNC ACTIVE</h3>
                    <div className="stat-row">
                      <span>Dominant Trait:</span>
                      <span className="bold neon-magenta">
                        {identityData.reduce((prev, current) => (prev.A > current.A) ? prev : current).subject.toUpperCase()}
                      </span>
                    </div>
                    <div className="stat-row">
                      <span>Neuro-Link:</span>
                      <span className="bold neon-green">100% STABLE</span>
                    </div>
                  </div>
                )}
             </div>
         )}
      </div>
    </section>
  );
};

export default Hero;
