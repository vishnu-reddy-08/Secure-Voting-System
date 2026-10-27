# Final-Year Project Viva Voce: Comprehensive Questions & Answers

> **Project Title**: Smart Biometric Voting System Using Multimodal Biometrics (Face + Iris Recognition)
> **Technologies**: Python 3.11, FastAPI, React (Vite), Firebase Firestore, OpenCV, ArcFace, Daugman Rubber Sheet

---

### Q1: What is the core motivation behind developing a multimodal biometric voting system?
**Answer:**
Traditional single-factor voter verification systems (such as voter ID cards, ink marking, or single fingerprint sensors) suffer from significant vulnerabilities: voter cards can be forged, ink can be chemically removed, and fingerprint sensors fail with aged or manual laborers due to worn papillary ridges. Multimodal biometrics (combining Facial Geometry and Iris Textural Patterns) provides virtually zero False Match Rates because the probability of two individuals sharing both identical facial vectors and identical micro-iris trabecular meshwork is practically zero ($< 10^{-9}$).

---

### Q2: Why did you choose Face and Iris recognition instead of Fingerprint?
**Answer:**
1. **Contactless Hygiene**: Post-pandemic standards favor contactless optical capture over contact fingerprint platens.
2. **Durability of Iris Patterns**: The iris is an internal organ protected behind the clear cornea and aqueous humor; unlike fingerprints, it does not suffer from abrasive wear, cuts, or chemical scarring.
3. **Complementary Modalities**: Face recognition provides rapid non-intrusive 1:N screening, while iris recognition provides surgical 1:1 biometric uniqueness.

---

### Q3: How do you extract and compare facial features in the backend?
**Answer:**
The pipeline consists of:
1. **Detection**: OpenCV Haar / DNN cascade locates the face bounding box.
2. **Quality & Alignment**: Evaluates blur via Laplacian variance ($\sigma^2 > 40$) and brightness, then crops and resizes to $112 \times 112$.
3. **Embedding Generation**: Extracts a 512-dimensional feature vector using an ArcFace deep projection model that normalizes the vector onto a unit hypersphere ($L_2\text{-norm} = 1.0$).
4. **Matching**: Computes Cosine Similarity:
   $$\text{Similarity}(v_1, v_2) = \frac{v_1 \cdot v_2}{\|v_1\| \|v_2\|}$$
   Scores $\ge 0.65$ denote authentic identity matches.

---

### Q4: Explain the mathematical algorithm used for Iris Recognition.
**Answer:**
We implement John Daugman's classical iris recognition algorithm:
1. **Pupil & Limbic Segmentation**: Identifies the inner pupillary boundary and outer limbic contour using adaptive thresholding and circular contour fitting.
2. **Rubber Sheet Normalization**: Transforms the circular annular iris zone into a canonical rectangular polar coordinate strip ($32 \times 128$) using the mapping:
   $$I(x(r, \theta), y(r, \theta)) \longrightarrow I(r, \theta)$$
   where $r \in [0, 1]$ and $\theta \in [0, 2\pi]$.
3. **Phase Quantization**: Applies 2D Gabor wavelet filters and quantizes the complex phase response into binary bits (0 or 1) to produce a compact binary `IrisCode`.
4. **Comparison**: Measures the Fractional Hamming Distance (HD) between two IrisCodes:
   $$\text{HD} = \frac{\sum_{i=1}^{N} \text{code}_A[i] \oplus \text{code}_B[i]}{N}$$
   A distance $\text{HD} \le 0.38$ indicates an authentic match.

---

### Q5: Can an ordinary RGB webcam achieve certified iris recognition?
**Answer:**
No. Certified commercial iris scanners (ISO/IEC 19794-6) utilize Near-Infrared (NIR) illumination (700–900 nm wavelength) to penetrate dark-pigmented irises and eliminate corneal specular glare. In this academic prototype, we clearly label the iris module as an **algorithmic prototype simulation** that proves the computational pipeline (pupil segmentation, polar unwrapping, Gabor phase coding, Hamming distance) while highlighting the hardware requirement for real-world NIR sensors.

---

### Q6: How does the system guarantee ballot secrecy if biometrics are used to authenticate voters?
**Answer:**
We implement **Architectural Identity Decoupling**:
1. When biometrics are verified and `voted == false`, the server generates a cryptographically signed, short-lived **Voting Session Token** (valid for 5 minutes).
2. The voter enters the ballot interface.
3. When the vote is cast (`POST /api/voting/cast`), the server atomically:
   - Sets `voter.voted = true` in the `users` collection.
   - Marks the session as `used = true`.
   - Inserts an anonymous record into the `votes` collection containing only `{vote_id, election_id, candidate_id, timestamp, receipt_hash}`.
4. **There is no voter_id or session_id stored in the `votes` collection**. Even with full database access, an administrator cannot determine which candidate a specific voter selected.

---

### Q7: How is duplicate voting prevented?
**Answer:**
Duplicate voting is prevented at both the biometric verification stage and the vote-casting stage:
1. When a repeat voter scans their face and iris at the kiosk, the 1:N biometric search identifies their profile in the database.
2. The server checks the `voted` field in their record. Because `voted == true`, the server immediately aborts with `{ "success": false, "reason": "ALREADY_VOTED" }` and logs a `DUPLICATE_VOTE_ATTEMPT` security audit event.
3. The kiosk displays the "ALREADY VOTED" security screen.
4. If a malicious client attempts to re-use an expired or already-used session token directly via the API, the atomic check rejects the transaction.

---

### Q8: How does the system handle Aadhaar privacy compliance?
**Answer:**
In accordance with UIDAI regulations and Section 29 of the Aadhaar Act, full 12-digit Aadhaar numbers are never stored in plain text. The system automatically masks the input upon registration, storing only the last 4 digits (`XXXX-XXXX-1234`). This satisfies voter identification verification while eliminating the risk of biometric identity theft.

---

### Q9: Why did you choose Firebase Firestore over a relational database or MongoDB?
**Answer:**
1. **Document-Oriented Scalability**: Firestore provides flexible JSON-like document modeling ideal for storing structured biometric vector metadata, masked demographic records, and audit events.
2. **Real-time Synchronization**: Firestore listeners enable real-time dashboard analytics updates as votes are cast.
3. **Security Rules & Atomic Batches**: Firestore transactions guarantee that marking a voter as voted and appending an anonymous ballot occur atomically, preventing race conditions.
4. **Hybrid Offline Support**: Our architecture includes a persistent local provider fallback that runs out-of-the-box in offline development environments while seamlessly supporting live Google Cloud Firestore credentials via `serviceAccountKey.json`.

---

### Q10: What is Liveness Detection and how is it implemented?
**Answer:**
Liveness detection prevents presentation attacks (photo spoofing, video replays, silicon masks). In our prototype, we implement an active **challenge-response mechanism**: the terminal generates a random instruction (e.g., "Blink naturally" or "Look directly into the camera") that must be satisfied during the live video capture window.

---

### Q11: What were the biggest technical challenges faced during development?
**Answer:**
1. Implementing Daugman rubber sheet polar unwrapping in Python with sub-second execution on CPU hardware.
2. Preserving absolute voter ballot secrecy while guaranteeing strict duplicate vote prevention.
3. Ensuring high-contrast, distraction-free UI/UX in the kiosk interface so users of all technical proficiencies can vote without confusion.

---

### Q12: What are the future enhancements for this project?
**Answer:**
1. Integration of homomorphic encryption or Zero-Knowledge Proofs (ZKP) for end-to-end verifiable ballots.
2. Dedicated Near-Infrared (NIR) hardware sensor integration for clinical iris capture.
3. Decentralized ledger (Blockchain) consensus for immutable cross-constituency tallying.
