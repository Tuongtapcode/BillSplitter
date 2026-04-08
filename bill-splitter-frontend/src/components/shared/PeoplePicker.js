import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';

const avatarColors = [
  'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200',
  'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200',
  'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200',
  'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-200',
  'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-200',
  'bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-200',
];

export default function PeoplePicker({
  people,
  onAddPerson,
  onRemovePerson,
  maxPeople = 10,
  showAddButton = true,
}) {
  const [showInput, setShowInput] = useState(false);
  const [newName, setNewName] = useState('');

  const handleAdd = () => {
    if (newName.trim() && people.length < maxPeople) {
      onAddPerson(newName.trim());
      setNewName('');
      setShowInput(false);
    }
  };

  const getAvatarColor = (index) => avatarColors[index % avatarColors.length];

  return (
    <div className="space-y-4">
      {/* Avatar Stack - Grid view for more than 4 people */}
      {people.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 mb-3 tracking-wider">
            👥 Danh sách người ({people.length}/{maxPeople})
          </p>

          {people.length <= 4 ? (
            // Avatar Stack (Stacked) - cho số lượng ít
            <div className="flex items-center gap-2 flex-wrap">
              {people.map((person, idx) => (
                <div
                  key={idx}
                  className="relative group"
                  style={{ marginLeft: idx > 0 ? '-12px' : '0' }}
                >
                  {/* Avatar */}
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm shadow-md hover:shadow-lg transition-all hover:scale-110 cursor-default border-2 border-white dark:border-gray-800 ${getAvatarColor(idx)}`}
                  >
                    {person.charAt(0).toUpperCase()}
                  </div>

                  {/* Tên khi hover */}
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition pointer-events-none z-10">
                    {person}
                  </div>

                  {/* Nút xóa khi hover */}
                  {people.length > 1 && (
                    <button
                      onClick={() => onRemovePerson(idx)}
                      className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition hover:bg-red-600 shadow-md"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            // Grid view - cho số lượng nhiều
            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-3">
              {people.map((person, idx) => (
                <div
                  key={idx}
                  className="relative group"
                >
                  <div
                    className={`w-full aspect-square rounded-lg flex flex-col items-center justify-center font-bold text-xs shadow-md hover:shadow-lg transition-all hover:scale-105 cursor-default border-2 border-transparent hover:border-blue-500 ${getAvatarColor(idx)}`}
                  >
                    <span className="text-lg">{person.charAt(0).toUpperCase()}</span>
                  </div>

                  {/* Tên khi hover */}
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 px-2 py-1 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition pointer-events-none z-10">
                    {person}
                  </div>

                  {/* Nút xóa khi hover */}
                  {people.length > 1 && (
                    <button
                      onClick={() => onRemovePerson(idx)}
                      className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition hover:bg-red-600 shadow-md"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add Person Input */}
      {showInput ? (
        <div className="flex gap-2">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAdd()}
            placeholder="Nhập tên người..."
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-green-500 outline-none"
            autoFocus
          />
          <button
            onClick={handleAdd}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition font-medium"
          >
            Thêm
          </button>
          <button
            onClick={() => {
              setShowInput(false);
              setNewName('');
            }}
            className="px-4 py-2 bg-gray-300 text-gray-700 dark:bg-gray-600 dark:text-gray-200 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition"
          >
            Hủy
          </button>
        </div>
      ) : (
        showAddButton &&
        people.length < maxPeople && (
          <button
            onClick={() => setShowInput(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition font-medium shadow-lg shadow-green-500/30 active:scale-95 transform duration-100"
          >
            <Plus size={20} />
            Thêm người ({people.length}/{maxPeople})
          </button>
        )
      )}

      {/* Max reached message */}
      {people.length >= maxPeople && (
        <p className="text-xs text-orange-600 dark:text-orange-400 text-center italic">
          ⚠️ Đã đạt số lượng người tối đa ({maxPeople})
        </p>
      )}

      {/* Quick Import from Groups (placeholder) */}
      {people.length > 0 && (
        <button className="w-full px-4 py-2 text-sm border border-blue-300 dark:border-blue-700 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition">
          📥 Nhập từ nhóm hay dùng
        </button>
      )}
    </div>
  );
}
