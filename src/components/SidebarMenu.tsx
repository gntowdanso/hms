"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
  /*
  { label: 'Departments', icon: <FaUsers />, group: 'Management', href: '/management/departments' },

  { label: 'Wards', icon: <FaUsers />, group: 'Management', href: '/management/ward' },
  { label: 'Rooms', icon: <FaBook />, group: 'Management', href: '/management/room' },
  
  { label: 'Staff', icon: <FaChalkboardTeacher />, group: 'Management', href: '/management/staff' },
*/
  { label: 'User Account', icon: <FaChalkboardTeacher />, group: 'Management', href: '/management/useraccount' },
{ label: 'Category', icon: <FaBook />, group: 'HomeClinic', href: '/homeclinic/categories' },
 
{ label: 'Sample Types', icon: <FaBook />, group: 'HomeClinic', href: '/homeclinic/sampletypes' },

{ label: 'Services Fees', icon: <FaBook />, group: 'HomeClinic', href: '/homeclinic/services' },
  { label: 'Service Packages Fees', icon: <FaBook />, group: 'HomeClinic', href: '/homeclinic/packages' },
  { label: 'Patient Service Order', icon: <FaBook />, group: 'HomeClinic', href: '/homeclinic/serviceorders' },
   { label: 'Payment', icon: <FaBook />, group: 'HomeClinic', href: '/homeclinic/serviceorderpayments' },


  { label: 'Patient  Report', icon: <FaBook />, group: 'HomeClinic', href: '/homeclinic/servicereports' },
  
  /*
{ label: 'Fees & Charges', icon: <FaCashRegister />, group: 'HomeClinic', href: '/finance/fees' },
  { label: 'Billing', icon: <FaCashRegister />, group: 'HomeClinic', href: '/finance/billing' },
  { label: 'Invoices', icon: <FaCashRegister />, group: 'HomeClinic', href: '/finance/invoices' },
  { label: 'Payments', icon: <FaCashRegister />, group: 'HomeClinic', href: '/finance/payments' },
  { label: 'Insurance', icon: <FaCashRegister />, group: 'HomeClinic', href: '/finance/insurance' },
  { label: 'Expenses', icon: <FaCashRegister />, group: 'HomeClinic', href: '/finance/expenses' },

  { label: 'Patients', icon: <FaUsers />, group: 'Patient', href: '/patient/patient' },
 { label: 'Admissions', icon: <FaUser />, group: 'Patient', href: '/patient/admissions' },
  { label: 'Diagnoses', icon: <FaUser />, group: 'Patient', href: '/patient/diagnoses' },
  { label: 'Prescriptions', icon: <FaUser />, group: 'Patient', href: '/patient/prescriptions' },
  { label: 'Treatments', icon: <FaUser />, group: 'Patient', href: '/patient/treatments' },
  { label: 'Medical Records', icon: <FaUser />, group: 'Patient', href: '/patient/medicalrecords' },
  { label: 'Appointments', icon: <FaUser />, group: 'Patient', href: '/patient/appointments' },
  { label: 'Doctors', icon: <FaUser />, group: 'Patient', href: '/patient/doctors' },
  { label: 'Nurses', icon: <FaUser />, group: 'Patient', href: '/patient/nurses' },

  
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
*/
  //{ label: 'Settings', icon: <FaCog />, group: 'System', href: '/settings' },
];

const groupIcons: Record<string, React.ReactNode> = {
  Management: <FaLayerGroup className="mr-2" />,
 HomeClinic: <FaBook className="mr-2" />,
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
const allGroups = Object.keys(groupedItems);

const SidebarMenu: React.FC = () => {
  const pathname = usePathname();

  // Determine active group based on current route (longest matching href prefix)
  const activeGroup = React.useMemo(() => {
    let match: { group: string; len: number } | null = null;
    for (const item of menuItems) {
      if (!item.href) continue;
      if (pathname.startsWith(item.href)) {
        const l = item.href.length;
        if (!match || l > match.len) match = { group: item.group, len: l };
      }
    }
    return match?.group;
  }, [pathname]);

  // collapsed[group] === true  => group is collapsed
  // collapsed[group] === false => group is expanded


  const [collapsed, setCollapsed] = useState<Record<string, boolean>>(() => {
    const map: Record<string, boolean> = {};
    allGroups.forEach(g => { map[g] = true; });
    const open = activeGroup || 'Management1';
    if (map[open] !== undefined) map[open] = false;
    return map;
  });

  // Sync open group when route changes (avoid reopening Management incorrectly)
  useEffect(() => {
    if (!activeGroup) return; // no change if unmatched
    setCollapsed(prev => {
      // If active group already open, keep as is
      if (prev[activeGroup] === false) return prev;
      const next: Record<string, boolean> = {};
      allGroups.forEach(g => { next[g] = true; });
      next[activeGroup] = false;
      return next;
    });
  }, [activeGroup]);

  const toggleGroup = (group: string) => {
    setCollapsed(prev => {
      const isCollapsed = prev[group];
      // If currently expanded (isCollapsed === false), just collapse it.
      if (!isCollapsed) {
        return { ...prev, [group]: true };
      }
      // Open this group and collapse the rest.
      const next: Record<string, boolean> = {};
      allGroups.forEach(g => { next[g] = true; });
      next[group] = false;
      return next;
    });
  };

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
          {collapsed[group] === false && (
            <ul>
              {items.map(item => {
                const href = item.href || '#';
                const active = href !== '#' && pathname.startsWith(href);
                const base = 'flex items-center gap-3 py-2 px-6 rounded transition-colors';
                const cls = active ? `${base} bg-gray-700 text-white font-semibold` : `${base} hover:bg-gray-700 text-gray-200`;
                return href === '#'
                  ? (
                    <li key={item.label} className={cls}>
                      {item.icon}
                      <span>{item.label}</span>
                    </li>
                  ) : (
                    <li key={item.label}>
                      <Link href={href} className={cls}>
                        {item.icon}
                        <span>{item.label}</span>
                      </Link>
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
