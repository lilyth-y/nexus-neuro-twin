import React, { useEffect, useState, Suspense } from 'react'
import './App.css'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import Features from './components/Features'
import Footer from './components/Footer'
import AvatarCreator from './components/AvatarCreator'
import IdentityConfigurator from './components/IdentityConfigurator'
const WorldScene = React.lazy(() => import('./components/WorldScene'));

function App() {
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [isCreatingAvatar, setIsCreatingAvatar] = useState(false);
  const [isConfiguringIdentity, setIsConfiguringIdentity] = useState(false);
  const [identityData, setIdentityData] = useState(null);
  const [neuralCoupling, setNeuralCoupling] = useState(0); // Lifted State
  const [isInWorld, setIsInWorld] = useState(false);

  // Removed useEffect for window.enterWorld

  const handleAvatarExported = (url) => {
    setAvatarUrl(url);
    setIsCreatingAvatar(false);
  };

  const handleIdentityComplete = (data) => {
    setIdentityData(data);
    setIsConfiguringIdentity(false);
  };

  if (isInWorld) {
      return (
          <Suspense fallback={<div style={{color:'white'}}>Loading World...</div>}>
              <WorldScene avatarUrl={avatarUrl} coupling={neuralCoupling} onExit={() => setIsInWorld(false)} />
          </Suspense>
      )
  }

  return (
    <div className="app-container">
      <div 
        className="glow-bg" 
        style={{
          background: `
            radial-gradient(circle at ${mousePos.x}% ${mousePos.y}%, rgba(176, 38, 255, 0.2), transparent 40%),
            radial-gradient(circle at 20% 20%, rgba(0, 243, 255, 0.15), transparent 40%),
            radial-gradient(circle at 80% 80%, rgba(176, 38, 255, 0.15), transparent 40%)
          `
        }}
      />
      
      <Navbar />
      
      <main>
        <Hero 
            onInitialize={() => setIsCreatingAvatar(true)} 
            avatarUrl={avatarUrl}
            onEnterWorld={() => setIsInWorld(true)}
            onConfigureIdentity={() => setIsConfiguringIdentity(true)}
            identityData={identityData}
        />
        <Features />
      </main>

      <Footer />
      
      {isCreatingAvatar && (
        <AvatarCreator 
            onAvatarExported={handleAvatarExported} 
            onCancel={() => setIsCreatingAvatar(false)} 
        />
      )}

      {isConfiguringIdentity && (
        <IdentityConfigurator 
            onComplete={handleIdentityComplete}
            onCancel={() => setIsConfiguringIdentity(false)}
            coupling={neuralCoupling}
            setCoupling={setNeuralCoupling}
        />
      )}
    </div>
  )
}

export default App
