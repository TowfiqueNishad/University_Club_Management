const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

dotenv.config();

// Models
const User = require('../models/User');
const Club = require('../models/Club');
const ClubApplication = require('../models/ClubApplication');
const InterviewSlot = require('../models/InterviewSlot');
const InterviewEvaluation = require('../models/InterviewEvaluation');
const Event = require('../models/Event');
const EventRegistration = require('../models/EventRegistration');
const Attendance = require('../models/Attendance');
const VolunteerDuty = require('../models/VolunteerDuty');
const DutySwapRequest = require('../models/DutySwapRequest');
const Venue = require('../models/Venue');
const Equipment = require('../models/Equipment');
const Expense = require('../models/Expense');
const Badge = require('../models/Badge');
const Certificate = require('../models/Certificate');
const Notification = require('../models/Notification');
const RecruitmentWaitlist = require('../models/RecruitmentWaitlist');

const seedDataDirect = async () => {
  try {
    console.log('[Seeder] Seeding CampusHub collections...');

    // Clear existing collections
    await User.deleteMany({});
    await Club.deleteMany({});
    await ClubApplication.deleteMany({});
    await InterviewSlot.deleteMany({});
    await InterviewEvaluation.deleteMany({});
    await Event.deleteMany({});
    await EventRegistration.deleteMany({});
    await Attendance.deleteMany({});
    await VolunteerDuty.deleteMany({});
    await DutySwapRequest.deleteMany({});
    await Venue.deleteMany({});
    await Equipment.deleteMany({});
    await Expense.deleteMany({});
    await Badge.deleteMany({});
    await Certificate.deleteMany({});
    await Notification.deleteMany({});
    await RecruitmentWaitlist.deleteMany({});

    // 1. Create Users
    const admin = await User.create({
      name: 'Dr. Sarah Jenkins',
      email: 'admin@campus.edu',
      password: 'Admin@123',
      role: 'ADMIN',
      studentId: 'FAC-ADMIN-01',
      department: 'Office of Student Affairs',
      semester: 12,
      cgpa: 4.0,
      completedCredits: 160,
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
      bio: 'University Dean of Student Affairs & Club Governance Director.',
      phone: '+1 (555) 901-2000',
      points: 2500,
    });

    const techLeader = await User.create({
      name: 'Alex Rivera',
      email: 'leader.tech@campus.edu',
      password: 'Leader@123',
      role: 'CLUB_LEADER',
      studentId: 'STU-2023-CS042',
      department: 'Computer Science & Engineering',
      semester: 6,
      cgpa: 3.85,
      completedCredits: 78,
      skills: ['React', 'Node.js', 'Event Management', 'Public Speaking'],
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      bio: 'Lead Developer and President of Computer & AI Society.',
      phone: '+1 (555) 234-5678',
      points: 850,
    });

    const roboticsLeader = await User.create({
      name: 'Marcus Vance',
      email: 'leader.robotics@campus.edu',
      password: 'Leader@123',
      role: 'CLUB_LEADER',
      studentId: 'STU-2023-EEE019',
      department: 'Electrical & Electronic Engineering',
      semester: 7,
      cgpa: 3.72,
      completedCredits: 92,
      skills: ['Embedded C', 'Robotics', 'Hardware Staging', 'Team Leadership'],
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      bio: 'Robotics enthusiast and creator of the Autonomous Rover Project.',
      phone: '+1 (555) 345-6789',
      points: 620,
    });

    const interviewer = await User.create({
      name: 'Prof. David Zhao',
      email: 'interviewer@campus.edu',
      password: 'Interviewer@123',
      role: 'INTERVIEWER',
      studentId: 'FAC-ENG-88',
      department: 'Computer Science & Engineering',
      semester: 10,
      cgpa: 3.95,
      completedCredits: 140,
      skills: ['Technical Assessment', 'Leadership Evaluation', 'System Design'],
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      bio: 'Faculty advisor & head recruitment interviewer for campus technical societies.',
      phone: '+1 (555) 456-7890',
      points: 1200,
    });

    const student1 = await User.create({
      name: 'Emma Watson',
      email: 'student1@campus.edu',
      password: 'Student@123',
      role: 'STUDENT',
      studentId: 'STU-2024-CS104',
      department: 'Computer Science & Engineering',
      semester: 4,
      cgpa: 3.78,
      completedCredits: 48,
      skills: ['Python', 'Graphic Design', 'Public Speaking', 'Social Media'],
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      bio: 'Sophomore CS major passionate about UI/UX and web technologies.',
      phone: '+1 (555) 567-8901',
      points: 340,
    });

    const student2 = await User.create({
      name: 'Jordan Lee',
      email: 'student2@campus.edu',
      password: 'Student@123',
      role: 'STUDENT',
      studentId: 'STU-2025-BBA012',
      department: 'Business Administration',
      semester: 2,
      cgpa: 2.35, // Low CGPA for rejection demo testing
      completedCredits: 15,
      skills: ['Marketing', 'Finance', 'Public Speaking'],
      avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
      bio: 'Freshman exploring campus clubs and leadership opportunities.',
      phone: '+1 (555) 678-9012',
      points: 60,
    });

    const volunteer = await User.create({
      name: 'Sophia Rodriguez',
      email: 'volunteer@campus.edu',
      password: 'Volunteer@123',
      role: 'STUDENT',
      studentId: 'STU-2024-MED055',
      department: 'Arts & Media Studies',
      semester: 5,
      cgpa: 3.65,
      completedCredits: 62,
      skills: ['Photography', 'Video Editing', 'Event Management', 'Social Media'],
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
      bio: 'Award-winning campus photographer and seasoned event volunteer coordinator.',
      phone: '+1 (555) 789-0123',
      points: 580,
    });

    // 2. Create Badges
    await Badge.create({
      name: 'First Step',
      code: 'FIRST_STEP',
      category: 'GENERAL',
      description: 'Joined your first university club and attended an onboarding session.',
      icon: 'Footprints',
      color: 'indigo',
      pointsRequirement: 50,
    });

    await Badge.create({
      name: 'Active Member',
      code: 'ACTIVE_MEMBER',
      category: 'EVENT',
      description: 'Attended 5+ campus events with consistent attendance.',
      icon: 'Flame',
      color: 'emerald',
      pointsRequirement: 200,
    });

    await Badge.create({
      name: 'Volunteer Star',
      code: 'VOLUNTEER_STAR',
      category: 'VOLUNTEER',
      description: 'Successfully completed and verified 3+ volunteer duties.',
      icon: 'Award',
      color: 'amber',
      pointsRequirement: 400,
    });

    await Badge.create({
      name: 'Event Hero',
      code: 'EVENT_HERO',
      category: 'LEADERSHIP',
      description: 'Demonstrated exceptional leadership and event organization impact.',
      icon: 'Trophy',
      color: 'purple',
      pointsRequirement: 800,
    });

    // 3. Create Venues
    const venue1 = await Venue.create({
      name: 'Grand University Auditorium',
      building: 'Academic Complex Block A',
      roomNumber: 'Auditorium-1',
      capacity: 500,
      facilities: ['4K Projector', 'Surround Sound', 'Central AC', 'Stage Lighting', 'Live Streaming Rig'],
      description: 'Flagship university auditorium suitable for international conferences, hackathons, and galas.',
      image: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=600&auto=format&fit=crop&q=80',
    });

    const venue2 = await Venue.create({
      name: 'Innovation & Robotics Lab 402',
      building: 'Engineering Hall',
      roomNumber: 'ENG-402',
      capacity: 60,
      facilities: ['High-Performance Workstations', '3D Printers', 'Oscilloscopes', 'Soldering Stations'],
      description: 'Modern engineering laboratory equipped for hardware builds and interactive workshops.',
      image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&auto=format&fit=crop&q=80',
    });

    // 4. Create Equipment
    await Equipment.create({
      name: 'Sony FX3 Cinema Camera Kit',
      category: 'Camera & Video',
      totalQuantity: 4,
      availableQuantity: 4,
      condition: 'EXCELLENT',
      location: 'Media Studio Locker #1',
      description: 'Professional 4K camera with 24-70mm GM lens, tripod, and memory cards.',
    });

    await Equipment.create({
      name: 'Shure Dual Wireless Microphone System',
      category: 'Audio/Visual',
      totalQuantity: 8,
      availableQuantity: 8,
      condition: 'EXCELLENT',
      location: 'Audio Gear Rack #3',
      description: 'UHF handheld and lapel wireless microphone set with receiver.',
    });

    await Equipment.create({
      name: 'Epson Pro 6000-Lumen Laser Projector',
      category: 'Audio/Visual',
      totalQuantity: 5,
      availableQuantity: 5,
      condition: 'EXCELLENT',
      location: 'Tech Storage 102',
      description: 'Ultra-bright HDMI projector for bright daylight auditoriums.',
    });

    // 5. Create Clubs
    const techClub = await Club.create({
      name: 'Computer & AI Society',
      code: 'CAIS',
      category: 'Technology',
      description: 'The premier technical student organization empowering students with modern AI, web development, cloud computing, and competitive programming.',
      logo: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=150&auto=format&fit=crop&q=80',
      banner: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&auto=format&fit=crop&q=80',
      lead: techLeader._id,
      executives: [techLeader._id],
      members: [techLeader._id, student1._id],
      maxMembers: 50,
      eligibilityRequirements: {
        minCgpa: 2.75,
        allowedDepartments: ['Computer Science & Engineering', 'Electrical & Electronic Engineering', 'Software Engineering'],
        minSemester: 2,
        minCredits: 15,
        customQuestion: 'What technical domain (AI, Web, Mobile, Cloud) are you most excited to build in?',
      },
      budget: { allocated: 6500, spent: 1850, currency: 'USD' },
      status: 'RECRUITING',
    });

    const roboticsClub = await Club.create({
      name: 'Robotics & Automation Guild',
      code: 'RAG',
      category: 'Robotics',
      description: 'Fostering hands-on engineering, autonomous drone tech, IoT, and embedded robotics competitions across the nation.',
      logo: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=150&auto=format&fit=crop&q=80',
      banner: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&auto=format&fit=crop&q=80',
      lead: roboticsLeader._id,
      executives: [roboticsLeader._id],
      members: [roboticsLeader._id],
      maxMembers: 35,
      eligibilityRequirements: {
        minCgpa: 2.5,
        allowedDepartments: [],
        minSemester: 1,
        minCredits: 0,
      },
      budget: { allocated: 5000, spent: 1200, currency: 'USD' },
      status: 'RECRUITING',
    });

    const artsClub = await Club.create({
      name: 'Campus Media & Visual Arts Guild',
      code: 'CMAG',
      category: 'Arts & Media',
      description: 'Uniting campus photographers, cinematographers, digital artists, and storytellers to document university life.',
      logo: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=150&auto=format&fit=crop&q=80',
      banner: 'https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=800&auto=format&fit=crop&q=80',
      lead: volunteer._id,
      executives: [volunteer._id],
      members: [volunteer._id],
      maxMembers: 40,
      eligibilityRequirements: {
        minCgpa: 2.0,
        allowedDepartments: [],
        minSemester: 1,
        minCredits: 0,
      },
      budget: { allocated: 4000, spent: 850, currency: 'USD' },
      status: 'RECRUITING',
    });

    // 6. Interview Slots & Applications
    const interviewSlot1 = await InterviewSlot.create({
      club: techClub._id,
      interviewer: interviewer._id,
      date: '2026-09-05',
      startTime: '14:00',
      endTime: '14:30',
      location: 'ENG-402 Conference Room / Google Meet',
      maxApplicants: 1,
      bookedApplicants: [student1._id],
      status: 'FULL',
    });

    await InterviewSlot.create({
      club: techClub._id,
      interviewer: interviewer._id,
      date: '2026-09-05',
      startTime: '14:30',
      endTime: '15:00',
      location: 'ENG-402 Conference Room / Google Meet',
      maxApplicants: 1,
      bookedApplicants: [],
      status: 'AVAILABLE',
    });

    const app1 = await ClubApplication.create({
      club: techClub._id,
      applicant: student1._id,
      status: 'INTERVIEWED',
      statement: 'I have a strong passion for frontend engineering with React and want to contribute to the club web portal.',
      experience: 'Built 3 fullstack web apps and contributed to open source.',
      interviewSlot: interviewSlot1._id,
      evaluationScore: 92,
      eligibilitySnapshot: {
        cgpa: 3.78,
        department: 'Computer Science & Engineering',
        semester: 4,
        completedCredits: 48,
        isEligible: true,
        rejectionReasons: [],
      },
    });

    await InterviewEvaluation.create({
      application: app1._id,
      club: techClub._id,
      interviewer: interviewer._id,
      applicant: student1._id,
      scores: {
        communication: 19,
        technicalKnowledge: 18,
        leadership: 18,
        creativity: 19,
        problemSolving: 18,
      },
      totalScore: 92,
      averageScore: 18.4,
      recommendation: 'STRONG_ACCEPT',
      comments: 'Exceptional candidate with solid React fundamentals and great leadership enthusiasm.',
    });

    // 7. Events & Registrations
    const event1 = await Event.create({
      title: 'Annual HackSprint 2026: AI & Cloud Innovation',
      description: '36-hour flagship inter-university hackathon featuring workshops, mentor hours, and $5,000 prize pool.',
      eventType: 'Hackathon',
      club: techClub._id,
      collaboratingClubs: [
        { club: roboticsClub._id, status: 'ACCEPTED', roleDescription: 'Hardware & IoT Track Co-host' },
        { club: artsClub._id, status: 'ACCEPTED', roleDescription: 'Media, Photography & Branding Partner' },
      ],
      venue: venue1._id,
      customLocation: 'Grand University Auditorium',
      date: '2026-09-18',
      startTime: '09:00',
      endTime: '21:00',
      capacity: 100,
      registeredCount: 1,
      budgetPlanned: 3000,
      budgetSpent: 1200,
      status: 'PUBLISHED',
      qrCodeSecret: 'EVT-HACKSPRINT-2026',
      milestones: [
        { title: 'Auditorium Booking & AV Setup', description: 'Reserve hall and setup dual projectors', deadline: new Date('2026-09-10'), status: 'COMPLETED', progressPercentage: 100 },
        { title: 'Sponsorship Finalization', description: 'Confirm tech sponsors and swag bags', deadline: new Date('2026-09-12'), status: 'COMPLETED', progressPercentage: 100 },
        { title: 'Volunteer Briefing & Tasks', description: 'Assign registration and staging crews', deadline: new Date('2026-09-15'), status: 'IN_PROGRESS', progressPercentage: 65 },
        { title: 'Final Hackathon Kickoff', description: 'Live event execution and judging', deadline: new Date('2026-09-18'), status: 'NOT_STARTED', progressPercentage: 0 },
      ],
      requiredVolunteers: [
        { skill: 'Photography', count: 2 },
        { skill: 'Technical Support', count: 4 },
      ],
      tags: ['Hackathon', 'AI', 'Coding'],
    });

    await EventRegistration.create({
      event: event1._id,
      user: student1._id,
      status: 'ATTENDED',
      ticketCode: 'TKT-HACKSPRINT-001',
      registeredAt: new Date('2026-09-01'),
    });

    await Attendance.create({
      event: event1._id,
      user: student1._id,
      verifiedBy: techLeader._id,
      status: 'PRESENT',
      method: 'QR_SCAN',
      scanTimestamp: new Date(),
    });

    // 8. Volunteer Duties
    await VolunteerDuty.create({
      event: event1._id,
      club: techClub._id,
      title: 'Event Photography & Highlight Reel',
      description: 'Capture keynote speeches, team hacking sessions, and award ceremony photos.',
      requiredSkills: ['Photography', 'Video Editing'],
      assignedTo: volunteer._id,
      deadline: new Date('2026-09-18'),
      status: 'VERIFIED',
      hoursLogged: 6,
      pointsReward: 100,
      verifiedBy: techLeader._id,
      verifiedAt: new Date(),
    });

    // 9. Expenses
    await Expense.create({
      club: techClub._id,
      event: event1._id,
      title: 'Catering & Meals for Hackathon Participants',
      category: 'Food & Catering',
      amount: 750,
      date: '2026-09-18',
      recordedBy: techLeader._id,
      status: 'APPROVED',
    });

    // 10. Certificates
    await Certificate.create({
      certificateId: 'CERT-HACK-2026-01',
      user: student1._id,
      event: event1._id,
      club: techClub._id,
      title: 'Certificate of Excellence — Hackathon Finalist',
      achievement: 'Successfully engineered an AI-powered campus assistance tool and placed Top 3.',
      issueDate: new Date('2026-09-19'),
      verificationUrl: `http://localhost:5173/verify-certificate/CERT-HACK-2026-01`,
      status: 'VALID',
      issuerName: 'CampusHub Office of Student Affairs',
    });

    console.log('[Seeder] Database initialized with realistic demo data.');
    return true;
  } catch (err) {
    console.error('[Seeder Error]:', err.message);
    return false;
  }
};

// Standalone execution support
if (require.main === module) {
  (async () => {
    const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/university_club_management';
    await mongoose.connect(mongoURI);
    await seedDataDirect();
    process.exit(0);
  })();
}

module.exports = {
  seedDataDirect,
};
