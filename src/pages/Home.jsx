// src/pages/Home.jsx
import React, { useState, useEffect, useRef, useMemo } from 'react';
import accountData from '../assets/data/accountData';
import leadImg from '../assets/img/lead.png';
import aboutImg from '../assets/img/aboutImg.png';
import "../assets/styles/home.css";
import api from "../services/api";

// Custom hook defined OUTSIDE the component (required by React rules of hooks)
function useCountUp(end, start) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start || !end) return;
    let current = 0;
    const increment = end / 75;
    const timer = setInterval(() => {
      current += increment;
      if (current >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, 20);
    return () => clearInterval(timer);
  }, [end, start]);
  return count;
}

function formatGbp(val) {
  if (!val) return '—';
  if (val >= 1000000) return '£' + (val / 1000000).toFixed(1) + 'M';
  if (val >= 1000) return '£' + Math.round(val / 1000) + 'K';
  return '£' + val;
}

const SERVICES = [
  {
    key: "markets",
    title: "NatWest Markets",
    desc: "Accenture supports NatWest Markets' transformation through cloud engineering, real-time microservices, automation, and analytics modernization. We enable Google Cloud-native data platforms, real-time transaction services, and Power Platform automation to improve scalability, throughput, and operational efficiency.",
  },
  {
    key: "treasury",
    title: "Treasury",
    desc: "Treasury is the heart of the bank, responsible for managing capital and liquidity to ensure financial stability, resilience, and uninterrupted business operations. In partnership with Accenture, NatWest Treasury's Secure Funding platform has been transformed through cloud-native architecture, data modernization, automation, and GenAI-enabled optimization.",
  },
  {
    key: "rbsi",
    title: "RBSI",
    desc: "Migration from older legacy core banking systems IBBA to Avaloq, a modern core banking and wealth management platform for central processing, better regulatory compliance, improved customer onboarding, and stronger digital capabilities.",
  },
  {
    key: "bas",
    title: "BAS (Business Automation Services)",
    desc: "Business Automation Services (BAS) delivers modular, automated solutions that accelerate digital transformation across NatWest Group. Think of BAS as the LEGO set of digital journeys - building blocks that simplify complexity, scale innovation, and enhance experiences for both customers and colleagues.",
  },
  {
    key: "architecture",
    title: "Architecture & Engineering",
    desc: "We deliver capabilities that delight customers and colleagues, responding rapidly to changing needs and market dynamics. We're doing this by building, innovating, and engineering with data and AI at market-beating pace, embedding safety by design into every decision.",
  },
  {
    key: "fincrime",
    title: "Economic Crime & Fraud",
    desc: "We are helping the Bank enable next-generation FinCrime threat monitoring and processing across key programs - Customer Due Diligence, Name Screening, Anti-Money Laundering, Fraud Prevention, Transaction Monitoring, Reporting, and Data Quality & Transformation.",
  },
  {
    key: "infra-security",
    title: "Infrastructure & Security",
    desc: "We manage the infrastructure across the Bank which covers technologies that help set up and manage various platforms whether on premise or cloud to support numerous applications catering to the Bank's customers as well as the enterprise as a whole.",
  },
  {
    key: "fral",
    title: "FRAL",
    desc: "This is a strategic partnership program providing business and technology services across the FRAL (Finance, Risk, Audit, Legal) domain, covering Finance Cost Ledger, Basel 3.1, TWD, XDP, FRANK Migration, EFRA as well as technology transformation including moving on-prem applications to AWS.",
  },
];

const Home = () => {
  const [data] = useState(accountData);
  const [activeService, setActiveService] = useState(null);
  const [members, setMembers] = useState([]);

  // Deliverable stats
  const [totalGpp, setTotalGpp] = useState(0);
  const [totalDeliverables, setTotalDeliverables] = useState(0);
  const [aiDeliverables, setAiDeliverables] = useState(0);
  const [newFunctionalities, setNewFunctionalities] = useState(0);

  // Portfolio & Reach
  const [programsList, setProgramsList] = useState([]);
  const [busSupported, setBusSupported] = useState(0);

  // Engagement & Culture
  const [recognitionsCount, setRecognitionsCount] = useState(0);
  const [eventsCount, setEventsCount] = useState(0);

  // Scroll trigger for count-up
  const statsRef = useRef(null);
  const [startCount, setStartCount] = useState(false);

  const allMembers = useMemo(
    () => (members.length ? members : data.flatMap((s) => s.members || [])),
    [members, data]
  );
  const totalMembers = allMembers.length;

  const avgExperience = useMemo(() => {
    const vals = allMembers.map((m) => Number(m.experience)).filter((v) => v > 0);
    return vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 0;
  }, [allMembers]);

  const seniorCount = useMemo(
    () =>
      allMembers.filter((m) => {
        const lvl = String(m.careerLevel || '').toLowerCase();
        return (
          lvl.includes('manager') ||
          lvl.includes('director') ||
          lvl.includes('lead') ||
          lvl.includes('principal') ||
          lvl.includes('l5') ||
          lvl.includes('l6') ||
          lvl.includes('l7')
        );
      }).length,
    [allMembers]
  );

  const femalePercentage = useMemo(() => {
    const femaleCount = allMembers.filter(
      (m) => m.gender?.toLowerCase() === 'female'
    ).length;
    return totalMembers ? Math.round((femaleCount / totalMembers) * 100) : 0;
  }, [allMembers, totalMembers]);

  const locationsCount = useMemo(
    () => new Set(allMembers.map((m) => m.location).filter(Boolean)).size,
    [allMembers]
  );

  const activePrograms = useMemo(() => {
    const names = new Set([
      ...programsList.map((p) => p.name.toLowerCase()),
      ...allMembers.filter((u) => u.projectName).map((u) => u.projectName.toLowerCase()),
    ]);
    return names.size;
  }, [programsList, allMembers]);

  // Data fetches
  useEffect(() => {
    api
      .get('/users?limit=1000')
      .then((res) => {
        const users = res.data.users || res.data || [];
        setMembers(Array.isArray(users) ? users : []);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    api
      .get('/deliverables')
      .then((res) => {
        const items = Array.isArray(res.data) ? res.data : [];
        setTotalDeliverables(items.length);
        setAiDeliverables(items.filter((i) => i.aiBased === true).length);
        setNewFunctionalities(items.filter((i) => i.category === 'New Functionality').length);
        const saved = items
          .filter((i) => i.category === 'Cost Saving')
          .reduce((sum, i) => sum + Number(i.costSavingAmount || 0), 0);
        setTotalGpp(saved);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    Promise.all([
      api.get('/programs'),
      api.get('/capabilities'),
      api.get('/recognition'),
      api.get('/events'),
    ])
      .then(([progRes, capRes, recogRes, eventsRes]) => {
        setProgramsList(Array.isArray(progRes.data) ? progRes.data : []);
        setBusSupported(Array.isArray(capRes.data) ? capRes.data.length : 0);
        setRecognitionsCount(Array.isArray(recogRes.data) ? recogRes.data.length : 0);
        setEventsCount(Array.isArray(eventsRes.data) ? eventsRes.data.length : 0);
      })
      .catch(() => {});
  }, []);

  // Intersection observer for count-up trigger
  useEffect(() => {
    const el = statsRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setStartCount(true); },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Animated counters
  const membersAnim        = useCountUp(totalMembers,       startCount);
  const locationsAnim      = useCountUp(locationsCount,     startCount);
  const femaleAnim         = useCountUp(femalePercentage,   startCount);
  const totalGppAnim       = useCountUp(totalGpp,           startCount);
  const aiDelivAnim        = useCountUp(aiDeliverables,     startCount);
  const totalDelivAnim     = useCountUp(totalDeliverables,  startCount);
  const newFuncAnim        = useCountUp(newFunctionalities, startCount);
  const activeProgramsAnim = useCountUp(activePrograms,     startCount);
  const busSupportedAnim   = useCountUp(busSupported,       startCount);
  const recognitionsAnim   = useCountUp(recognitionsCount,  startCount);
  const eventsAnim         = useCountUp(eventsCount,        startCount);
  const avgExpAnim         = useCountUp(avgExperience,      startCount);
  const seniorAnim         = useCountUp(seniorCount,        startCount);

  const THEME_CARDS = [
    {
      title: 'Delivery & Output',
      icon: '🚀',
      accentColor: '#6d28d9',
      metrics: [
        { label: 'Total Deliverables',  value: totalDelivAnim },
        { label: 'New Functionalities', value: newFuncAnim    },
        { label: 'AI-Powered',          value: aiDelivAnim    },
        { label: 'Cost Saved',          value: formatGbp(totalGpp) },
      ],
    },
    {
      title: 'Portfolio & Reach',
      icon: '🗂️',
      accentColor: '#047857',
      metrics: [
        { label: 'Active Programs', value: activeProgramsAnim },
        { label: 'Business Units',  value: busSupportedAnim   },
        { label: 'Locations',       value: locationsAnim      },
      ],
    },
    {
      title: 'People & Talent',
      icon: '👥',
      accentColor: '#b45309',
      metrics: [
        { label: 'Total Members',        value: membersAnim         },
        { label: 'Avg Experience',       value: avgExpAnim + ' yrs' },
        { label: 'Female Workforce',     value: femaleAnim + '%'    },
        { label: 'Senior Practitioners', value: seniorAnim          },
      ],
    },
    {
      title: 'Engagement & Culture',
      icon: '🏆',
      accentColor: '#9d174d',
      metrics: [
        { label: 'Recognitions Awarded', value: recognitionsAnim },
        { label: 'Events Organized',     value: eventsAnim       },
      ],
    },
  ];

  return (
    <div className="home-wrapper">

      {/* ── Banner ── */}
      <section className="homeBanner d-flex align-items-center">
        <div className="container">
          <div className="row alignCenter">
            <div className="col-12 col-lg-8 textContent">
              <h4 className="subtitle">NatWest Relationship Overview</h4>
              <h3 className="title gradientText">
                <p>
                  Accenture has a strategic partnership with NatWest, a Diamond client,
                  supported by over 1,050 consultants across the bank. Combining expertise
                  in Strategy &amp; Consulting, Technology, Song, and Operations, we help
                  drive innovation and large-scale transformation.
                </p>
                <p>
                  Together, we have advanced NatWest's digital leadership through GenAI
                  adoption, ChatGPT integration, Cora enhancements with OpenAI technologies,
                  cloud transformation, and data modernization.
                </p>
              </h3>
              <div className="authorBox">
                <p className="authorName">Nina S. Raphael</p>
                <span className="authorRole">Accenture Leadership</span>
              </div>
            </div>
            <div className="col-12 col-lg-4 imageWrapper">
              <img className="leadPic" src={leadImg} alt="leadership" />
            </div>
          </div>
        </div>
      </section>

      {/* ── Organizational Overview ── */}
      <section className="serviceBox">
        <div className="container">
          <div className="row">
            <div className="col-5">
              <h2>NatWest Organizational Overview</h2>
              <div className="aboutImg">
                <img className="aboutPic" src={aboutImg} alt="About NatWest" />
              </div>
            </div>
            <div className="col-7">
              <div className="serviceItem horizontal">
                {activeService === null ? (
                  <div className="servicesGrid">
                    {SERVICES.map((s) => (
                      <div key={s.key} onClick={() => setActiveService(s)}>
                        {s.title}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="descBox" onClick={() => setActiveService(null)}>
                    <h2>{activeService.title}</h2>
                    <p style={{ whiteSpace: 'pre-line' }}>{activeService.desc}</p>
                    <button
                      style={{ marginTop: '15px', padding: '6px 12px' }}
                      onClick={(e) => { e.stopPropagation(); setActiveService(null); }}
                    >
                      Back
                    </button>
                  </div>
                )}
              </div>

              <div className="verticalGroup">
                <div className="serviceItem vertical">
                  <h5>Retail Banking</h5>
                  <p>
                    Accenture helps bank in providing a range of banking products and
                    related financial services, including CASA, mortgages, and unsecured
                    lending through credit cards and loans.
                  </p>
                </div>
                <div className="serviceItem vertical">
                  <h5>Wealth</h5>
                  <p>
                    We help bank by improving their internal processes and supporting
                    banks OBDS (One Bank Design System) vision by reengineering new solutions.
                  </p>
                </div>
                <div className="serviceItem vertical">
                  <h5>Commercial and Institutional Banking</h5>
                  <p>
                    Accenture helps the Bank with customer experience across MMM, EDB, MMG
                    by enabling digital ecosystem and process improvement to better serve customers.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Account Overview ── */}
      <section className={`acc-overview-section${startCount ? ' started' : ''}`} ref={statsRef}>
        <div className="acc-glow-1" />
        <div className="acc-glow-2" />

        <div className="container" style={{ position: 'relative', zIndex: 1 }}>

          {/* Section heading */}
          <div className="acc-header">
            <span className="acc-badge">Performance Dashboard</span>
            <h1 className="acc-heading">Account Overview</h1>
            <div className="acc-divider" />
          </div>

          {/* Headline stats */}
          <div className="acc-stats-row">
            {[
              { value: membersAnim + '+',        label: 'Team Members'    },
              { value: formatGbp(totalGppAnim),  label: 'Cost Saved'      },
              { value: aiDelivAnim,              label: 'AI Deliverables' },
              { value: activeProgramsAnim,       label: 'Active Programs' },
              { value: locationsAnim,            label: 'Locations'       },
              { value: femaleAnim + '%',         label: 'Female Workforce'},
            ].map(({ value, label }) => (
              <div className="acc-stat-item" key={label}>
                <strong className="acc-stat-number">{value}</strong>
                <span className="acc-stat-label">{label}</span>
              </div>
            ))}
          </div>

          {/* 4 themed detail cards */}
          <div className="theme-grid">
            {THEME_CARDS.map((card) => (
              <div className="theme-card" key={card.title}>
                <div
                  className="theme-card-header"
                  style={{ background: card.accentColor, borderLeftColor: card.accentColor }}
                >
                  <div
                    className="theme-icon-wrap"
                    style={{ background: 'rgba(255,255,255,0.18)' }}
                  >
                    {card.icon}
                  </div>
                  <span className="theme-card-title">{card.title}</span>
                </div>
                <div className="theme-metrics">
                  {card.metrics.map((m) => (
                    <div className="theme-metric" key={m.label}>
                      <span className="metric-label">{m.label}</span>
                      <strong className="metric-value" style={{ color: card.accentColor }}>
                        {m.value}
                      </strong>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

    </div>
  );
};

export default Home;
