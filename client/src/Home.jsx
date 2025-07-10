import React from 'react';

function Home() {
  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-gray-950 text-gray-900 dark:text-white transition-colors">
      <aside className="w-72 bg-black dark:bg-gray-900 border-r border-gray-800 dark:border-gray-700 p-6">
        <h2 className="mb-4 text-xl font-bold text-cyan-400">Contents</h2>
        <ul className="space-y-3">
          <li>
            <a href="#intro" className="text-cyan-200 hover:text-cyan-400 transition">Introduction</a>
          </li>
          <li>
            <a href="https://rerolab.com/" className="text-cyan-200 hover:text-cyan-400 transition" target="_blank" rel="noopener noreferrer">
              Remote Robotics Laboratory
            </a>
          </li>
          <li>
            <a href="https://github.com/IEEERASPESU" className="text-cyan-200 hover:text-cyan-400 transition" target="_blank" rel="noopener noreferrer">
              GitHub IEEE Robotics & Society PES University
            </a>
          </li>
          <li>
            <a href="#benefits" className="text-cyan-200 hover:text-cyan-400 transition">Benefits</a>
          </li>
          <li>
            <a href="#inauguration" className="text-cyan-200 hover:text-cyan-400 transition">Inauguration</a>
          </li>
        </ul>
      </aside>

      <main className="flex-1 py-12 px-8">
        <h1 className="text-4xl font-extrabold text-center text-cyan-400 mb-2">Remote Robotics (ReRo) Lab</h1>
        <h2 className="text-lg text-center text-gray-400 dark:text-gray-300 mb-10">
          India's First 24/7 Virtual Robotics Lab by an Educational Institution
        </h2>

        <h1 id="intro" className="text-2xl font-bold mb-4 text-white dark:text-white">Introduction</h1>
        <section className="text-lg text-cyan-200/80 dark:text-cyan-200 space-y-3 leading-relaxed">
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
        </section>
      </main>
    </div>
  );
}

export default Home;