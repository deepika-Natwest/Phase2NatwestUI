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
  const [members, setMembers] = useState([]); // API for members 
  const [activeService, setActiveService] = useState(null);
  const allMembers = members.length ? members : data.flatMap(section => section.members); //dynamic members
  const totalMembers = allMembers.length;
  const [totalGpp, setTotalGpp] = useState(0);

  const experienceValues = allMembers.map(m => m.experience).filter(Boolean);
  const experienceRange = experienceValues.length
    ? [Math.min(...experienceValues), Math.max(...experienceValues)]
    : [0, 0];


 

  const services = [
    {
      key: "markets",
      title: "NatWest Markets",
      desc: `Accenture supports NatWest Markets’ transformation through cloud engineering, real‑time microservices, automation, and analytics modernization. We enable Google Cloud–native data platforms, real‑time transaction services, and Power Platform automation to improve scalability, throughput, and operational efficiency. Our work spans Markets analytics, Primary Capital Markets pre‑trade automation, and Transaction Governance & Execution platforms, including continued migration of the syndicate tech stack to Google Cloud and management of core assets such as the F&RS Portal and Bond Syndicate/Bostik.`
    },
    {
      key: "treasury",
      title: "Treasury",
      desc: `Treasury is the heart of the bank, responsible for managing capital and liquidity to ensure financial stability, resilience, and uninterrupted business operations. In partnership with Accenture, NatWest Treasury’s Secure Funding platform has been transformed through cloud‑native architecture, data modernization, automation, and GenAI‑enabled optimization across AWS (with selective GCP), significantly improving scalability, performance, cost efficiency, and enabling an intelligence‑driven, real‑time Treasury operating model.`
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
      
      Fraud Prevention CoE (Centre of Excellence) is a centralized, specialist team that owns the end‑to‑end strategy, standards, and capabilities for detecting and stopping financial‑crime‑related fraud across products and channels. It acts as the “brain” of the bank’s fraud‑prevention ecosystem.`
    },
    {
      key: "infra-security",
      title: "Infrastructure & Security",
      desc: `We manage the infrastructure across the Bank which covers technologies that help set up and manage various platforms whether on premise or cloud to support numerous applications catering to the Bank’s customers as well as the enterprise as a whole.

Security acts as a central risk‑control layer that combines people, processes, and technology to protect money, data, and trust across both bricks‑and‑mortar and digital channels.`
    },
    {
      key: "fral",
      title: "FRAL",
      desc: `This is a strategic partnership program providing business and technology services across the FRAL (Finance, Risk, Audit, Legal) domain. This covers key strategic programs like Finance Cost Ledger, Basel 3.1, TWD, XDP, FRANK Migration, EFRA as well as technology transformation including moving on‑prem applications to AWS, building Risk and Finance data products, enhancing and developing finance systems like SubLedger and Finance Ledger, migrating Oracle DBs to Cloud at Customer, and transitioning apps from Appian to Microsoft Power Platform.`
    }
  ];


  // ✅ FETCH MEMBERS FROM API
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
  // ✅ ADDED: Scroll detection
  const statsRef = useRef(null);
  const [startCount, setStartCount] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setStartCount(true);
        }
      },
      { threshold: 0.5 }
    );

    if (statsRef.current) {
      observer.observe(statsRef.current);
    }

    return () => observer.disconnect();
  }, []);


  useEffect(() => {
    fetchCostSaving();
  }, []);

  const fetchCostSaving = async () => {
    try {
      const res = await api.get("/deliverables");
      const data = res.data;

      const total = data
        .filter(item => item.category === "Cost Saving")
        .reduce(
          (sum, item) => sum + Number(item.costSavingAmount || 0),
          0
        );

      setTotalGpp(total);
    } catch (err) {
      console.error("Error fetching deliverables:", err);
    }
  };

  // ✅ ADDED: Count animation
  const useCountUp = (end, start) => {
    const [count, setCount] = useState(0);

    useEffect(() => {
      if (!start) return;

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
  };


  // ✅ UPDATED: dynamic values
  const membersCount = useCountUp(totalMembers, startCount);
  const practitionersCount = useCountUp(15200, startCount);
  const gccCount = useCountUp(3950, startCount);

  //FEMALE RATIO 
  const femaleCount = allMembers.filter(
    (m) => m.gender?.toLowerCase() === "female"
  ).length;

  const femalePercentage = totalMembers
    ? Math.round((femaleCount / totalMembers) * 100)
    : 0;
  const femaleRatioAnim = useCountUp(femalePercentage, startCount);

  const countries = [...new Set(allMembers.map(m => m.location).filter(Boolean))];
  const locationsCount = countries.length;
  const locationsCountAnim = useCountUp(locationsCount, startCount);

  return (
    <div className="home-wrapper">
      {/* Welcome Section */}
      <section className='homeBanner d-flex align-items-center'>
        <div className='container'>
          <div className='row alignCenter'>
            <div className="col-12 col-lg-8 textContent">
              <h4 className="subtitle">NatWest Relationship Overview</h4>
              <h3 className="title gradientText">  NatWest, or National Westminster Bank, is one of the largest banks in the United Kingdom and is part of the NatWest Group, which also includes other financial institutions like Ulster Bank and Coutts. Established in 1968 through the merger of National Provincial Bank and Westminster Bank, NatWest has a long history of serving individuals, businesses, and corporations with a wide range of financial services.</h3>
              <div className='authorBox'>
                <p className='authorName'>Nina S. Raphael</p>
                <span className="authorRole">Accenture Leadership </span>
              </div>
            </div>
            <div className="col-12 col-lg-4 imageWrapper">  <img class="leadPic" src={leadImg} alt="insurance" /></div>
          </div>
        </div>
      </section>


      <section className="serviceBox">
        <div className="container">
          <div className="row">

            <div className="col-5">
              <h2>
                NatWest Organizational Overview
              </h2>
              <div className="aboutImg">
                <img className="aboutPic" src={aboutImg} alt="About NatWest" />
              </div>
            </div>

            <div className="col-7">

              <div className="serviceItem horizontal">

                {activeService === null ? (

                  <div className="servicesGrid">

                    <div onClick={() => setActiveService(services.find(s => s.key === "markets"))}>
                      NatWest Markets
                    </div>

                    <div onClick={() => setActiveService(services.find(s => s.key === "treasury"))}>
                      Treasury
                    </div>

                    <div onClick={() => setActiveService(services.find(s => s.key === "rbsi"))}>
                      RBSI
                    </div>

                    <div onClick={() => setActiveService(services.find(s => s.key === "bas"))}>
                      BAS
                    </div>

                    <div onClick={() => setActiveService(services.find(s => s.key === "architecture"))}>
                      Architecture & Engineering
                    </div>

                    <div onClick={() => setActiveService(services.find(s => s.key === "fincrime"))}>
                      Economic Crime & Fraud
                    </div>

                    <div onClick={() => setActiveService(services.find(s => s.key === "infra-security"))}>
                      Infrastructure & Security
                    </div>

                    <div onClick={() => setActiveService(services.find(s => s.key === "fral"))}>
                      FRAL
                    </div>

                  </div>

                ) : (

                  <div
                    className="descBox"
                    onClick={() => setActiveService(null)}
                  >
                    <h2 style={{ color: "red" }}>{activeService?.title}</h2>

                    <p style={{ whiteSpace: "pre-line" }}>
                      {activeService?.desc}
                    </p>

                    <button
                      style={{ marginTop: "15px", padding: "6px 12px" }}
                      onClick={(e) => {
                        e.stopPropagation();  // ✅ VERY IMPORTANT
                        setActiveService(null);
                      }}
                    >

                    </button>
                  </div>

                )}

              </div>



              <div className="verticalGroup">
                <div className="serviceItem vertical">
                  <h5>Retail Banking</h5>
                  <p>
                    Accenture helps bank in providing range of banking products and related financial services, including CASA, mortgages, and unsecured lending through credit cards and loans.
                  </p>
                </div>

                <div className="serviceItem vertical">
                  <h5>Wealth</h5>
                  <p>
                    We help bank by improving their internal processes and supporting banks OBDS (One Bank Design System) vision by reengineering new solutions.
                  </p>
                </div>

                <div className="serviceItem vertical">
                  <h5>Commercial and Institutional Banking</h5>
                  <p>
                    Accenture help Bank with their customer experience into various areas like MMM, EDB, MMG by enabling digital ecosystem, process improvement to better serve customers.
                  </p>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section >


      <section className=' container'>
        <div className='companyStatics'>
          <div className='row'>
            <div className='col-4'></div>
            <div className='col-4'></div>
            <div className='col-4'></div>
          </div>
        </div>
      </section>

      {/* Account Overview */}
      <section className=' container'>
        <div className='accOverview' >
          <h1 className="team-heading">Account Overview</h1>
          <div className="row">
            <div className='col-4'>
              <div className='accBox'>
                <div className='accIcon'> <img src={accIocn1} alt="accIocn" /></div>
                <div className='accHeading'>AI Driver</div>
                <div className='accDes'>10+ AI powered projects Delivered/POC</div>
              </div>
            </div>
            <div className='col-4'>
              <div className='accBox'>
                <div className='accIcon'>
                  <img src={accIocn3} alt="accIocn" />
                </div>
                <div className='accHeading'>{`${totalGpp} GBP`}</div>
                <div className='accDes'>Saved</div>
                <div className='accStats'></div>
              </div>
            </div>
            <div className='col-4'>
              <div className='accBox'>
                <div className='accIcon'> <img src={accIocn2} alt="accIcon" /></div>
                <div className='accHeading'>Experience</div>
                <div className='accDes'>Every pleasure is to be welcomed and every pain avoided.</div>
                <div className='accStats'></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ✅ ONLY CHANGE HERE */}
      <section className=' container' ref={statsRef}>
        <div className="fs-stats">
          <div className='row'>
            <div className='col-4'>
              <div className="stat-box">
                <strong>{membersCount}+</strong>
                <p>Members</p>
              </div>
            </div >
            <div className='col-4'>
              <div className="stat-box">
                <strong>{locationsCountAnim}+</strong>
                <p>Locations</p>
              </div>
            </div>

            <div className='col-4'>
              <div className="stat-box" style={{ border: "none" }}>
                <strong>{femaleRatioAnim}%</strong>
                <p >
                  Female Workforce
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

    </div >
  );
}

export default Home;