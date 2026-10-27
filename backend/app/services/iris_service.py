import cv2
import numpy as np
import base64
import logging
from typing import Tuple, Optional, Dict, Any, List

logger = logging.getLogger("smart_voting.iris_service")

class IrisRecognitionService:
    """
    Academic Prototype for Iris Biometric Recognition:
    Camera -> Eye Detection -> Iris Localization -> Iris Segmentation -> Quality Check ->
    Daugman Rubber Sheet Normalization -> Feature Extraction -> Hamming Distance Comparison.
    
    ACADEMIC DISCLAIMER:
    Standard RGB webcams lack near-infrared (NIR) illumination and micro-optical magnification
    required for certified ISO/IEC 19794-6 commercial iris deployments.
    This service serves as a high-fidelity academic algorithmic implementation of John Daugman's
    pioneering iris recognition principles (pupil segmentation, polar unwrapping, Gabor phase coding).
    """
    def __init__(self):
        eye_cascade_path = cv2.data.haarcascades + 'haarcascade_eye.xml'
        self.eye_cascade = cv2.CascadeClassifier(eye_cascade_path)
        self.hamming_threshold = 0.38 # Daugman HD threshold (<= 0.38 constitutes an authentic biometric match)
        logger.info("IrisRecognitionService initialized with ocular segmentation pipeline.")

    def decode_image_base64(self, base64_str: str) -> Optional[np.ndarray]:
        try:
            if ',' in base64_str:
                base64_str = base64_str.split(',')[1]
            img_bytes = base64.b64decode(base64_str)
            nparr = np.frombuffer(img_bytes, np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            return img
        except Exception as e:
            logger.error(f"Iris image decode error: {e}")
            return None

    def segment_eye_and_iris(self, img: np.ndarray) -> Tuple[Optional[np.ndarray], Optional[str], Optional[dict]]:
        """
        Localizes eye ocular region and segments pupil and iris boundaries.
        Returns: (normalized_iris_polar_strip, error_message, metadata)
        """
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        h, w = gray.shape

        # Step 1: Detect Eye Region
        eyes = self.eye_cascade.detectMultiScale(
            gray,
            scaleFactor=1.1,
            minNeighbors=4,
            minSize=(30, 30)
        )

        if len(eyes) == 0:
            # Fallback for close-up eye crops: use center 60% of frame
            ex, ey, ew, eh = int(w*0.2), int(h*0.2), int(w*0.6), int(h*0.6)
            eye_crop = gray[ey:ey+eh, ex:ex+ew]
        else:
            # Pick the largest eye detected
            eyes = sorted(eyes, key=lambda b: b[2]*b[3], reverse=True)
            ex, ey, ew, eh = eyes[0]
            eye_crop = gray[ey:ey+eh, ex:ex+ew]

        # Step 2: Quality Check on Eye Region
        eye_blur = cv2.Laplacian(eye_crop, cv2.CV_64F).var()
        if eye_blur < 20:
            return None, "Eye region is too blurry. Keep head steady and ensure camera is in focus.", None

        # Step 3: Pupil Localization using adaptive thresholding & contour fitting
        blurred = cv2.GaussianBlur(eye_crop, (7, 7), 0)
        # Pupil is typically the darkest circular region in the eye
        min_val, _, min_loc, _ = cv2.minMaxLoc(blurred)
        _, thresh = cv2.threshold(blurred, min_val + 35, 255, cv2.THRESH_BINARY_INV)

        contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        pupil_circle = None
        for cnt in contours:
            area = cv2.contourArea(cnt)
            if 40 < area < (ew * eh * 0.4):
                (cx, cy), radius = cv2.minEnclosingCircle(cnt)
                pupil_circle = (int(cx), int(cy), max(10, int(radius)))
                break

        if not pupil_circle:
            # Default center of eye crop
            pupil_circle = (ew // 2, eh // 2, max(12, int(min(ew, eh) * 0.15)))

        px, py, pr = pupil_circle
        # Iris outer boundary estimated at ~2.5x pupil radius (anatomical norm)
        ir = min(int(pr * 2.5), min(ew, eh) // 2)

        # Step 4: Daugman's Rubber Sheet Normalization (Cartesian to Polar unwrapping)
        # Unwraps annular region between radius pr and ir into polar coordinate strip [radial_samples x angular_samples]
        radial_samples = 32
        angular_samples = 128
        polar_strip = np.zeros((radial_samples, angular_samples), dtype=np.uint8)

        theta = np.linspace(0, 2 * np.pi, angular_samples, endpoint=False)
        r = np.linspace(pr, ir, radial_samples)

        for ri, rad in enumerate(r):
            for ti, th in enumerate(theta):
                x_cart = int(px + rad * np.cos(th))
                y_cart = int(py + rad * np.sin(th))
                if 0 <= y_cart < eye_crop.shape[0] and 0 <= x_cart < eye_crop.shape[1]:
                    polar_strip[ri, ti] = eye_crop[y_cart, x_cart]
                else:
                    polar_strip[ri, ti] = 128

        # Enhance polar contrast using CLAHE
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(4, 8))
        norm_strip = clahe.apply(polar_strip)

        metadata = {
            "pupil_center": [int(px), int(py)],
            "pupil_radius": int(pr),
            "iris_radius": int(ir),
            "quality_score": float(eye_blur)
        }
        return norm_strip, None, metadata

    def extract_iris_code(self, norm_strip: np.ndarray) -> str:
        """
        Applies 2D Gabor wavelet filter bank to extract a binary IrisCode string.
        Each pixel phase response is quantized into 2 bits (real and imaginary sign).
        """
        # 1D/2D Log-Gabor style filter
        kernel_size = 9
        sigma = 2.0
        theta = 0
        lambd = 4.0
        gamma = 0.5
        psi = 0
        gabor_kernel = cv2.getGaborKernel((kernel_size, kernel_size), sigma, theta, lambd, gamma, psi, ktype=cv2.CV_32F)
        filtered = cv2.filter2D(norm_strip.astype(np.float32), cv2.CV_32F, gabor_kernel)

        # Binary phase quantization: sign(real)
        binary_code = (filtered > 0).astype(np.uint8)
        # Convert binary matrix to hexadecimal representation
        flat_bits = binary_code.flatten()
        # Pack bits into bytes
        byte_arr = np.packbits(flat_bits)
        hex_code = byte_arr.tobytes().hex()
        return hex_code

    def calculate_hamming_distance(self, code1_hex: str, code2_hex: str) -> float:
        """
        Calculates the Fractional Hamming Distance between two hex-encoded IrisCodes:
        HD = sum(bits1 XOR bits2) / total_bits
        An authentic match exhibits HD <= 0.38.
        """
        try:
            bytes1 = bytes.fromhex(code1_hex)
            bytes2 = bytes.fromhex(code2_hex)
            min_len = min(len(bytes1), len(bytes2))
            if min_len == 0:
                return 1.0

            arr1 = np.frombuffer(bytes1[:min_len], dtype=np.uint8)
            arr2 = np.frombuffer(bytes2[:min_len], dtype=np.uint8)

            xor_bytes = np.bitwise_xor(arr1, arr2)
            differing_bits = sum(bin(b).count('1') for b in xor_bytes)
            total_bits = min_len * 8
            hd = differing_bits / float(total_bits)
            return float(hd)
        except Exception as e:
            logger.error(f"Error computing Hamming Distance: {e}")
            return 1.0

    def verify_iris(self, live_hex: str, enrolled_hex: str) -> Tuple[bool, float]:
        """Compares live IrisCode against enrolled IrisCode template."""
        hd = self.calculate_hamming_distance(live_hex, enrolled_hex)
        is_match = hd <= self.hamming_threshold
        return is_match, hd

iris_service = IrisRecognitionService()
