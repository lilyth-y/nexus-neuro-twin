import sys
import os
import time
import random
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from backend.neuro_controller import MagnonicController
from backend.data_logger import DataLogger

def log(header, message, delay=0.5):
    print(f"[{header}] {message}")
    sys.stdout.flush()
    time.sleep(delay)

def simulate_gcp_pipeline():
    print("=== Starting Neuro-Digital Twin Cloud Simulation ===\n")
    
    # 1. GCP Authentication & Build
    log("GCP_AUTH", "Authenticating with Google Cloud Platform...", 1.0)
    log("GCP_AUTH", "Authenticated as service-account@neuro-twin.iam.gserviceaccount.com")
    
    log("CLOUD_BUILD", "Starting build for image: gcr.io/neuro-twin/mumax3-solver:latest")
    log("CLOUD_BUILD", "Step 1/3: Pulling base image nvidia/cuda:11.0...", 0.5)
    log("CLOUD_BUILD", "Step 2/3: Compiling MuMax3 binaries...", 0.5)
    log("CLOUD_BUILD", "Step 3/3: Copying physics script 'mumax3_script.mx3'...", 0.5)
    log("CLOUD_BUILD", "Build SUCCESS. Function ID: sha256:8f4a2...")
    
    # 2. GKE Deployment
    log("K8S_DEPLOY", "Connecting to cluster 'neuro-cluster-us-central1'...")
    log("K8S_DEPLOY", "Applying manifest 'k8s_job.yaml'...")
    log("K8S_SCHEDULER", "Successfully assigned production/mumax3-solver-7d5b to node gke-gpu-pool-1")
    log("KUBELET", "Pulling image gcr.io/neuro-twin/mumax3-solver:latest", 1.0)
    log("CONTAINER", "Created container mumax3-solver")
    log("CONTAINER", "Started container mumax3-solver")
    
    # 3. Running Simulation
    print("\n--- [REMOTE LOGS] pod/mumax3-solver-7d5b ---")
    log("MUMAX3", "Device: Tesla T4 (UUID: GPU-4b72...)", 0.2)
    log("MUMAX3", "Initializing Grid 128x128x1", 0.2)
    log("MUMAX3", "Material: Permalloy (Msat=800e3, Aex=13e-12)", 0.2)
    log("MUMAX3", "Establishing gRPC Stream on port 50051...", 1.0)
    
    # 4. Connecting Controller
    print("\n--- Connecting Local Controller to Remote Stream ---")
    controller = MagnonicController()
    logger = DataLogger(subject_id="sim_user_001") # Initialize Logger
    log("CONTROLLER", "Connected to gRPC endpoint 34.122.x.x:50051")
    
    # 5. Live Data Streaming (Behavioral Simulation)
    print("\n[Live Stream Started: Behavioral Action Simulation]")
    actions = ["STAND", "WALK", "RUN", "WALK", "STAND"]
    
    for action in actions:
        print(f"\n>>> User Action Intention: {action} <<<")
        logger.log_marker(time.time(), f"ACTION_START_{action}") # Log Marker
        
        # Simulate a few frames per action
        for i in range(3):
            res = controller.simulate_action_pattern(action)
            alpha = res['sim_params']['alpha']
            fluidity = res['fluidity_index']
            
            # Log Data Frame
            logger.log_frame(time.time(), res['sim_params'].get('theta', 0), res['sim_params'].get('beta', 0), alpha, fluidity)
            
            # Simulate network latency variation
            latency = random.randint(35, 65) 
            
            # Analyze physics implication
            status = "STABLE" if alpha > 0.04 else ("RESPONSIVE" if alpha < 0.02 else "BALANCED")
            
            print(f"[{action}] Latency: {latency}ms | Physics State: {status} "
                  f"| Alpha: {alpha:.4f} | Fluidity: {fluidity:.4f}")
            time.sleep(0.4)
            
    print("\n[Stream Ended] Disconnecting...")
    log("K8S_JOB", "Job output saved to pv/simulation-output")
    log("GCP", "Deallocating preemptible GPU instance...")
    
    # Save Logs
    log_path = logger.save()
    print(f"\n[DataLogger] Simulation session archived to: {log_path}")
    print("\n=== Simulation Complete ===")

if __name__ == "__main__":
    simulate_gcp_pipeline()
