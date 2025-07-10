import React, { useEffect } from 'react';

function Home({ sidebarOpen, setSidebarOpen }) {
  const handleBackdropClick = () => setSidebarOpen(false);
  const handleLinkClick = () => setSidebarOpen(false);

  // Scroll lock when sidebar is open
  useEffect(() => {
    if (sidebarOpen) {
      document.body.classList.add('overflow-hidden');
    } else {
      document.body.classList.remove('overflow-hidden');
    }
    return () => document.body.classList.remove('overflow-hidden');
  }, [sidebarOpen]);

  return (
    <div className="relative min-h-screen bg-white text-gray-900 dark:bg-gray-950 dark:text-white transition-colors">
      
      {/* Backdrop */}
      {sidebarOpen && (
        <div
          onClick={handleBackdropClick}
          className="fixed inset-0 bg-black bg-opacity-50 z-10"
        />
      )}

      {/* Sidebar */}
      {sidebarOpen && (
        <aside className="fixed top-20 left-0 h-[calc(100vh-5rem)] w-72 bg-white dark:bg-gray-900 border-r border-gray-300 dark:border-gray-700 p-6 z-20 transition-transform">
          <h2 className="mb-4 text-xl font-bold text-gray-900 dark:text-gray-100">Contents</h2>
          <ul className="space-y-3 text-gray-900 dark:text-gray-100">
            <li>
              <a onClick={handleLinkClick} href="#intro" className="hover:text-cyan-500 transition">Introduction</a>
            </li>
            <li>
              <a onClick={handleLinkClick} href="https://rerolab.com/" target="_blank" rel="noopener noreferrer" className="hover:text-cyan-500 transition">
                Remote Robotics Laboratory
              </a>
            </li>
            <li>
              <a onClick={handleLinkClick} href="https://github.com/IEEERASPESU" target="_blank" rel="noopener noreferrer" className="hover:text-cyan-500 transition">
                GitHub IEEE Robotics & Society PES University
              </a>
            </li>
            <li>
              <a onClick={handleLinkClick} href="#benefits" className="hover:text-cyan-500 transition">Benefits</a>
            </li>
            <li>
              <a onClick={handleLinkClick} href="#inauguration" className="hover:text-cyan-500 transition">Inauguration</a>
            </li>
          </ul>
        </aside>
      )}

      {/* Main Content */}
      <main className={`transition-all ${sidebarOpen ? 'ml-72' : 'ml-0'} pt-20 px-8`}>
        <h1 className="text-4xl font-extrabold text-center text-cyan-400 mb-2">Remote Robotics (ReRo) Lab</h1>
        <h2 className="text-lg text-center text-gray-600 dark:text-gray-300 mb-10">
          India's First 24/7 Virtual Robotics Lab by an Educational Institution
        </h2>

        <h1 id="intro" className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">
          <u>Introduction</u>
        </h1>
        <section className="text-lg text-gray-900 dark:text-gray-100 space-y-3 leading-relaxed">
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
