import json
import time
import os
from datetime import datetime

class DataLogger:
    """
    Implements the NKC (Neuro-Kinematic Container) specification.
    Logs multi-modal data (EEG Features, Markers, Physics Params) into a structured format.
    """
    def __init__(self, session_id=None, subject_id="user_test"):
        self.session_id = session_id or f"sess_{int(time.time())}"
        self.subject_id = subject_id
        self.log_dir = os.path.join(os.path.dirname(__file__), "..", "data_logs")
        os.makedirs(self.log_dir, exist_ok=True)
        
        self.data_buffer = {
            "metadata": {
                "subject_id": self.subject_id,
                "session_id": self.session_id,
                "timestamp_start": datetime.now().isoformat(),
                "protocol": "NKC_v1.0_Simulation"
            },
            "streams": {
                "features": [],
                "physics": [],
                "markers": []
            }
        }
        print(f"[DataLogger] Session {self.session_id} initialized.")

    def log_frame(self, timestamp, theta, beta, alpha, fluidity):
        """
        Log a single time-frame of data.
        """
        # Feature Layer
        self.data_buffer["streams"]["features"].append({
            "ts": timestamp,
            "theta": theta,
            "beta": beta
        })
        
        # Physics Layer
        self.data_buffer["streams"]["physics"].append({
            "ts": timestamp,
            "alpha": alpha,
            "fluidity": fluidity
        })

    def log_marker(self, timestamp, label):
        """
        Log an event marker (e.g. Action Start).
        """
        self.data_buffer["streams"]["markers"].append({
            "ts": timestamp,
            "label": label
        })

    def save(self):
        """
        Flush buffer to disk (JSON for prototype, Parquet for production).
        """
        filepath = os.path.join(self.log_dir, f"{self.session_id}.nkc.json")
        try:
            with open(filepath, 'w') as f:
                json.dump(self.data_buffer, f, indent=2)
            print(f"[DataLogger] Data saved to {filepath}")
            return filepath
        except Exception as e:
            print(f"[DataLogger] Error saving data: {e}")
            return None
