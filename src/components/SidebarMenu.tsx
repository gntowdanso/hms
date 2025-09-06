"use client";
import React, { useState } from 'react';
import { FaUser, FaUsers, FaChalkboardTeacher, FaBook, FaCog, FaLayerGroup, FaTools, FaChevronDown, FaChevronRight, FaPills, FaWarehouse, FaDollarSign, FaCashRegister } from 'react-icons/fa';
//import { FaC } from 'react-icons/fa6';

interface MenuItem {
  label: string;
  icon: React.ReactNode;
  group: string;
  href?: string;
}

const menuItems: MenuItem[] = [
  { label: 'Dashboard', icon: <FaLayerGroup />, group: 'Management', href: '/management/dashboard' },
  { label: 'Hospital', icon: <FaLayerGroup />, group: 'Management', href: '/management/hospital' },
  
  { label: 'Departments', icon: <FaUsers />, group: 'Management', href: '/management/departments' },

  { label: 'Wards', icon: <FaUsers />, group: 'Management', href: '/management/ward' },
  { label: 'Rooms', icon: <FaBook />, group: 'Management', href: '/management/room' },
  
  { label: 'Staff', icon: <FaChalkboardTeacher />, group: 'Management', href: '/management/staff' },
  { label: 'User Account', icon: <FaChalkboardTeacher />, group: 'Management', href: '/management/useraccount' },

  { label: 'Patients', icon: <FaUsers />, group: 'Patient', href: '/patient/patients' },
  { label: 'Admissions', icon: <FaUser />, group: 'Patient', href: '/patient/admissions' },
  { label: 'Diagnoses', icon: <FaUser />, group: 'Patient', href: '/patient/diagnoses' },
  { label: 'Prescriptions', icon: <FaUser />, group: 'Patient', href: '/patient/prescriptions' },
  { label: 'Treatments', icon: <FaUser />, group: 'Patient', href: '/patient/treatments' },
  { label: 'Medical Records', icon: <FaUser />, group: 'Patient', href: '/patient/medicalrecords' },
  { label: 'Appointments', icon: <FaUser />, group: 'Patient', href: '/patient/appointments' },
  { label: 'Doctors', icon: <FaUser />, group: 'Patient', href: '/patient/doctors' },
  { label: 'Nurses', icon: <FaUser />, group: 'Patient', href: '/patient/nurses' },

  { label: 'Lab Types', icon: <FaBook />, group: 'Lab', href: '/lab/types' },
  { label: 'Lab Tests', icon: <FaBook />, group: 'Lab', href: '/lab/tests' },
  { label: 'Lab Requests', icon: <FaBook />, group: 'Lab', href: '/lab/requests' },
  { label: 'Lab Results', icon: <FaBook />, group: 'Lab', href: '/lab/results' },
  { label: 'Result Details', icon: <FaBook />, group: 'Lab', href: '/lab/resultdetails' },

  { label: 'Medicines', icon: <FaPills />, group: 'Pharmacy', href: '/pharmacy/medicines' },
  { label: 'Suppliers', icon: <FaUsers />, group: 'Pharmacy', href: '/pharmacy/suppliers' },
  { label: 'Inventory', icon: <FaWarehouse />, group: 'Pharmacy', href: '/pharmacy/inventory' },
  { label: 'Transactions', icon: <FaPills />, group: 'Pharmacy', href: '/pharmacy/transactions' },

  { label: 'Fees & Charges', icon: <FaCashRegister />, group: 'Finance', href: '/finance/fees' },
  { label: 'Billing', icon: <FaCashRegister />, group: 'Finance', href: '/finance/billing' },
  { label: 'Invoices', icon: <FaCashRegister />, group: 'Finance', href: '/finance/invoices' },
  { label: 'Payments', icon: <FaCashRegister />, group: 'Finance', href: '/finance/payments' },
  { label: 'Insurance', icon: <FaCashRegister />, group: 'Finance', href: '/finance/insurance' },
  { label: 'Expenses', icon: <FaCashRegister />, group: 'Finance', href: '/finance/expenses' },

  { label: 'Settings', icon: <FaCog />, group: 'System', href: '/settings' },
];

const groupIcons: Record<string, React.ReactNode> = {
  Management: <FaLayerGroup className="mr-2" />,
  Patient: <FaUsers className="mr-2" />,
  Lab: <FaBook className="mr-2" />,
  Pharmacy: <FaPills className="mr-2" />,
  Finance: <FaCashRegister className="mr-2" />,
  Users: <FaUser className="mr-2" />,
  System: <FaTools className="mr-2" />,
};

const groupedItems = menuItems.reduce((acc, item) => {
  acc[item.group] = acc[item.group] || [];
  acc[item.group].push(item);
  return acc;
}, {} as Record<string, MenuItem[]>);

const SidebarMenu: React.FC = () => {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({ Management: false });

  const toggleGroup = (group: string) => setCollapsed(prev => ({ ...prev, [group]: !prev[group] }));

  return (
    <aside className="w-64 h-screen bg-gray-800 text-white flex flex-col p-4">
  <h1 className="text-xl font-bold mb-6">Hospital MS</h1>
      {Object.entries(groupedItems).map(([group, items]) => (
        <div key={group} className="mb-6">
          <div className="flex items-center justify-between text-gray-400 uppercase text-xs mb-2 cursor-pointer" onClick={() => toggleGroup(group)}>
            <div className="flex items-center">
              {groupIcons[group]}
              <span>{group}</span>
            </div>
            <div className="mr-2">{collapsed[group] ? <FaChevronRight /> : <FaChevronDown />}</div>
          </div>
          {!collapsed[group] && (
            <ul>
              {items.map(item => {
                const href = item.href || '#';
                return (
                  <li key={item.label} className="flex items-center gap-3 py-2 px-6 rounded hover:bg-gray-700 cursor-pointer" onClick={() => { if (href !== '#') window.location.href = href; }}>
                    {item.icon}
                    <span>{item.label}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      ))}
    </aside>
  );
};

export default SidebarMenu;
