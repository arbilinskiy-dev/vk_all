import React from 'react';
import { ViewersStats, CardAnimationProps } from './types';
import { AnimatedCounter } from './AnimatedCounter';

interface DemographicsCardProps extends CardAnimationProps {
    viewersStats: ViewersStats;
}

/** Секция: прогресс-бар пола */
const GenderSection: React.FC<{ gender: ViewersStats['gender'] }> = ({ gender }) => {
    const totalGender = gender.male + gender.female;
    const malePercent = totalGender > 0 ? (gender.male / totalGender) * 100 : 0;
    const femalePercent = totalGender > 0 ? (gender.female / totalGender) * 100 : 0;
    
    return (
        <div className="flex-1 min-w-[180px]">
            <p className="text-xs text-gray-400 font-bold uppercase mb-3">Пол</p>
            <div className="space-y-2">
                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500 rounded-full transition-all duration-700" style={{ width: `${malePercent}%` }}></div>
                        </div>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0"></span>Муж</span>
                        <span className="font-medium text-gray-900 tabular-nums">{gender.male} — {malePercent.toFixed(0)}%</span>
                    </div>
                </div>
                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-pink-500 rounded-full transition-all duration-700" style={{ width: `${femalePercent}%` }}></div>
                        </div>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-pink-500 shrink-0"></span>Жен</span>
                        <span className="font-medium text-gray-900 tabular-nums">{gender.female} — {femalePercent.toFixed(0)}%</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

/** Секция: подписка (подписчики / виральные) */
const MembershipSection: React.FC<{ membership: ViewersStats['membership'] }> = ({ membership }) => {
    const totalMembership = membership.members + membership.viral;
    const membersPercent = totalMembership > 0 ? (membership.members / totalMembership) * 100 : 0;
    const viralPercent = totalMembership > 0 ? (membership.viral / totalMembership) * 100 : 0;

    return (
        <div className="flex-1 min-w-[180px]">
            <p className="text-xs text-gray-400 font-bold uppercase mb-3">Подписка</p>
            <div className="space-y-2">
                {totalMembership > 0 ? (
                    <>
                        <div className="space-y-1">
                            <div className="flex items-center gap-3">
                                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-emerald-500 rounded-full transition-all duration-700" style={{ width: `${membersPercent}%` }}></div>
                                </div>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600 flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>Подписчики</span>
                                <span className="font-medium text-gray-900 tabular-nums">{membership.members} — {membersPercent.toFixed(0)}%</span>
                            </div>
                        </div>
                        <div className="space-y-1">
                            <div className="flex items-center gap-3">
                                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-orange-400 rounded-full transition-all duration-700" style={{ width: `${viralPercent}%` }}></div>
                                </div>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600 flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-orange-400 shrink-0"></span>Виральные</span>
                                <span className="font-medium text-gray-900 tabular-nums">{membership.viral} — {viralPercent.toFixed(0)}%</span>
                            </div>
                        </div>
                    </>
                ) : (
                    <p className="text-xs text-gray-400">Нет данных о подписке</p>
                )}
            </div>
        </div>
    );
};

/** Секция: возрастные группы */
const AgeSection: React.FC<{ ageGroups: ViewersStats['ageGroups'] }> = ({ ageGroups }) => {
    const totalAge = (Object.values(ageGroups) as number[]).reduce((a, b) => a + b, 0);
    const orderedGroups: Array<keyof typeof ageGroups> = ['13-17', '18-24', '25-34', '35-44', '45+'];

    return (
        <div className="flex-1 min-w-[200px]">
            <p className="text-xs text-gray-400 font-bold uppercase mb-3">Возраст</p>
            <div className="space-y-1.5">
                {orderedGroups
                    .filter(group => ageGroups[group] > 0)
                    .map(group => {
                        const count = ageGroups[group];
                        const percent = totalAge > 0 ? (count / totalAge) * 100 : 0;
                        return (
                            <div key={group} className="flex items-center gap-2 text-sm">
                                <span className="text-gray-500 w-12">{group}</span>
                                <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-purple-400 rounded-full" style={{ width: `${percent}%` }}></div>
                                </div>
                                <span className="font-medium text-gray-900 ml-2 whitespace-nowrap tabular-nums">{count} — {percent.toFixed(0)}%</span>
                            </div>
                        );
                    })}
                {Object.values(ageGroups).every(v => v === 0) && (
                    <p className="text-xs text-gray-400">Нет данных о возрасте</p>
                )}
            </div>
        </div>
    );
};

/** Секция: топ городов */
const CitiesSection: React.FC<{ topCities: ViewersStats['topCities']; uniqueCount: number }> = ({ topCities, uniqueCount }) => {
    return (
        <div className="flex-1 min-w-[180px]">
            <p className="text-xs text-gray-400 font-bold uppercase mb-3">Топ городов</p>
            <div className="space-y-1.5">
                {topCities.length > 0 ? (
                    topCities.map(([city, count], i) => {
                        const cityPercent = uniqueCount > 0 ? (count / uniqueCount) * 100 : 0;
                        return (
                            <div key={city} className="flex items-center justify-between text-sm">
                                <span className="text-gray-600 truncate flex-1">{i + 1}. {city}</span>
                                <span className="font-medium text-gray-900 ml-2 whitespace-nowrap">{count} — {cityPercent.toFixed(0)}%</span>
                            </div>
                        );
                    })
                ) : (
                    <p className="text-xs text-gray-400">Нет данных о городах</p>
                )}
            </div>
        </div>
    );
};

/** Секция: платформа (кольцевая диаграмма) */
const PlatformSection: React.FC<{ platform: ViewersStats['platform'] }> = ({ platform }) => {
    const platformsData = [
        { key: 'android', label: 'Android', count: platform.android, color: '#22c55e', tailwind: 'bg-green-500' },
        { key: 'iphone', label: 'iPhone', count: platform.iphone, tailwind: 'bg-gray-800', color: '#1f2937' },
        { key: 'ipad', label: 'iPad', count: platform.ipad, tailwind: 'bg-gray-500', color: '#6b7280' },
        { key: 'web', label: 'Web', count: platform.web, tailwind: 'bg-blue-400', color: '#60a5fa' },
        { key: 'other', label: 'Другое', count: platform.other, tailwind: 'bg-gray-300', color: '#d1d5db' },
    ].filter(p => p.count > 0);
    const totalPlatform = platformsData.reduce((a, b) => a + b.count, 0);
    
    if (totalPlatform === 0) return (
        <div className="flex-1 min-w-[220px]">
            <p className="text-xs text-gray-400 font-bold uppercase mb-3">Платформа</p>
            <p className="text-xs text-gray-400">Нет данных</p>
        </div>
    );
    
    const radius = 52;
    const circumference = 2 * Math.PI * radius;
    let cumulativeOffset = 0;
    const segments = platformsData.map(p => {
        const percent = p.count / totalPlatform;
        const dashLength = percent * circumference;
        const offset = cumulativeOffset;
        cumulativeOffset += dashLength;
        return { ...p, percent, dashLength, offset };
    });

    return (
        <div className="flex-1 min-w-[220px]">
            <p className="text-xs text-gray-400 font-bold uppercase mb-3">Платформа</p>
            <div className="flex items-center gap-4">
                {/* SVG Donut */}
                <div className="relative w-28 h-28 shrink-0">
                    <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
                        <circle cx="60" cy="60" r={radius} fill="none" stroke="#f3f4f6" strokeWidth="14" />
                        {segments.map(seg => (
                            <circle
                                key={seg.key}
                                cx="60" cy="60" r={radius}
                                fill="none"
                                stroke={seg.color}
                                strokeWidth="14"
                                strokeDasharray={`${seg.dashLength} ${circumference - seg.dashLength}`}
                                strokeDashoffset={-seg.offset}
                                strokeLinecap="butt"
                                className="transition-all duration-700"
                            />
                        ))}
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-sm font-bold text-gray-700 tabular-nums">{totalPlatform}</span>
                    </div>
                </div>
                {/* Легенда */}
                <div className="space-y-1">
                    {segments.map(seg => (
                        <div key={seg.key} className="flex items-center gap-1.5 text-xs whitespace-nowrap">
                            <span className={`w-2 h-2 rounded-full ${seg.tailwind} shrink-0`}></span>
                            <span className="text-gray-600">{seg.label}</span>
                            <span className="font-medium text-gray-900 tabular-nums">{(seg.percent * 100).toFixed(0)}%</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

/** Карточка #8: Демография зрителей (полноширинная) */
export const DemographicsCard: React.FC<DemographicsCardProps> = ({ viewersStats, animationClass, animationStyle }) => {
    return (
        <div className={`col-span-full bg-white rounded-3xl p-6 border border-gray-200 shadow-sm hover:border-purple-300 transition-colors ${animationClass}`} style={animationStyle}>
            <div className="flex justify-between items-start mb-6">
                <div>
                    <p className="text-gray-500 text-sm font-semibold">Уникальные зрители</p>
                    <h3 className="text-3xl font-bold text-gray-900 mt-1">
                        <AnimatedCounter value={viewersStats.uniqueCount} duration={1500} />
                    </h3>
                </div>
                <div className="p-2 bg-purple-50 rounded-xl">
                    <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                </div>
            </div>
            
            {viewersStats.uniqueCount > 0 ? (
                <div className="flex flex-wrap gap-6">
                    <GenderSection gender={viewersStats.gender} />
                    <MembershipSection membership={viewersStats.membership} />
                    <AgeSection ageGroups={viewersStats.ageGroups} />
                    <CitiesSection topCities={viewersStats.topCities} uniqueCount={viewersStats.uniqueCount} />
                    <PlatformSection platform={viewersStats.platform} />
                </div>
            ) : (
                <div className="text-center py-6">
                    <p className="text-gray-400 text-sm">Нет данных о зрителях. Нажмите "Обновить список" для загрузки.</p>
                </div>
            )}
        </div>
    );
};
