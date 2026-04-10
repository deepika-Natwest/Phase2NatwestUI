// src/pages/Home.jsx
import React, { useState } from 'react';
import accountData from '../assets/data/accountData';
import leadImg from '../assets/img/lead.png';
import accIocn1 from '../assets/img/accIcon1.png';
import accIocn2 from '../assets/img/accIcon3.png';
import accIocn3 from '../assets/img/accIcon2.png';
import aboutImg from '../assets/img/aboutImg.png';
import "../assets/styles/home.css";

const Home = () => {
  const [data] = useState(accountData);

  const allMembers = data.flatMap(section => section.members);
  const totalMembers = allMembers.length;
  /*const genderCount = {
    male: allMembers.filter(m => m.gender?.toLowerCase() === 'male').length,
    female: allMembers.filter(m => m.gender?.toLowerCase() === 'female').length,
  };*/
  const experienceValues = allMembers.map(m => m.experience).filter(Boolean);
  const experienceRange = experienceValues.length
    ? [Math.min(...experienceValues), Math.max(...experienceValues)]
    : [0, 0];
  const countries = [...new Set(allMembers.map(m => m.country).filter(Boolean))];

return (
     <div className="home-wrapper">
      {/* Welcome Section */}
      <section className='homeBanner d-flex align-items-center'>
            <div className='container'>
              <div className='row alignCenter'>
                  <div className='col-8  textContent'>
                    <h4 className="subtitle">Welcome to NatWest</h4>
                    <h3 className="title gradientText">  NatWest, or National Westminster Bank, is one of the largest banks in the United Kingdom and is part of the NatWest Group, which also includes other financial institutions like Ulster Bank and Coutts. Established in 1968 through the merger of National Provincial Bank and Westminster Bank, NatWest has a long history of serving individuals, businesses, and corporations with a wide range of financial services.</h3>
                    <div className='authorBox'>
                      <p className='authorName'>Nina S. Raphael</p>
                        <span className="authorRole">Accenture Leadership </span> 
                        </div>
                  </div>
                  <div className='col-4  imageWrapper'>  <img class="leadPic" src={leadImg} alt="insurance" /></div>
              </div>
            </div>
      </section>
      <section className='serviceBox'>
        <div className='container'>
          <div className='row'>
            <div className='col-5'>
              <h2>Financial Services <span className='purpleText'>@ EMEA ATCi</span></h2>
              <div className='aboutImg'>
                    <img class="aboutPic" src={aboutImg} alt="About Netwest" />
              </div>
              
            </div>
            <div className='col-7'>
              <div className='row'>
                <div className='col-6'>
                   <div className='serviceItem'>
                  <div className='serContent'>
                    <h4>Retail Banking</h4>
                    <p>NatWest provides personal banking services, including savings accounts, current accounts, credit cards, loans, and mortgages.</p>
                  </div>
              </div>
                </div>
                <div className='col-6'>
                  
              <div className='serviceItem'>
                  <div className='serContent'>
                    <h4>Business  Banking</h4>
                    <p>Provides tailored financial solutions for small, medium, and large businesses, including loans, merchant services, and cash management.</p>
                  </div>
              </div>
                </div>
                <div className='col-6'>
                          <div className='serviceItem'>
                  <div className='serContent'>
                    <h4>Digital   Banking</h4>
                    <p>NatWest is known for advanced digital banking, including mobile & online banking, enabling customers to manage finances conveniently.</p>
                  </div>
              </div>
                </div>
                 <div className='col-6'>
                  <div className='serviceItem'>
                  <div className='serContent'>
                    <h4>Sustainability Initiatives</h4>
                    <p> The bank has committed to supporting sustainable finance and helping customers transition to a low-carbon economy.</p>
                  </div>
              </div>
                 </div>
                  <div className='col-12'>
                    <div className='serviceItem'>
                  <div className='serContent'>
                    <h4>Customer Support</h4>
                    <p>NatWest emphasizes customer service, offering support through branches, online channels, and call centers.</p>
                  </div>
              </div>
                  </div>
              </div>
             
            </div>
            </div>
        </div>
      </section>
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
      {/* Analytics as flowchart */}
      <div className="row">
        <div className='col-4'>
            <div className='accBox'>
                <div className='accIcon'> <img src={accIocn1} alt="accIocn" /></div>
                <div className='accHeading'>Total Members</div>
                <div className='accDes'>Every pleasure is to be welcomed and every pain avoided.</div>
                <div className='accStats'>{totalMembers}</div>
            </div>
        </div>
        <div className='col-4'>
            <div className='accBox'>
                <div className='accIcon'> <img src={accIocn2} alt="accIocn" /></div>
                <div className='accHeading'>Countries</div>
                <div className='accDes'>Every pleasure is to be welcomed and every pain avoided.</div>
                <div className='accStats'>{countries.join(', ')}</div>
            </div>
        </div>
        <div className='col-4'>
            <div className='accBox'>
                <div className='accIcon'> <img src={accIocn3} alt="accIocn" /></div>
                <div className='accHeading'>Experience</div>
                <div className='accDes'>Every pleasure is to be welcomed and every pain avoided.</div>
                <div className='accStats'>{experienceRange[0]} - {experienceRange[1]} yrs</div>
            </div>
        </div>
        {/*<div className='col-4'>Male: {genderCount.male} | Female: {genderCount.female}</div>*/}
   
      </div>
      </div>
        </section>  
       <section className=' container'>
        {/* Stats Row */}
        <div className="fs-stats">
          <div className='row'>
             <div className='col-4'>
               <div className="stat-box">
              <strong>102+</strong>
              <p>Clients</p>
            </div>
             </div >
            <div className='col-4'>
              <div className="stat-box">
              <strong>15,200+</strong>
              <p>Practitioners</p>
            </div>
            </div>
            <div className='col-4'>
              <div className="stat-box" style={{ border: "none" }}>
              <strong>~3950</strong>
              <p  style={{ padding: "0 0 0 3rem" }}>GCCs</p>
            </div>
            </div>

          </div>

        </div>
      </section>

      {/* Image Row 
      <section className="fs-images">
        <img src={coinImg} alt="coin" />
        <img src={graphImg} alt="graph" />
        <img src={insuranceImg} alt="insurance" />
      </section>*/}
    </div>
  );
}

export default Home;
