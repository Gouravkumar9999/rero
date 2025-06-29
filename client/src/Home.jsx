import React from 'react';
import './Home.css';

function Home() {
  return (
    <div className="home-container">
      <div className="sidebar">
        <h2>Contents</h2>
        <ul>
          <li><a href="#intro">Introduction</a></li>
          <li><a href="https://github.com/IEEERASPESU">Remote Robotics Laboratory</a></li>
          <li><a href="https://github.com/IEEERASPESU">GitHub IEEE Robotics & Society PES University</a></li>
          <li><a href="#benefits">Benefits</a></li>
          <li><a href="#inauguration">Inauguration</a></li>
        </ul>
      </div>

      <div className="home-main-content">
        <h1 className="main-title">Remote Robotics (ReRo) Lab</h1>
        <h2 className="subtitle">
          India's First 24/7 Virtual Robotics Lab by an Educational Institution
        </h2>

        <h1 id="intro" className="section-title">Introduction</h1>
        <div className="section-content">
          <p>
            The IEEE Robotics and Automation Student Chapter of PES University, in association with cRAIS (Centre for Robotics Automation and Intelligent Systems), has established ReRo Lab, India's first 24/7 remote robotics lab by an educational institution.
          </p>
          <p>
            It offers students and researchers remote access to real robots, allowing users to upload code and perform tests in a safe, controlled environment.
          </p>
          <p>
            The lab is equipped with the latest hardware and software required for remote programming, and a web platform that provides clear visual representation of the robot's movements and actions during the programming process.
          </p>
          <p id="inauguration">
            The lab was inaugurated on 27th March 2023.
          </p>
          <p>
            The lab enables users from anywhere in the world to control the robots and run developed algorithms remotely, without needing to purchase any hardware.
          </p>
          <p>
            The lab offers a chance to experiment with various features and applications on real robots in a simulated environment with obstacles.
          </p>
          <p>
            The lab can be used for task testing and training in academia and research.
          </p>
          <p>
            The lab will be autonomous and available for use globally in the near future.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Home;
