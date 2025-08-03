import { UserCheck, UserPlus, UserRoundPen, Users } from "lucide-react";
import React from "react";
import { useNavigate } from "react-router-dom";
import {
  dummyConnectionsData as connections ,
  dummyFollowingData as following,
  dummyFollowersData as followers,
  dummyPendingConnectionsData as pending
} from '../assets/assets'

const Connections = () => {
  const navigate = useNavigate();
  const dataArray = [
    { label: "Followers", value: followers, icon: Users },
    { label: "Following", value: following, icon: UserCheck },
    { label: "Pending", value: pending, icon: UserRoundPen },
    { label: "Connections", value: connections, icon: UserPlus },
  ];
  return (
    <div className="min-h-screen bg-slate-50">
      <div className=" max-w-6xl mx-auto p-6">
        {/* Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2 ">
            Connections
          </h1>
          <p className="text-slate-600">
            Manage your metwork and disover new connections
          </p>
        </div>

        {/* Counts */}
        <div className=" mb-8 flex flex-wrap gap-6">
          {dataArray.map((item, index) => (
            <div key={index } className=" flex flex-col items-center justify-center gap-1 border h-20 w-40 border-gray-200 bg-white shadow rounded-md">
              <b>{item.value.length}</b>
              <p className="text-slate-600">{item.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Connections;
