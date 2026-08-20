# CampusHub — University Club Management System (MERN Stack)

CampusHub is a production-quality, centralized University Club Management SaaS platform engineered on the **MERN stack** (MongoDB, Express.js, React.js, Node.js). It replaces fragmented spreadsheets and ad-hoc signups with an integrated system covering recruitment eligibility, interview scoring, conflict-preventing event proposals, QR-verified attendance, skill-based volunteer assignments, financial monitoring, gamified leaderboards, and verifiable digital certificates.

---

## 🚀 Key Modules & System Highlights

### 1. Club Recruitment & Eligibility Engine
* **Eligibility Rule Checker**: Real-time evaluation of student CGPA, department, semester, and credit completion against configurable club criteria with explicit rejection reasons.
* **Concurrency-Safe Interview Slots**: Double-booking and duplicate-booking prevention.
* **5-Criteria Rubric Scoring**: Interviewers grade candidates across Communication, Technical Knowledge, Leadership, Creativity, and Problem Solving (0-20 each) with aggregate rankings.
* **Automated Recruitment Waiting List**: When a club reaches capacity, successful applicants are placed on a priority waitlist and automatically promoted when spots open.

### 2. Event Management & Collision Detection
* **Proposal Governance Workflow**: `DRAFT` → `SUBMITTED` → `APPROVED` / `REJECTED` (with required reason) → `PUBLISHED`.
* **Real-time Backend & Frontend Conflict Engine**: Prevents overlapping venue reservations and equipment stock shortages during the selected time slice.
* **Multi-Club Collaboration**: Inter-club invitations and co-organizer responsibilities.
* **Milestone Progress Tracking**: Interactive Gantt-style preparation milestones with progress percentage.

### 3. Attendance & Participation Reliability
* **Dynamic QR Code Verification**: Event-specific cryptographic tokens, camera scanning, and duplicate check-in prevention.
* **Automatic Event Waitlist Promotion**: On cancellation, the next waitlisted student is instantly promoted and notified.
* **Attendance Consistency & No-Show Monitoring**: Tracks reliability rates (`Excellent`, `Good`, `Warning`, `Poor`) and identifies chronic no-shows.

### 4. Volunteer & Duty Operations
* **Skill-Based Volunteer Matching**: AI recommendation engine ranking volunteers by registered skill match %, active workload, and verified experience.
* **Duty Progress Tracker**: `ASSIGNED` → `ACCEPTED` → `IN_PROGRESS` → `COMPLETED` → `VERIFIED` (awards points).
* **3-Step Duty Swap Engine**: Requester (A) → Peer Volunteer (B) accepts → Club Leader authorizes → Automatic duty ownership transfer.

### 5. Resource Logistics
* **Venue Scheduling & Capacity Registry**: Multi-building reservation calendar with strict clash detection.
* **Equipment Inventory**: Audio/Visual, camera kits, and projectors with quantity allocation checks.

### 6. Finance, Recognition & Verification
* **Budget vs Expense Visualizer**: Interactive Recharts pie and bar graphs with category breakdowns.
* **Gamification & Leaderboard**: Student points podium, event badges, and progression bars.
* **Verifiable Digital Certificates**: PDF downloads with embedded verification QR codes and a public lookup portal (`/verify-certificate/:id`).

---

## 🔑 Demo Login Accounts

Each role is pre-seeded with realistic data for instant project presentation and evaluation:

| Role | Email Address | Password | Profile Highlights |
| :--- | :--- | :--- | :--- |
| **University Admin** | `admin@campus.edu` | `Admin@123` | Dr. Sarah Jenkins (Dean of Student Affairs) |
| **Club Leader (Tech)** | `leader.tech@campus.edu` | `Leader@123` | Alex Rivera (President, Computer & AI Society) |
| **Club Leader (Robotics)** | `leader.robotics@campus.edu` | `Leader@123` | Marcus Vance (Robotics & Automation Guild) |
| **Faculty Interviewer** | `interviewer@campus.edu` | `Interviewer@123` | Prof. David Zhao (Recruitment Assessor) |
| **Student (Eligible)** | `student1@campus.edu` | `Student@123` | Emma Watson (CS Major, 3.78 CGPA) |
| **Student (Low CGPA)** | `student2@campus.edu` | `Student@123` | Jordan Lee (BBA Major, 2.35 CGPA — for testing eligibility rejects) |
| **Volunteer Star** | `volunteer@campus.edu` | `Volunteer@123` | Sophia Rodriguez (Media & Photography Volunteer) |

> 💡 **Tip:** The system includes a **Quick 1-Click Role Switcher** dropdown in the top navbar and login page for switching between personas during demonstrations.

---

## 🛠️ Installation & Setup

### Prerequisites
* **Node.js**: v18+ (tested on Node.js v24 LTS)
* **npm**: v9+
* **MongoDB**: Local MongoDB on port 27017 or MongoDB Atlas URI

### 1. Clone & Install Dependencies
```bash
# In project root
npm run install:all
```

### 2. Configure Environment Variables
Create `.env` in `server/`:
```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/university_club_management
JWT_SECRET=super_secret_university_club_jwt_key_2026_secure
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

### 3. Seed Database
Populate demo users, clubs, venues, equipment, events, applications, evaluations, and certificates:
```bash
npm run seed
```

### 4. Run Application
Run backend and frontend concurrently:
```bash
npm run dev
```

* **Frontend Client**: `http://localhost:5173`
* **Backend API**: `http://localhost:5000/api`
* **Health Check**: `http://localhost:5000/api/health`

---

## 🎬 7 Core Demo Verification Flows

### Flow 1: Recruitment & Eligibility Checking
1. Login as `student1@campus.edu` (Emma - 3.78 GPA).
2. Go to **Explore Clubs** → Select **Computer & AI Society**.
3. Click **Check My Eligibility** → Notice the green **"Eligible"** verdict.
4. Now switch to `student2@campus.edu` (Jordan - 2.35 GPA) and test eligibility → Observe the red **"Ineligible"** banner with explicit reason: *"CGPA requirement not met: minimum 2.75 required"*.
5. As Emma, submit an application with statement and experience.

### Flow 2: Interview Scheduling & 5-Rubric Grading
1. As Emma, go to **My Applications** → Click **Book Slot** → Select an open interview time slot.
2. Switch to `interviewer@campus.edu` (Prof. Zhao) → Open **Interview Center** or **Recruitment Desk**.
3. Click **Score Applicant** on Emma's application.
4. Adjust sliders for Communication (19/20), Technical (18/20), Leadership (18/20), Creativity (19/20), Problem Solving (18/20) → Total **92/100** calculates automatically.
5. Select recommendation **"Strong Accept"** and submit.

### Flow 3: Conflict-Free Event Proposals & Milestones
1. Switch to `leader.tech@campus.edu` (Alex).
2. Click **Create Proposal** → Choose a Venue and Time window.
3. Try deliberately setting a time that clashes with another event → Observe the real-time **Scheduling Conflicts Alert** highlighting the exact room and conflicting booking!
4. Select a clear venue slot, add preparation milestones, and submit.
5. Switch to `admin@campus.edu` to review and approve the proposal.

### Flow 4: Automatic Waitlist Promotions on Cancellation
1. As a student, register for an event with capacity limit.
2. If full, notice the status becomes **"WAITLISTED"** with position `#1`.
3. Switch to an already registered participant and click **"Cancel My Registration"**.
4. The backend automatically promotes the #1 waitlisted student to **"REGISTERED"** and delivers a notification.

### Flow 5: QR Code Attendance Verification
1. Open the event page as an organizer → Click **Display Attendance QR**.
2. Switch to a registered student → Go to **Attendance & Passes** → Click **Scan & Verify**.
3. Input the token `EVT-HACKSPRINT-2026` → Click **Verify Attendance**.
4. Observe **"+20 Points"** awarded, status updated to `ATTENDED`, and duplicate scans prevented.

### Flow 6: Skill-Based Volunteers & 3-Step Duty Swap
1. Go to **Volunteer Hub** → Click **Skill Matcher AI** → Select skills (e.g. *Photography*).
2. Notice ranked volunteer recommendations with match %, active workload counts, and past completed duties.
3. As an assigned volunteer, click **Swap** → Select a peer volunteer and input a reason.
4. Peer logs in → Clicks **Accept Swap**.
5. Club Leader logs in → Clicks **Approve Transfer** → Duty ownership updates automatically.

### Flow 7: Verifiable Digital Certificates
1. Go to **Certificate Wallet** → View earned awards.
2. Click **Download PDF Certificate** to generate an official branded PDF.
3. Click **Public Verification Page** or visit `/verify-certificate/CERT-HACK-2026-01` to test employer credential lookup.

---

## 🏛️ Project Architecture

```
university-club-management/
├── server/
│   ├── src/
│   │   ├── config/             # DB & JWT configurations
│   │   ├── controllers/        # Modular API feature controllers
│   │   ├── middleware/         # Auth, RBAC & Error Handlers
│   │   ├── models/             # 16+ Mongoose Relational Schemas
│   │   ├── routes/             # REST Endpoints
│   │   ├── services/           # Conflict detection, Eligibility & Waitlist promoters
│   │   ├── utils/              # Seeder script & helpers
│   │   └── server.js           # Server entry point
│   ├── .env.example
│   └── package.json
│
├── client/
│   ├── src/
│   │   ├── components/         # Reusable UI: Navbar, Sidebar, Modal, DataTable, ConflictAlert
│   │   ├── context/            # AuthContext & NotificationContext
│   │   ├── layouts/            # DashboardLayout
│   │   ├── pages/              # Role Dashboards, Recruitment, Events, Attendance, Finance, etc.
│   │   ├── services/           # Axios API instance
│   │   ├── App.jsx             # Router & Protected route guards
│   │   ├── main.jsx
│   │   └── index.css           # Tailwind design tokens
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── package.json
│
├── README.md
└── package.json                # Monorepo runner
```
