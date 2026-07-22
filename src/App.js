import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Resume from './components/Resume';
import {Bash} from './bash';
import './App.css';
import me from './me.JPG';
import Background from './components/Background';
import ProjectsDropdown from './components/ProjectsDropdown';
import Snake from './projects/snake/snake';
import Snake2 from './projects/snake2/snake2';
import Raytrace from './projects/raytracing/raytracing';
import WebGLRaytracing from './projects/webglRaytracing/webglRaytracing';
import TetheredCubes from './projects/tetheredCubes/tetheredCubes';
import ThreadArt from './projects/threadArt/threadArt';
import MoonGenerator2 from './projects/planetGenerator/moonGenerator2';
import CncRouter from './projects/cncRouter/cncRouter';
import EasyGLMain from './projects/easyGL/main';
import ChargeSimulator from './projects/chargeSimulator/chargeSimulator';
// import OldProject from './projects/chargeSimulator/OldProject';

// Import images
import chargeSimulatorImg from './images/chargedParticleSimulatorIMG.png';
import snakeImg from './images/snake.png';
import snake2Img from './images/snake2.png';
import tetheredCubesImg from './images/tetheredCubes.gif';
import raytracingImg from './images/rayTracingIMG.png';
import webglRaytracingImg from './images/webglRaytracingPNG.png';
import threadArtImg from './images/threadArt.gif';
import planetGeneratorImg from './images/planetGenerator.gif';
import cncRouterImg from './images/cncRouter.gif';
import easyGLImg from './images/easyGLDemoGif2.gif';

function App() {
  const projects = [
    {
      name: "Charge Simulator",
      path: "chargeSimulator",
      image: chargeSimulatorImg,
      description: "Interactive electric field and charge simulator with real-time visualization"
    },
    {
      name: "Snake",
      path: "snake",
      image: snakeImg,
      description: "Neural network learns to play Snake using evolutionary algorithms"
    },
    {
      name: "Snake 2",
      path: "snake2",
      image: snake2Img,
      description: "Improved Snake AI with real-time learning and multiple agents"
    },
    {
      name: "Raytracing",
      path: "raytracing",
      image: raytracingImg,
      description: "CPU-based raytracer with reflections and soft shadows"
    },
    {
      name: "WebGL Raytracing",
      path: "webglRaytracing",
      image: webglRaytracingImg,
      description: "GPU-accelerated raytracer using WebGL shaders"
    },
    {
      name: "Tethered Cubes",
      path: "tetheredCubes",
      image: tetheredCubesImg,
      description: "3D physics simulation of interconnected cubes with spring forces"
    },
    {
      name: "Thread Art",
      path: "threadArt",
      image: threadArtImg,
      description: "Algorithm to convert images into thread art patterns"
    },
    {
      name: "Planet Generator",
      path: "planetGenerator",
      image: planetGeneratorImg,
      description: "Procedural planet generation with customizable parameters"
    },
    {
      name: "CNC Router",
      path: "cncRouter",
      image: cncRouterImg,
      description: "Custom CNC router control software with G-code support"
    },
    {
      name: "EasyGL",
      path: "easyGL",
      image: easyGLImg,
      description: "Simplified WebGL wrapper for 3D graphics programming"
    }
  ];

  return (
    <Router>
      <div className="App dark-theme">
        <Routes>
          <Route path="/" element={
            <>
              <Background />
              <main>
                <section id="home" className="hero-section">
                  <div className="hero-content">
                    <div className="profile-image">
                      <img src={me} alt="Profile" />
                    </div>
                    <div className="hero-text">
                      <h1>Zack Gunther</h1>
                      <p className="subtitle">Software Engineer</p>
                      <Bash />
                    </div>
                  </div>
                </section>

                <section id="experience" className="experience-section">
                  <h2>Experience</h2>
                  <div className="experience-grid">
                    <div className="experience-card">
                      <h3>Analog Electronics</h3>
                      <h4>Circuit & PCB Design</h4>
                      <div className="keyword-tags">
                        <span className="keyword-tag">Altium</span>
                        <span className="keyword-tag">KiCad</span>
                        <span className="keyword-tag">OnShape</span>
                        <span className="keyword-tag">PCB Milling</span>
                      </div>
                      <p>Designing and prototyping analog circuits from schematic through PCB fabrication.</p>
                      <ul className="experience-bullets">
                        <li>Schematic capture and PCB layout in Altium and KiCad</li>
                        <li>Built a CNC milling pipeline for rapid at-home PCB prototyping</li>
                      </ul>
                    </div>

                    <div className="experience-card experience-card-featured">
                      <h3>Full Stack Engineering</h3>
                      <h4>Web, Cloud & Application Development</h4>
                      <div className="keyword-tags">
                        <span className="keyword-tag">React</span>
                        <span className="keyword-tag">Next.js</span>
                        <span className="keyword-tag">TypeScript</span>
                        <span className="keyword-tag">Node.js</span>
                        <span className="keyword-tag">Python</span>
                        <span className="keyword-tag">PostgreSQL</span>
                        <span className="keyword-tag">Prisma</span>
                        <span className="keyword-tag">MongoDB</span>
                        <span className="keyword-tag">AWS</span>
                        <span className="keyword-tag">Azure</span>
                        <span className="keyword-tag">Terraform</span>
                        <span className="keyword-tag">Vercel</span>
                      </div>
                      <p>Building scalable full-stack platforms across startups and industry — from browser-based CAD tools to test automation systems.</p>
                      <ul className="experience-bullets">
                        <li>Core product engineering for a browser-based electrical CAD app</li>
                        <li>Built AI-assisted workflows, real-time collaboration, auth, and high-performance graph rendering</li>
                        <li>Owned cloud deployment lifecycle (AWS, Azure, Terraform, Vercel) including on-prem platforms for SOC2 & FedRAMP</li>
                        <li>Developed full-stack automation platforms and data visualization tools</li>
                        <li>Built a social media platform for my friends to share photos, message, call, etc.</li>
                      </ul>
                    </div>

                    <div className="experience-card">
                      <h3>Embedded Systems</h3>
                      <h4>Hardware & Software Integration</h4>
                      <div className="keyword-tags">
                        <span className="keyword-tag">C</span>
                        <span className="keyword-tag">C++</span>
                        <span className="keyword-tag">Rust</span>
                        <span className="keyword-tag">CubeIDE</span>
                      </div>
                      <p>Firmware and large-scale simulation for embedded and vehicle systems.</p>
                      <ul className="experience-bullets">
                        <li>Developing firmware and software for microcontrollers and embedded systems.</li>
                        <li>Experience with real-time operating systems and low-level programming.</li>
                      </ul>
                    </div>
                  </div>
                </section>

                <section id="projects" className="projects-section">
                  <h2>Projects</h2>
                  <i>Mostly Built Pre-AI</i>
                  <div className="project-grid-container">
                    <div className="project-grid">
                      {projects.map((project, index) => (
                        <Link 
                          to={project.path} 
                          key={index}
                          className="project-card"
                        >
                          <div className="project-image">
                            <img src={project.image} alt={project.name} />
                            <div className="project-overlay">
                              <h3>{project.name}</h3>
                              <p>{project.description}</p>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                </section>

                <section id="contact" className="contact-section">
                  <h2>Contact Me</h2>
                  <p>Get in touch: 19zgunther@email.com</p>
                </section>
              </main>
            </>
          } />
          <Route path="/chargeSimulator" element={<ChargeSimulator />} />
          <Route path="/resume" element={<Resume />} />
          <Route path="/snake" element={<Snake />} />
          <Route path="/snake2" element={<Snake2 />} />
          <Route path="/raytracing" element={<Raytrace />} />
          <Route path="/webglRaytracing" element={<WebGLRaytracing />} />
          <Route path="/tetheredCubes" element={<TetheredCubes />} />
          <Route path="/threadArt" element={<ThreadArt />} />
          <Route path="/planetGenerator" element={<MoonGenerator2 />} />
          <Route path="/cncRouter" element={<CncRouter />} />
          <Route path="/easyGL" element={<EasyGLMain />} />
        </Routes>

        <nav className="navbar">
          <div className="nav-brand">
            <Link to="/">zgunther</Link>
          </div>
          <ul className="nav-links">
            <li><Link to="/resume">Resume</Link></li>
            <li><ProjectsDropdown projects={projects} /></li>
          </ul>
        </nav>
      </div>
    </Router>
  );
}

export default App;
