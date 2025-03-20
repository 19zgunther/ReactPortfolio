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
import TetheredCubes from './projects/tetheredCubes/tetheredCubes';
import ThreadArt from './projects/threadArt/threadArt';
import MoonGenerator2 from './projects/planetGenerator/moonGenerator2';
import CncRouter from './projects/cncRouter/cncRouter';
import EasyGLMain from './projects/easyGL/main';

function App() {
  const projects = [
    { name: "Charge Simulator", path: "charge-simulator" },
    { name: "Snake", path: "snake" },
    { name: "Snake2", path: "snake2" },
    { name: "Raytracing", path: "raytracing" },
    { name: "Tethered Cubes", path: "tetheredCubes" },
    { name: "Thread Art", path: "threadArt" },
    { name: "Planet Generator", path: "planetGenerator" },
    { name: "CNC Router", path: "cncRouter" },
    { name: "EasyGL", path: "easyGL" },
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
                      <h1>Zach Gunther</h1>
                      <p className="subtitle">Software Engineer</p>
                      <Bash />
                    </div>
                  </div>
                </section>

                <section id="projects" className="projects-section">
                  <h2>My Projects</h2>
                  <div className="project-grid">
                    <div className="project-card">
                      <h3>Project 1</h3>
                      <p>Description of your first project</p>
                    </div>
                    <div className="project-card">
                      <h3>Project 2</h3>
                      <p>Description of your second project</p>
                    </div>
                  </div>
                </section>

                <section id="contact" className="contact-section">
                  <h2>Contact Me</h2>
                  <p>Get in touch: your@email.com</p>
                </section>
              </main>
            </>
          } />
          <Route path="/resume" element={<Resume />} />
          <Route path="/snake" element={<Snake />} />
          <Route path="/snake2" element={<Snake2 />} />
          <Route path="/raytracing" element={<Raytrace />} />
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
