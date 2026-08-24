// src/pages/Home.jsx
import React, { useState, useEffect, useRef } from 'react';
import accountData from '../assets/data/accountData';
import leadImg from '../assets/img/lead.png';
import accIocn1 from '../assets/img/accIcon1.png';
import accIocn2 from '../assets/img/accIcon3.png';
import accIocn3 from '../assets/img/accIcon2.png';
import aboutImg from '../assets/img/aboutImg.png';
import "../assets/styles/home.css";
import api from "../services/api";

const Home = () => {
  const [data] = useState(accountData);
  const [active, setActive] = useState("dand");
  const [members, setMembers] = useState([]);
  const [activeService, setActiveService] = useState(null);
  const allMembers = members.length ? members : data.flatMap(section => section.members);
  const totalMembers = allMembers.length;

  // Deliverable metrics
  const [totalGpp, setTotalGpp] = useState(0);
  const [totalDeliverables, setTotalDeliverables] = useState(0);
  const [newFuncCount, setNewFuncCount] = useState(0);
  const [aiDelivCount, setAiDelivCount] = useState(0);

  // Program / org metrics
  const [activePrograms, setActivePrograms] = useState(0);
  const [eventsCount, setEventsCount] = useState(0);
  const [recognitionsCount, setRecognitionsCount] = useState(0);

  const services = [
    {
      key: "markets",
      title: "NatWest Markets",
      desc: `Accenture supports NatWest Markets' transformation through cloud engineering, real‑time microservices, automation, and analytics modernization. We enable Google Cloud–native data platforms, real‑time transaction services, and Power Platform automation to improve scalability, throughput, and operational efficiency. Our work spans Markets analytics, Primary Capital Markets pre‑trade automation, and Transaction Governance & Execution platforms, including continued migration of the syndicate tech stack to Google Cloud and management of core assets such as the F&RS Portal and Bond Syndicate/Bostik.`
    },
    {
      key: "treasury",
      title: "Treasury",
      desc: `Treasury is the heart of the bank, responsible for managing capital and liquidity to ensure financial stability, resilience, and uninterrupted business operations. In partnership with Accenture, NatWest Treasury's Secure Funding platform has been transformed through cloud‑native architecture, data modernization, automation, and GenAI‑enabled optimization across AWS (with selective GCP), significantly improving scalability, performance, cost efficiency, and enabling an intelligence‑driven, real‑time Treasury operating model.`
    },
    {
      key: "rbsi",
      title: "RBSI",
      desc: `Migration from older legacy core banking systems IBBA (International Back-office Banking Application) to Avaloq, a modern core banking and wealth management platform for central processing, better regulatory compliance, improved customer onboarding, and stronger digital capabilities.`
    },
    {
      key: "bas",
      title: "BAS (Business Automation Services)",
      desc: `Business Automation Services (BAS) delivers modular, automated solutions that accelerate digital transformation across NatWest Group. Think of BAS as the LEGO set of digital journeys—building blocks that simplify complexity, scale innovation, and enhance experiences for both customers and colleagues.`
    },
    {
      key: "architecture",
      title: "Architecture & Engineering",
      desc: `We deliver capabilities that delight customers and colleagues, responding rapidly to changing needs and market dynamics. We're doing this by building, innovating, and engineering with data and AI at market‑beating pace, embedding safety by design into every decision so we earn and protect customer trust.`
    },
    {
      key: "fincrime",
      title: "Economic Crime & Fraud",
      desc: `We are helping the Bank enable next‑generation FinCrime threat monitoring and processing across key programs in the FinCrime landscape – Customer Due Diligence, Name Screening, Anti‑Money Laundering, Fraud Prevention, Transaction Monitoring, Reporting, and Data Quality & Transformation.

      Fraud Prevention CoE (Centre of Excellence) is a centralized, specialist team that owns the end‑to‑end strategy, standards, and capabilities for detecting and stopping financial‑crime‑related fraud across products and channels. It acts as the "brain" of the bank's fraud‑prevention ecosystem.`
    },
    {
      key: "infra-security",
      title: "Infrastructure & Security",
      desc: `We manage the infrastructure across the Bank which covers technologies that help set up and manage various platforms whether on premise or cloud to support numerous applications catering to the Bank's customers as well as the enterprise as a whole.

Security acts as a central risk‑control layer that combines people, processes, and technology to protect money, data, and trust across both bricks‑and‑mortar and digital channels.`
    },
    {
      key: "fral",
      title: "FRAL",
      desc: `This is a strategic partnership program providing business and technology services across the FRAL (Finance, Risk, Audit, Legal) domain. This covers key strategic programs like Finance Cost Ledger, Basel 3.1, TWD, XDP, FRANK Migration, EFRA as well as technology transformation including moving on‑prem applications to AWS, building Risk and Finance data products, enhancing and developing finance systems like SubLedger and Finance Ledger, migrating Oracle DBs to Cloud at Customer, and transitioning apps from Appian to Microsoft Power Platform.`
    }
  ];

  // ── API FETCHES ─────────────────────────────────────────────────────────────

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const res = await api.get("/users?limit=1000");
        const users = res.data.users || res.data || [];
        setMembers(users);
      } catch (err) {
        console.error("Error fetching members:", err);
      }
    };
    fetchMembers();
  }, []);

  useEffect(() => {
    const fetchDeliverables = async () => {
      try {
        const res = await api.get("/deliverables");
        const items = res.data || [];

        setTotalDeliverables(items.length);

        setTotalGpp(
          items
            .filter(d => d.category === "Cost Saving")
            .reduce((sum, d) => sum + Number(d.costSavingAmount || 0), 0)
        );

        setNewFuncCount(
          items.filter(d => d.category === "New Functionality").length
        );

        setAiDelivCount(
          items.filter(d =>
            d.category?.toLowerCase().includes("ai") ||
            d.type?.toLowerCase().includes("ai") ||
            d.title?.toLowerCase().includes("ai")
          ).length
        );
      } catch (err) {
        console.error("Error fetching deliverables:", err);
      }
    };
    fetchDeliverables();
  }, []);

  useEffect(() => {
    const fetchPrograms = async () => {
      try {
        const res = await api.get("/programs");
        const programs = Array.isArray(res.data) ? res.data : [];
        setActivePrograms(programs.length);
      } catch (err) {
        console.error("Error fetching programs:", err);
      }
    };
    fetchPrograms();
  }, []);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await api.get("/events");
        const events = Array.isArray(res.data) ? res.data : res.data?.events || [];
        setEventsCount(events.length);
      } catch (err) {
        console.error("Error fetching events:", err);
      }
    };
    fetchEvents();
  }, []);

  useEffect(() => {
    const fetchRecognitions = async () => {
      try {
        const res = await api.get("/recognitions");
        const recs = Array.isArray(res.data) ? res.data : res.data?.recognitions || [];
        setRecognitionsCount(recs.length);
      } catch (err) {
        console.error("Error fetching recognitions:", err);
      }
    };
    fetchRecognitions();
  }, []);

  // ── COMPUTED MEMBER STATS ────────────────────────────────────────────────────

  const femaleCount = allMembers.filter(m => m.gender?.toLowerCase() === "female").length;
  const femalePercentage = totalMembers ? Math.round((femaleCount / totalMembers) * 100) : 0;

  const countries = [...new Set(allMembers.map(m => m.location).filter(Boolean))];
  const locationsCount = countries.length;

  const avgExp = allMembers.length
    ? Math.round(allMembers.reduce((sum, m) => sum + Number(m.experience || 0), 0) / allMembers.length)
    : 0;

  const seniorCount = allMembers.filter(m => {
    const lvl = String(m.careerLevel || m.level || "").toLowerCase();
    return lvl.includes("senior") || lvl.includes("manager") || lvl.includes("lead") ||
           lvl.includes("director") || lvl.includes("principal");
  }).length;

  const busCount = [...new Set(
    allMembers.map(m => m.bu || m.businessUnit || m.franchise || m.franchiseName).filter(Boolean)
  )].length;

  // ── SCROLL COUNTER TRIGGER ───────────────────────────────────────────────────

  const statsRef = useRef(null);
  const [startCount, setStartCount] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setStartCount(true); },
      { threshold: 0.3 }
    );
    if (statsRef.current) observer.observe(statsRef.current);
    return () => observer.disconnect();
  }, []);

  // ── COUNT-UP HOOK ────────────────────────────────────────────────────────────

  const useCountUp = (end, start) => {
    const [count, setCount] = useState(0);
    useEffect(() => {
      if (!start || end === 0) return;
      let current = 0;
      const increment = end / 75;
      const timer = setInterval(() => {
        current += increment;
        if (current >= end) { setCount(end); clearInterval(timer); }
        else { setCount(Math.floor(current)); }
      }, 20);
      return () => clearInterval(timer);
    }, [end, start]);
    return count;
  };

  // Animated values
  const membersAnim        = useCountUp(totalMembers,      startCount);
  const femaleAnim         = useCountUp(femalePercentage,  startCount);
  const locationsAnim      = useCountUp(locationsCount,    startCount);
  const totalDelivAnim     = useCountUp(totalDeliverables, startCount);
  const newFuncAnim        = useCountUp(newFuncCount,       startCount);
  const aiDelivAnim        = useCountUp(aiDelivCount,       startCount);
  const totalGppAnim       = useCountUp(totalGpp,           startCount);
  const activeProgramsAnim = useCountUp(activePrograms,    startCount);
  const busSupportedAnim   = useCountUp(busCount,           startCount);
  const avgExpAnim         = useCountUp(avgExp,             startCount);
  const seniorAnim         = useCountUp(seniorCount,        startCount);
  const eventsAnim         = useCountUp(eventsCount,        startCount);
  const recognitionsAnim   = useCountUp(recognitionsCount,  startCount);

  const formatGbp = (val) => {
    if (val >= 1_000_000) return `£${(val / 1_000_000).toFixed(1)}M`;
    if (val >= 1_000)     return `£${Math.round(val / 1_000)}K`;
    return `£${val}`;
  };

  // ── 4 THEME CARDS ────────────────────────────────────────────────────────────

  const THEME_CARDS = [
    {
      title: "Delivery & Output",
      icon: "🚀",
      gradient: "linear-gradient(135deg, #6c63ff 0%, #00c6ff 100%)",
      metrics: [
        { label: "Total Deliverables",  value: totalDelivAnim },
        { label: "New Functionalities", value: newFuncAnim    },
        { label: "AI-Powered",          value: aiDelivAnim    },
        { label: "Cost Saved",          value: formatGbp(totalGppAnim) },
      ],
    },
    {
      title: "Portfolio & Reach",
      icon: "🗂️",
      gradient: "linear-gradient(135deg, #198754 0%, #20c997 100%)",
      metrics: [
        { label: "Active Programs", value: activeProgramsAnim },
        { label: "Business Units",  value: busSupportedAnim   },
        { label: "Locations",       value: locationsAnim      },
      ],
    },
    {
      title: "People & Talent",
      icon: "👥",
      gradient: "linear-gradient(135deg, #fd7e14 0%, #ffc107 100%)",
      metrics: [
        { label: "Total Members",        value: membersAnim             },
        { label: "Avg Experience",       value: `${avgExpAnim} yrs`     },
        { label: "Female Workforce",     value: `${femaleAnim}%`        },
        { label: "Senior Practitioners", value: seniorAnim              },
      ],
    },
    {
      title: "Engagement & Culture",
      icon: "🏆",
      gradient: "linear-gradient(135deg, #6f42c1 0%, #e83e8c 100%)",
      metrics: [
        { label: "Recognitions Awarded", value: recognitionsAnim },
        { label: "Events Organized",     value: eventsAnim       },
      ],
    },
  ];

  // ── RENDER ───────────────────────────────────────────────────────────────────

  return (
    <div className="home-wrapper">

      {/* Welcome Section */}
      <section className='homeBanner d-flex align-items-center'>
        <div className='container'>
          <div className='row alignCenter'>
            <div className="col-12 col-lg-8 textContent">
              <h4 className="subtitle">NatWest Relationship Overview</h4>
              <h3 className="title gradientText">
                <p>Accenture has a strategic partnership with NatWest, a Diamond client, supported by over 1,050 consultants across the bank. Combining expertise in Strategy & Consulting, Technology, Song, and Operations, we help drive innovation and large-scale transformation.</p>
                <p>Together, we have advanced NatWest's digital leadership through GenAI adoption, ChatGPT integration, Cora enhancements with OpenAI technologies, cloud transformation, and data modernization—helping the bank achieve measurable business outcomes at scale.</p>
              </h3>
              <div className='authorBox'>
                <p className='authorName'>Nina S. Raphael</p>
                <span className="authorRole">Accenture Leadership</span>
              </div>
            </div>
            <div className="col-12 col-lg-4 imageWrapper">
              <img className="leadPic" src={leadImg} alt="insurance" />
            </div>
          </div>
        </div>
      </section>

      {/* Org Overview */}
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
                    {[
                      { key: "markets",       label: "NatWest Markets" },
                      { key: "treasury",      label: "Treasury" },
                      { key: "rbsi",          label: "RBSI" },
                      { key: "bas",           label: "BAS" },
                      { key: "architecture",  label: "Architecture & Engineering" },
                      { key: "fincrime",      label: "Economic Crime & Fraud" },
                      { key: "infra-security",label: "Infrastructure & Security" },
                      { key: "fral",          label: "FRAL" },
                    ].map(({ key, label }) => (
                      <div
                        key={key}
                        onClick={() => setActiveService(services.find(s => s.key === key))}
                        style={{ cursor: "pointer" }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = "#f3e5f5"}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = ""}
                      >
                        {label}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="descBox" onClick={() => setActiveService(null)}>
                    <h2 style={{ color: "red" }}>{activeService?.title}</h2>
                    <p style={{ whiteSpace: "pre-line" }}>{activeService?.desc}</p>
                    <button
                      style={{ marginTop: "15px", padding: "6px 12px" }}
                      onClick={(e) => { e.stopPropagation(); setActiveService(null); }}
                    />
                  </div>
                )}
              </div>

              <div className="verticalGroup">
                <div className="serviceItem vertical">
                  <h5>Retail Banking</h5>
                  <p>Accenture helps bank in providing range of banking products and related financial services, including CASA, mortgages, and unsecured lending through credit cards and loans.</p>
                </div>
                <div className="serviceItem vertical">
                  <h5>Wealth</h5>
                  <p>We help bank by improving their internal processes and supporting banks OBDS (One Bank Design System) vision by reengineering new solutions.</p>
                </div>
                <div className="serviceItem vertical">
                  <h5>Commercial and Institutional Banking</h5>
                  <p>Accenture help Bank with their customer experience into various areas like MMM, EDB, MMG by enabling digital ecosystem, process improvement to better serve customers.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Account Overview — headline bar + 4 theme cards */}
      <section className="container" ref={statsRef}>
        <div className="accOverview">
          <h1 className="team-heading">Account Overview</h1>

          {/* 6-stat headline bar */}
          <div className="fs-stats">
            <div className="row">
              <div className="col-2">
                <div className="stat-box">
                  <strong>{membersAnim}+</strong>
                  <p>Members</p>
                </div>
              </div>
              <div className="col-2">
                <div className="stat-box">
                  <strong style={{ fontSize: "44px" }}>{formatGbp(totalGppAnim)}</strong>
                  <p>Cost Saved</p>
                </div>
              </div>
              <div className="col-2">
                <div className="stat-box">
                  <strong>{aiDelivAnim}</strong>
                  <p>AI Deliverables</p>
                </div>
              </div>
              <div className="col-2">
                <div className="stat-box">
                  <strong>{activeProgramsAnim}</strong>
                  <p>Active Programs</p>
                </div>
              </div>
              <div className="col-2">
                <div className="stat-box">
                  <strong>{locationsAnim}</strong>
                  <p>Locations</p>
                </div>
              </div>
              <div className="col-2">
                <div className="stat-box" style={{ border: "none" }}>
                  <strong>{femaleAnim}%</strong>
                  <p>Female Workforce</p>
                </div>
              </div>
            </div>
          </div>

          {/* 4 theme detail cards */}
          <div className="theme-grid">
            {THEME_CARDS.map(card => (
              <div className="theme-card" key={card.title}>
                <div className="theme-card-header" style={{ background: card.gradient }}>
                  <span className="theme-icon">{card.icon}</span>
                  {card.title}
                </div>
                <div className="theme-metrics">
                  {card.metrics.map(m => (
                    <div className="theme-metric" key={m.label}>
                      <span>{m.label}</span>
                      <strong>{m.value}</strong>
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
