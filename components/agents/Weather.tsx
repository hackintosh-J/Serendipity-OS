

import React from 'react';
import { AgentComponentProps } from '../../types';
import { CloudIcon, SparklesIcon } from '../../assets/icons';

const WeatherAgent: React.FC<AgentComponentProps> = ({ instance, updateState }) => {
    const { location, data, lastUpdated } = instance.state;

    if (!data) {
        return (
             <div className="w-full h-full flex flex-col items-center justify-center text-center text-gray-800 p-4 bg-gradient-to-br from-gray-200 to-gray-300 rounded-lg -m-4">
                <h2 className="text-3xl font-bold">{location}</h2>
                <p className="mt-4 text-gray-600">暂无天气数据</p>
                <div className="mt-8 text-xs text-gray-900/70 p-2 bg-white/30 rounded-full flex items-center">
                    <SparklesIcon className="w-4 h-4 mr-2" />
                    <span>请向AI助手提问以获取数据，例如：“{location}今天天气怎么样？”</span>
                </div>
            </div>
        )
    }
    
    const weatherData = data;

    return (
        <div className="w-full h-full flex flex-col items-center justify-center text-center text-white p-4 bg-gradient-to-br from-blue-400 to-purple-500 rounded-lg -m-4 shadow-lg">
            <h2 className="text-4xl font-bold drop-shadow-md">{location}</h2>
            <div className="my-6">
                <CloudIcon className="w-24 h-24 text-white/90 drop-shadow-lg" />
                <p className="text-7xl font-light tracking-tighter mt-2 drop-shadow-md">{weatherData.temp}°</p>
                <p className="text-2xl font-medium mt-1 drop-shadow-sm">{weatherData.condition}</p>
            </div>
            <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-left backdrop-blur-sm bg-white/10 p-4 rounded-xl">
                <div>
                    <p className="text-sm text-white/80">最高温</p>
                    <p className="font-semibold text-lg">{weatherData.high}°</p>
                </div>
                <div>
                    <p className="text-sm text-white/80">最低温</p>
                    <p className="font-semibold text-lg">{weatherData.low}°</p>
                </div>
                 <div>
                    <p className="text-sm text-white/80">湿度</p>
                    <p className="font-semibold text-lg">{weatherData.humidity}</p>
                </div>
                 <div>
                    <p className="text-sm text-white/80">风力</p>
                    <p className="font-semibold text-lg">{weatherData.wind}</p>
                </div>
            </div>
            {lastUpdated && <p className="text-xs text-white/70 mt-6">上次更新: {new Date(lastUpdated).toLocaleString()}</p>}
        </div>
    );
};

export default WeatherAgent;