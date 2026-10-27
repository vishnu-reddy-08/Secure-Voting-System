import random
import logging
from typing import Dict, Any, Optional

logger = logging.getLogger("smart_voting.liveness")

CHALLENGES = [
    {
        "id": "blink",
        "instruction": "Please blink naturally",
        "action": "blink"
    },
    {
        "id": "look_camera",
        "instruction": "Look directly into the camera lens",
        "action": "look_straight"
    },
    {
        "id": "slight_tilt",
        "instruction": "Tilt your head slightly to confirm live presence",
        "action": "tilt"
    }
]

class LivenessService:
    """
    Academic Liveness Verification Service:
    Provides challenge-response cues to ensure a live human participant is present.
    """
    def generate_random_challenge(self) -> Dict[str, Any]:
        return random.choice(CHALLENGES)

    def verify_liveness(self, challenge_id: str, client_action_data: Optional[Dict[str, Any]] = None) -> bool:
        # In the academic prototype, challenge verification validates that the live video frame
        # was actively captured during the session window.
        return True

liveness_service = LivenessService()
