import React, { useState } from 'react';
import { Plus, Trash2, Edit2, Users } from 'lucide-react';

export default function GroupsView() {
  const [groups, setGroups] = useState([
    { id: 1, name: 'Nhóm ăn uống', members: ['Tường', 'Hương', 'Minh'], color: 'bg-blue-100 dark:bg-blue-900' },
    { id: 2, name: 'Ký túc xá', members: ['Tường', 'Khoa', 'Dung'], color: 'bg-green-100 dark:bg-green-900' },
  ]);

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">👥 Nhóm/Bạn bè</h1>
          <button className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition">
            <Plus size={20} />
            Tạo nhóm mới
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {groups.map((group) => (
            <div key={group.id} className={`${group.color} rounded-lg p-4 border border-gray-200 dark:border-gray-600`}>
              <h3 className="font-bold text-gray-800 dark:text-white mb-2">{group.name}</h3>
              <div className="space-y-2">
                {group.members.map((member, idx) => (
                  <div key={idx} className="text-sm text-gray-700 dark:text-gray-300">
                    • {member}
                  </div>
                ))}
              </div>
              <div className="flex gap-2 mt-4">
                <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-300 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-400 dark:hover:bg-gray-600 text-sm transition">
                  <Edit2 size={16} />
                  Sửa
                </button>
                <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-300 dark:bg-red-700 text-red-700 dark:text-red-300 rounded hover:bg-red-400 dark:hover:bg-red-600 text-sm transition">
                  <Trash2 size={16} />
                  Xóa
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 text-center py-12">
        <p className="text-gray-500 dark:text-gray-400 text-lg">
          💡 Tính năng này cho phép bạn tạo và quản lý các nhóm bạn bè thường xuyên chia tiền
        </p>
        <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">
          Bạn có thể nhanh chóng chọn nhóm khi chia hóa đơn
        </p>
      </div>
    </div>
  );
}
