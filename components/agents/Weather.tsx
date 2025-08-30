

import React from 'react';
import { AgentComponentProps } from '../../types';
import { CloudIcon, SparklesIcon } from '../../assets/icons';

const WeatherAgent: React.FC<AgentComponentProps> = ({ instance, updateState }) => {
    const { location, data, lastUpdated } = instance.state;

    // Mock data structure, to be filled by AI
    const mockData = {
        temp: 24,
        condition: "晴",
        high: 28,
        low: 18,
        humidity: "60%",
        wind: "东北风 3级"
    };
    
    const weatherData = data || mockData; // Use mock data if real data is not available

    return (
        <div className="w-full h-full flex flex-col items-center justify-center text-center text-gray-800 p-4 bg-gradient-to-br from-blue-200 to-cyan-200 rounded-lg -m-4">
            <h2 className="text-4xl font-bold">{location}</h2>
            <div className="my-6">
                <CloudIcon className="w-24 h-24 text-white" />
                <p className="text-7xl font-light tracking-tighter mt-2">{weatherData.temp}°</p>
                <p className="text-2xl font-medium mt-1">{weatherData.condition}</p>
            </div>
            <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-left">
                <div>
                    <p className="text-sm text-gray-600">最高温</p>
                    <p className="font-semibold text-lg">{weatherData.high}°</p>
                </div>
                <div>
                    <p className="text-sm text-gray-600">最低温</p>
                    <p className="font-semibold text-lg">{weatherData.low}°</p>
                </div>
                 <div>
                    <p className="text-sm text-gray-600">湿度</p>
                    <p className="font-semibold text-lg">{weatherData.humidity}</p>
                </div>
                 <div>
                    <p className="text-sm text-gray-600">风力</p>
                    <p className="font-semibold text-lg">{weatherData.wind}</p>
                </div>
            </div>
            <div className="mt-8 text-xs text-blue-900/70 p-2 bg-white/30 rounded-full flex items-center">
                <SparklesIcon className="w-4 h-4 mr-2" />
                <span>数据由AI提供。请向AI助手提问以更新，例如：“北京今天天气怎么样？”</span>
            </div>
            {lastUpdated && <p className="text-xs text-gray-600 mt-4">上次更新: {new Date(lastUpdated).toLocaleString()}</p>}
        </div>
    );
};

export default WeatherAgent;