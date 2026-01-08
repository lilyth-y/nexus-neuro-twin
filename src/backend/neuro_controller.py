import numpy as np
import time
import logging

# Mock gRPC stubs for standalone testing
# from proto import neuro_signal_pb2, neuro_signal_pb2_grpc

class ReservoirReadout:
    """
    Implements the spatial readout layer defined in Research Paper Section 4.4.
    Maps high-dimensional magnetic states (Reservoir) to low-dimensional kinematics (Readout).
    """
    def __init__(self, input_dim=128*128, output_dim=20, ridge_alpha=1.0):
        self.input_dim = input_dim
        self.output_dim = output_dim
        self.ridge_alpha = ridge_alpha
        
        # Initialize weights (W_out) with small random values
        self.W_out = np.random.randn(output_dim, input_dim) * 0.01
        self.bias = np.zeros(output_dim)

    def predict(self, magnetic_state):
        """
        y(t) = W_out * m(t) + b
        """
        # Flatten state if necessary (e.g. 128x128 grid -> 16384 vector)
        m_vec = magnetic_state.flatten()
        return np.dot(self.W_out, m_vec) + self.bias

    def update_hebbian(self, magnetic_state, current_output, target_output, learning_rate=0.001):
        """
        Hebbian Learning Rule (Eq. in Section 4.4):
        dW_ij = eta * (Target_j - y_j) * m_i
        """
        m_vec = magnetic_state.flatten()
        error = target_output - current_output
        
        # Outer product to calculate dW for all i, j
        delta_W = learning_rate * np.outer(error, m_vec)
        
        self.W_out += delta_W
        self.bias += learning_rate * error # Simple bias update

class MagnonicController:
    """
    Orchestrates the data flow: EEG -> Physics Params -> Simulation -> Readout -> Kinematics.
    Now uses pre-computed MuMax3 database for physics-accurate results.
    """
    def __init__(self):
        self.readout = ReservoirReadout()
        self.running = False
        self._init_simulation_db()
        print("[MagnonicController] Initialized with 128x128 reservoir grid.")

    def _init_simulation_db(self):
        """Initialize pre-computed MuMax3 database"""
        try:
            from simulation_db import get_simulation_db
            self.sim_db = get_simulation_db()
            self.use_precomputed = True
            print("[MagnonicController] Using pre-computed MuMax3 patterns")
        except ImportError:
            self.sim_db = None
            self.use_precomputed = False
            print("[MagnonicController] Fallback to mock simulation")

    def process_eeg_stream(self, theta_power, beta_power):
        """
        Processes EEG via the causal chain:
        1. Neuro-Magnetic Modulation (Theta -> Damping, Beta -> Excitation)
        2. Magnonic Reservoir Dynamics (Pre-computed MuMax3)
        3. Kinematic Readout
        """
        t = time.time()
        
        # 1. Get physics parameters
        alpha = 0.01 + 0.05 * theta_power
        b_ext_magnitude = 0.05 * beta_power
        
        # 2. Get magnetic state from pre-computed database
        if self.use_precomputed and self.sim_db:
            magnetic_state = self.sim_db.get_magnetic_state(theta_power, beta_power, t)
            physics_meta = self.sim_db.get_physics_metadata(theta_power, beta_power)
        else:
            # Fallback: simple wave pattern
            grid_size = 128
            x = np.linspace(-5, 5, grid_size)
            y = np.linspace(-5, 5, grid_size)
            X, Y = np.meshgrid(x, y)
            R = np.sqrt(X**2 + Y**2)
            magnetic_state = np.sin(R - 2*np.pi*2.0*t) * np.exp(-0.1 * R * alpha) * b_ext_magnitude
            physics_meta = {"source": "mock"}
        
        # 3. Readout (Section 4.4)
        kinematics = self.readout.predict(magnetic_state)
        
        # Calculate Fluidity (Jerk proxy: inverse of high-freq noise)
        fluidity = 1.0 / (1.0 + np.var(kinematics))
        
        return {
            "joint_angles": kinematics.tolist(),
            "fluidity_index": fluidity,
            "sim_params": {
                "alpha": alpha, 
                "b_ext": b_ext_magnitude, 
                "theta": theta_power, 
                "beta": beta_power
            },
            "physics": physics_meta
        }

    def simulate_action_pattern(self, action_name):
        """
        Simulates EEG patterns corresponding to specific physical actions.
        Maps Action -> (Theta, Beta) -> Physics Parameters.
        
        [Data Source Methodology]
        Currently using: "Synthetic Heuristic Data" based on Neuro-Physiological Arousal Theory.
        - STAND: Low Arousal (Relaxation) -> High Theta / Low Beta.
        - RUN: High Arousal (Active Motor Drive) -> Low Theta / High Beta.
        
        [Real-World Collection Protocol]
        To replace this with real data:
        1. Hardware: OpenBCI / NueroSky EEG Headset.
        2. Task: Motor Imagery (MI) - Subject imagines 'Walking' or 'Running'.
        3. Processing: Real-time FFT to extract Power Spectral Density (PSD) in 4-8Hz and 13-30Hz bands.
        """
        if action_name == "STAND":
            # Stability focus: High Theta, Low Beta
            return self.process_eeg_stream(theta_power=0.8, beta_power=0.1)
        elif action_name == "WALK":
            # Rhythmic balance: Moderate Theta, Moderate Beta
            return self.process_eeg_stream(theta_power=0.4, beta_power=0.5)
        elif action_name == "RUN":
            # High drive/responsiveness: Low Theta, High Beta
            return self.process_eeg_stream(theta_power=0.1, beta_power=0.9)
        else:
            return self.process_eeg_stream(0.5, 0.5)


if __name__ == "__main__":
    controller = MagnonicController()
    
    # Simulation Scenario: Relax -> Focus Transition
    print("\n[Scenario] User State: Deep Relaxation (Theta High)")
    for i in range(3):
        # Relax: High Theta (0.9), Low Beta (0.2)
        res = controller.process_eeg_stream(theta_power=0.9, beta_power=0.2)
        print(f"Time {i*0.1:.1f}s | Theta: 0.9 | Alpha: {res['sim_params']['alpha']:.4f} (High Damping) -> Fluidity: {res['fluidity_index']:.4f}")
        time.sleep(0.1)

    print("\n[Scenario] User State: Intense Focus (Beta High)")
    for i in range(3):
        # Focus: Low Theta (0.1), High Beta (0.95)
        res = controller.process_eeg_stream(theta_power=0.1, beta_power=0.95)
        print(f"Time {0.3+i*0.1:.1f}s | Beta: 0.95 | Alpha: {res['sim_params']['alpha']:.4f} (Low Damping)  -> Fluidity: {res['fluidity_index']:.4f}")
        time.sleep(0.1)
