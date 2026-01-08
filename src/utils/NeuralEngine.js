/**
 * Neural Physics Engine
 * Implementation of the Kuramoto Model for Coupled Oscillators.
 * Used to simulate neural synchronization dynamics.
 * 
 * Equation: dθ_i/dt = ω_i + (K/N) * Σ sin(θ_j - θ_i)
 */
class NeuralEngine {
    constructor(numNeurons = 100) {
        this.N = numNeurons;
        this.phases = new Float32Array(this.N);
        this.frequencies = new Float32Array(this.N);
        this.K = 0; // Coupling strength
        this.dt = 0.05; // Time step
        
        this.initialize();
    }

    initialize() {
        for (let i = 0; i < this.N; i++) {
            // Random initial phases [0, 2π]
            this.phases[i] = Math.random() * Math.PI * 2;
            
            // Natural frequencies (Gaussian distribution centered around 1.0)
            // Using Box-Muller transform approximation
            const u1 = Math.random();
            const u2 = Math.random();
            const z = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
            this.frequencies[i] = 1.0 + z * 0.2; 
        }
    }

    setCoupling(k) {
        this.K = k;
    }

    update() {
        const newPhases = new Float32Array(this.N);
        let coherenceReal = 0;
        let coherenceImag = 0;

        // Calculate Order Parameter (Coherence) r = (1/N) * |Σ e^(iθ)|
        // We do this inside the loop optimizations usually, but for visualization we iterate simply first.
        
        for (let i = 0; i < this.N; i++) {
            let interaction = 0;
            
            // Optimization: In a full N^2 loop, this is heavy. 
            // For N=100-200, it's fine. For larger N, we can use the order parameter approx.
            // Interaction ≈ K * r * sin(ψ - θ_i) where re^(iψ) is the mean field.
            
            // Calculating Mean Field (Order Parameter)
            coherenceReal += Math.cos(this.phases[i]);
            coherenceImag += Math.sin(this.phases[i]);
        }

        const meanReal = coherenceReal / this.N;
        const meanImag = coherenceImag / this.N;
        const r = Math.sqrt(meanReal * meanReal + meanImag * meanImag); // Coherence [0, 1]
        const psi = Math.atan2(meanImag, meanReal); // Mean phase

        // Update phases using Mean Field approximation of Kuramoto model
        // dθ_i/dt = ω_i + K * r * sin(ψ - θ_i)
        for (let i = 0; i < this.N; i++) {
            const dTheta = this.frequencies[i] + this.K * r * Math.sin(psi - this.phases[i]);
            newPhases[i] = this.phases[i] + dTheta * this.dt;
        }

        this.phases = newPhases;

        return {
            phases: this.phases, // For visualization positions
            coherence: r,        // Global sync level (0 to 1)
            meanPhase: psi
        };
    }
}

export default NeuralEngine;
