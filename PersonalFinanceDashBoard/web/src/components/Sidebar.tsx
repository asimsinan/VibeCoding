import React from 'react';
import { NavLink } from 'react-router-dom';

const Sidebar: React.FC = () => {
  return (
    <aside className="w-64 bg-gray-800 text-white p-4">
      <nav>
        <ul>
          <li className="mb-2">
            <NavLink
              to="/dashboard"
              className={({ isActive }) =>
                isActive ? 'block p-2 rounded bg-blue-700' : 'block p-2 rounded hover:bg-gray-700'
              }
            >
              Dashboard
            </NavLink>
          </li>
          <li className="mb-2">
            <NavLink
              to="/transactions"
              className={({ isActive }) =>
                isActive ? 'block p-2 rounded bg-blue-700' : 'block p-2 rounded hover:bg-gray-700'
              }
            >
              Transactions
            </NavLink>
          </li>
          <li className="mb-2">
            <NavLink
              to="/categories"
              className={({ isActive }) =>
                isActive ? 'block p-2 rounded bg-blue-700' : 'block p-2 rounded hover:bg-gray-700'
              }
            >
              Categories
            </NavLink>
          </li>
          {/* Add more navigation links here */}
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;
