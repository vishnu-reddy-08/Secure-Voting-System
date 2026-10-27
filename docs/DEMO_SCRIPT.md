# Live Demonstration Script for Examiners & Evaluators

> **Smart Biometric Voting System Prototype**
> Step-by-Step Viva Presentation Guide

---

## 🎬 Demonstration Flow (Estimated Duration: 5–8 Minutes)

### Act 1: Administrator Authentication & Overview (1 Min)
1. **Navigate to**: `http://localhost:5173/login`
2. **Observe**: Modern cyber-security dark theme, pre-filled credential reminder.
3. **Log in with**:
   - Email: `admin@election.gov`
   - Password: `Admin@Voting2026!`
4. **Dashboard View** (`/admin/dashboard`):
   - Highlight the real-time KPI metric cards: *Total Registered*, *Biometrics Enrolled*, *Ballots Cast*, *Turnout %*, and *Duplicate Attempts Blocked*.
   - Point out the **Candidate Vote Tally** distribution bar chart.

---

### Act 2: Voter Registration & Biometric Enrollment (2 Mins)
1. **Click**: **"Register New Voter"** (`/admin/voters/create`).
2. **Enter Voter Credentials**:
   - Full Name: `Siddharth Verma`
   - Age: `29`
   - Mobile: `9876543210`
   - Aadhaar Number: `4829-1038-9281`
3. **Live Biometric Capture**:
   - Stand in front of the camera.
   - Click **"Capture Face"** (observe instant preview & blur/lighting quality check).
   - Click **"Capture Iris"** (or use the simulated academic ocular frame).
4. **Click**: **"Register & Enroll Biometrics"**.
5. **Verify**: The voter appears in the **Voters Registry** (`/admin/voters`) with masked Aadhaar (`XXXX-XXXX-9281`) and `Biometrics: Enrolled` badge.

---

### Act 3: First-Time Voting Kiosk Flow (2 Mins)
1. **Open Voter Kiosk**: Click **"Launch Kiosk"** or open `http://localhost:5173/vote` in full screen.
2. **Start Screen**: Clean, distraction-free landing page with pillars: Multimodal, Anonymous, 1 Person 1 Vote.
3. **Click**: **"Begin Biometric Verification"** (`/vote/verify`).
4. **Biometric Scan**:
   - Follow the liveness prompt (e.g., *"Look directly into the camera"*).
   - Click **"Scan & Verify Identity"**.
   - Observe the step-by-step pipeline status:
     $$\text{Face Detected} \longrightarrow \text{ArcFace 512-d Match} \longrightarrow \text{Iris Daugman Match} \longrightarrow \text{Eligibility Check} \longrightarrow \text{Session Issued}$$
5. **Ballot Paper** (`/vote/ballot`):
   - Point out the active 5-minute countdown timer.
   - Select a candidate (e.g. *Dr. Rajesh Sharma* or *NOTA*).
   - Click **"Review & Confirm Vote"**.
6. **Vote Confirmation**:
   - Review the modal dialog and click **"Confirm Vote"**.
7. **Success Screen** (`/vote/success`):
   - Celebratory confetti fires.
   - Point out the unique **Cryptographic Digital Receipt Hash** (e.g., `SHA256-VOTE-9F4D2`).
   - Highlight the privacy guarantee: *Voter ID is completely decoupled from the recorded ballot*.

---

### Act 4: The Climax — Duplicate Vote Prevention (1.5 Mins)
1. **Re-enter the Kiosk**: Navigate to `/vote/verify`.
2. **Scan the Same Voter Again**:
   - Position the same voter in front of the camera and click **"Scan & Verify Identity"**.
3. **System Decision**:
   - The multimodal biometric engine recognizes the voter's biometric signature.
   - The server queries `users` and detects `voted == true`.
   - **Result**: The system immediately rejects the transaction and redirects to:
     $$\mathbf{/vote/already\text{-}voted}$$
4. **Observe Screen**:
   - Prominent red alert banner: **"ALREADY VOTED - One Person One Vote Enforced"**.
   - Explains that the voter has already exercised their franchise and duplicate voting is strictly prohibited.

---

### Act 5: Tamper-Evident Audit Trail (1 Min)
1. **Return to Admin Console**: `http://localhost:5173/admin/audit-logs`.
2. **Show the Examiner**:
   - `ADMIN_LOGIN` event
   - `VOTER_REGISTRATION` event (with masked Aadhaar)
   - `BIOMETRIC_ENROLLMENT` event
   - `VOTING_SESSION_CREATED` event
   - `VOTE_COMPLETION` event (verifying that the candidate chosen is **NOT** logged)
   - `DUPLICATE_VOTE_ATTEMPT` event flagged with result `REJECTED`.
3. **Conclusion**: The prototype demonstrates a complete, closed-loop, privacy-preserving, duplicate-proof biometric voting system.
