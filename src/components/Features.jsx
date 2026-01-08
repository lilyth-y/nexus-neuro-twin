import React, { useEffect, useRef, useState } from 'react';
import GlassCard from './GlassCard';

const Features = () => {
  const sectionRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setIsVisible(true);
    }, { threshold: 0.1 });

    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  const features = [
    {
      title: "Hyper-Fidelity Engine",
      description: "Powered by Unreal Engine 5, our avatars blur the line between virtual and reality.",
      icon: "🧬"
    },
    {
      title: "AI Persona Core",
      description: "Idols that remember you. Our AI ensures unique, evolving interactions with every fan.",
      icon: "🧠"
    },
    {
      title: "Cross-Verse Connect",
      description: "Export your Digital Human Twin to VRChat, Roblox, Unity, and beyond seamlessly.",
      icon: "🌐"
    }
  ];

  return (
    <section id="features" ref={sectionRef} className={`section-reveal ${isVisible ? 'visible' : ''}`}>
      <h2 className="section-title">Nexus World <span className="highlight">Features</span></h2>
      <div className="features-grid">
        {features.map((feature, index) => (
          <GlassCard key={index} className="feature-card">
            <div className="feature-icon">{feature.icon}</div>
            <h3>{feature.title}</h3>
            <p>{feature.description}</p>
          </GlassCard>
        ))}
      </div>
    </section>
  );
};

export default Features;
