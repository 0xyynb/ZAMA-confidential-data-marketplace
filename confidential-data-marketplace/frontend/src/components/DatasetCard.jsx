import React from 'react';
import { Shield, TrendingUp, Users, Clock } from 'lucide-react';
import { formatEther, formatAddress, formatRelativeTime, formatNumber } from '../utils/format';
import { Link } from 'react-router-dom';

export default function DatasetCard({ dataset }) {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-2xl transition-all fade-in">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            {dataset.name}
          </h3>
          <p className="text-sm text-gray-600 line-clamp-2">
            {dataset.description}
          </p>
        </div>
        <div className="bg-blue-100 p-2 rounded-lg">
          <Shield className="w-6 h-6 text-blue-600" />
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-3 gap-4 mb-4 py-4 border-t border-b">
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900">
            {formatNumber(dataset.dataSize)}
          </p>
          <p className="text-xs text-gray-500">Data Points</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-blue-600">
            {formatNumber(dataset.totalQueries)}
          </p>
          <p className="text-xs text-gray-500">Queries</p>
        </div>
        <div className="text-center">
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1">
              <TrendingUp className="w-4 h-4 text-green-600" />
              <p className="text-2xl font-bold text-green-600">
                {formatEther(dataset.totalRevenue)}
              </p>
            </div>
            <p className="text-xs text-gray-500">Revenue(ETH)</p>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-600">
              {formatAddress(dataset.owner)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-400" />
            <span className="text-xs text-gray-500">
              {formatRelativeTime(dataset.createdAt)}
            </span>
          </div>
        </div>

        <div className="text-right">
          <p className="text-xs text-gray-500">Per Query</p>
          <p className="text-lg font-bold text-blue-600">
            {formatEther(dataset.pricePerQuery)} ETH
          </p>
        </div>
      </div>

      {/* Action Button */}
      <Link
        to={`/dataset/${dataset.id}`}
        className="block w-full text-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
      >
        View Details
      </Link>
    </div>
  );
}
