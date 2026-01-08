import json
import numpy as np
import os
import glob
from scipy.signal import savgol_filter

class MetricAnalyzer:
    """
    Analyzes NKC log files to compute objective metrics defined in evaluation_strategy.md.
    """
    def __init__(self, log_dir):
        self.log_dir = log_dir

    def load_latest_session(self):
        list_of_files = glob.glob(os.path.join(self.log_dir, '*.nkc.json'))
        if not list_of_files:
            return None
        latest_file = max(list_of_files, key=os.path.getctime)
        with open(latest_file, 'r') as f:
            return json.load(f)

    def calculate_metrics(self, data):
        """
        Computes:
        1. Normalized Jerk Score (NJS) for Fluidity.
        2. Intent-Action Coupling (Correlation).
        """
        # Extract streams
        features = data['streams']['features']
        physics = data['streams']['physics']
        
        # Align time series (assuming synchronous logging for prototype)
        # In real LSL, we would strictly interpolate by timestamp.
        timestamps = np.array([p['ts'] for p in physics])
        fluidity_stream = np.array([p['fluidity'] for p in physics])
        beta_stream = np.array([f['beta'] for f in features]) # Intent proxy
        
        # 1. Smoothness Analysis (Fluidity Proxy)
        # We derive 'Jerk' from the inverse of fluidity or raw kinematic changes.
        # Here we analyze the stability of the fluidity index itself.
        # NJS ~= Standard Deviation of the Fluidity (Lower is better/stable)
        njs_score = np.std(fluidity_stream)
        
        # 2. Intent-Action Coupling
        # Correlation between Beta Power (Focus Intent) and Physics Response (Alpha/Fluidity)
        # Note: In our model, High Beta -> Low Alpha -> Lower Fluidity (High Reactivity)
        # So we expect NEGATIVE correlation.
        correlation = np.corrcoef(beta_stream, fluidity_stream)[0, 1]
        
        return {
            "NJS_Score": njs_score,
            "Intent_Coupling": correlation,
            "Duration": timestamps[-1] - timestamps[0],
            "Data_Points": len(timestamps)
        }

if __name__ == "__main__":
    log_dir = os.path.join(os.path.dirname(__file__), "..", "data_logs")
    analyzer = MetricAnalyzer(log_dir)
    
    data = analyzer.load_latest_session()
    if data:
        print(f"Analyzing Session: {data['metadata']['session_id']}")
        metrics = analyzer.calculate_metrics(data)
        
        print("\n=== Evaluation Results ===")
        print(f"1. Smoothness (NJS Proxy): {metrics['NJS_Score']:.4f} (Target: < 0.1)")
        print(f"2. Intent Coupling (Corr): {metrics['Intent_Coupling']:.4f} (Target: High Magnitude)")
        print(f"3. Sample Count: {metrics['Data_Points']}")
        
        # Verdict
        if metrics['NJS_Score'] < 0.2 and abs(metrics['Intent_Coupling']) > 0.5:
            print("\n>> VERDICT: PASS (System meets design criteria)")
        else:
            print("\n>> VERDICT: REQUIRES OPTIMIZATION")
    else:
        print("No log files found.")
