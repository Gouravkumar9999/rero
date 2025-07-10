import React from 'react';

const Footer = () => {
  return (
    <footer className="w-full mt-auto bg-white dark:bg-gray-950 border-t border-gray-300 dark:border-gray-700 text-center text-sm py-4 text-gray-600 dark:text-gray-400">
      <p>© {new Date().getFullYear()} IEEE Robotics & Automation Society - PES University. All rights reserved.</p>
    </footer>
  );
};

export default Footer;
