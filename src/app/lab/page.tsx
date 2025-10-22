"use client";
import Link from "next/link";
import type React from "react";
import { useEffect, useState } from "react";
import {
  FaClipboardList,
  FaFileAlt,
  FaFlask,
  FaListAlt,
  FaVial,
} from "react-icons/fa";
import LoadingSpinner from "@/components/LoadingSpinner";
import LogoutButton from "@/components/LogoutButton";
import SidebarMenu from "@/components/SidebarMenu";

const LabDashboard: React.FC = () => {
  const [stats, setStats] = useState<any>({
    labTypes: 0,
    labTests: 0,
    labRequests: 0,
    labResults: 0,
    pendingRequests: 0,
    completedRequests: 0,
  });
  const [loading, setLoading] = useState(true);
  const [recentRequests, setRecentRequests] = useState<any[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch all lab data
      const [typesRes, testsRes, requestsRes, resultsRes] = await Promise.all([
        fetch("/api/labtypes"),
        fetch("/api/labtests"),
        fetch("/api/labrequests"),
        fetch("/api/labresults"),
      ]);

      const types = await typesRes.json().catch(() => []);
      const tests = await testsRes.json().catch(() => []);
      const requests = await requestsRes.json().catch(() => []);
      const results = await resultsRes.json().catch(() => []);

      const requestsList = Array.isArray(requests) ? requests : [];
      const pending = requestsList.filter(
        (r: any) => r.status?.toLowerCase() === "pending",
      ).length;
      const completed = requestsList.filter(
        (r: any) => r.status?.toLowerCase() === "completed",
      ).length;

      setStats({
        labTypes: Array.isArray(types) ? types.length : 0,
        labTests: Array.isArray(tests) ? tests.length : 0,
        labRequests: requestsList.length,
        labResults: Array.isArray(results) ? results.length : 0,
        pendingRequests: pending,
        completedRequests: completed,
      });

      // Get recent 5 requests
      setRecentRequests(requestsList.slice(0, 5));
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const cards = [
    {
      title: "Lab Types",
      value: stats.labTypes,
      icon: <FaListAlt className="text-4xl" />,
      color: "bg-blue-500",
      link: "/lab/types",
    },
    {
      title: "Lab Tests",
      value: stats.labTests,
      icon: <FaFlask className="text-4xl" />,
      color: "bg-green-500",
      link: "/lab/tests",
    },
    {
      title: "Lab Requests",
      value: stats.labRequests,
      icon: <FaClipboardList className="text-4xl" />,
      color: "bg-yellow-500",
      link: "/lab/requests",
    },
    {
      title: "Lab Results",
      value: stats.labResults,
      icon: <FaFileAlt className="text-4xl" />,
      color: "bg-purple-500",
      link: "/lab/results",
    },
    {
      title: "Pending Requests",
      value: stats.pendingRequests,
      icon: <FaVial className="text-4xl" />,
      color: "bg-orange-500",
      link: "/lab/requests",
    },
    {
      title: "Completed Requests",
      value: stats.completedRequests,
      icon: <FaVial className="text-4xl" />,
      color: "bg-teal-500",
      link: "/lab/requests",
    },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50">
      <SidebarMenu />
      <main className="flex-1 p-8">
        <LogoutButton />
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Laboratory Management System
          </h1>
          <p className="text-gray-600">
            Manage lab types, tests, requests, and results
          </p>
        </div>

        {loading && <LoadingSpinner />}

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {cards.map((card, idx) => (
            <Link key={idx} href={card.link}>
              <div
                className={`${card.color} text-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm opacity-90">{card.title}</p>
                    <p className="text-3xl font-bold mt-2">{card.value}</p>
                  </div>
                  <div className="opacity-80">{card.icon}</div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Quick Access */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">
            Quick Access
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              href="/lab/types"
              className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <FaListAlt className="text-blue-600 text-2xl" />
              <div>
                <p className="font-semibold text-gray-800">Lab Types</p>
                <p className="text-sm text-gray-600">Manage lab categories</p>
              </div>
            </Link>
            <Link
              href="/lab/tests"
              className="flex items-center gap-3 p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
            >
              <FaFlask className="text-green-600 text-2xl" />
              <div>
                <p className="font-semibold text-gray-800">Lab Tests</p>
                <p className="text-sm text-gray-600">
                  Configure available tests
                </p>
              </div>
            </Link>
            <Link
              href="/lab/requests"
              className="flex items-center gap-3 p-4 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition-colors"
            >
              <FaClipboardList className="text-yellow-600 text-2xl" />
              <div>
                <p className="font-semibold text-gray-800">Lab Requests</p>
                <p className="text-sm text-gray-600">
                  View and create requests
                </p>
              </div>
            </Link>
            <Link
              href="/lab/results"
              className="flex items-center gap-3 p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
            >
              <FaFileAlt className="text-purple-600 text-2xl" />
              <div>
                <p className="font-semibold text-gray-800">Lab Results</p>
                <p className="text-sm text-gray-600">Enter and view results</p>
              </div>
            </Link>
          </div>
        </div>

        {/* Recent Lab Requests */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">
            Recent Lab Requests
          </h2>
          {recentRequests.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No recent lab requests
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full table-auto">
                <thead>
                  <tr className="bg-gray-100 text-left">
                    <th className="p-3 border">Request Date</th>
                    <th className="p-3 border">Patient</th>
                    <th className="p-3 border">Test</th>
                    <th className="p-3 border">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentRequests.map((request: any) => (
                    <tr key={request.id} className="border-t hover:bg-gray-50">
                      <td className="p-3 border">
                        {new Date(request.requestDate).toLocaleString()}
                      </td>
                      <td className="p-3 border">
                        {request.patient
                          ? `${request.patient.firstName} ${request.patient.lastName}`
                          : request.patientId}
                      </td>
                      <td className="p-3 border">
                        {request.test ? request.test.testName : request.testId}
                      </td>
                      <td className="p-3 border">
                        <span
                          className={`px-2 py-1 rounded text-xs font-semibold ${
                            request.status?.toLowerCase() === "pending"
                              ? "bg-yellow-100 text-yellow-800"
                              : request.status?.toLowerCase() === "completed"
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {request.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="mt-4 text-center">
            <Link
              href="/lab/requests"
              className="text-blue-600 hover:text-blue-800 font-semibold"
            >
              View All Requests →
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
};

export default LabDashboard;
