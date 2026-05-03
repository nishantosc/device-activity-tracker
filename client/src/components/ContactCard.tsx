import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Square, Activity, Wifi, Smartphone, Monitor, MessageCircle } from 'lucide-react';
import clsx from 'clsx';

type Platform = 'whatsapp' | 'signal';

interface TrackerData {
    rtt: number;
    avg: number;
    median: number;
    threshold: number;
    state: string;
    timestamp: number;
}

interface DeviceInfo {
    jid: string;
    state: string;
    rtt: number;
    avg: number;
}

interface ContactCardProps {
    jid: string;
    displayNumber: string;
    data: TrackerData[];
    devices: DeviceInfo[];
    deviceCount: number;
    presence: string | null;
    profilePic: string | null;
    onRemove: () => void;
    privacyMode?: boolean;
    platform?: Platform;
}

export function ContactCard({
    displayNumber,
    data,
    devices,
    deviceCount,
    presence,
    profilePic,
    onRemove,
    privacyMode = false,
    platform = 'whatsapp'
}: ContactCardProps) {
    const lastData = data[data.length - 1];
    const currentStatus = devices.length > 0
        ? (devices.find(d => d.state === 'OFFLINE')?.state ||
            devices.find(d => d.state.includes('Online'))?.state ||
            devices[0].state)
        : 'Unknown';

    const blurredNumber = privacyMode ? displayNumber.replace(/\d/g, '•') : displayNumber;

    return (
        <div className="bg-slate-950/80 rounded-2xl shadow-xl border border-slate-700 overflow-hidden">
            <div className="bg-slate-900/90 border-b border-slate-700 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <span className={clsx(
                        'px-2 py-1 rounded text-xs font-medium flex items-center gap-1',
                        platform === 'whatsapp' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-sky-500/20 text-sky-300'
                    )}>
                        <MessageCircle size={12} />
                        {platform === 'whatsapp' ? 'WhatsApp' : 'Signal'}
                    </span>
                    <h3 className="text-lg font-semibold text-slate-100">{blurredNumber}</h3>
                </div>
                <button
                    onClick={onRemove}
                    className="px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-500 flex items-center gap-2 font-medium transition-colors text-sm"
                >
                    <Square size={16} /> Stop
                </button>
            </div>

            <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-slate-900/80 p-6 rounded-xl border border-slate-700 flex flex-col items-center text-center">
                        <div className="relative mb-4">
                            <div className="w-32 h-32 rounded-full overflow-hidden bg-slate-800 border-4 border-slate-700 shadow-md">
                                {profilePic ? (
                                    <img
                                        src={profilePic}
                                        alt="Profile"
                                        className={clsx('w-full h-full object-cover transition-all duration-200', privacyMode && 'blur-xl scale-110')}
                                        style={privacyMode ? { filter: 'blur(16px) contrast(0.8)' } : {}}
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-500">No Image</div>
                                )}
                            </div>
                            <div
                                className={clsx(
                                    'absolute bottom-2 right-2 w-6 h-6 rounded-full border-2 border-slate-900',
                                    currentStatus === 'OFFLINE' ? 'bg-rose-500' : currentStatus.includes('Online') ? 'bg-emerald-500' : 'bg-slate-500'
                                )}
                            />
                        </div>

                        <h4 className="text-xl font-bold text-slate-100 mb-1">{blurredNumber}</h4>

                        <div className="flex items-center gap-2 mb-4">
                            <span
                                className={clsx(
                                    'px-3 py-1 rounded-full text-sm font-medium',
                                    currentStatus === 'OFFLINE'
                                        ? 'bg-rose-500/20 text-rose-300'
                                        : currentStatus.includes('Online')
                                            ? 'bg-emerald-500/20 text-emerald-300'
                                            : currentStatus === 'Standby'
                                                ? 'bg-amber-500/20 text-amber-300'
                                                : 'bg-slate-700 text-slate-300'
                                )}
                            >
                                {currentStatus}
                            </span>
                        </div>

                        <div className="w-full pt-4 border-t border-slate-700 space-y-2">
                            <div className="flex justify-between items-center text-sm text-slate-300">
                                <span className="flex items-center gap-1"><Wifi size={16} /> Official Status</span>
                                <span className="font-medium">{presence || 'Unknown'}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm text-slate-300">
                                <span className="flex items-center gap-1"><Smartphone size={16} /> Devices</span>
                                <span className="font-medium">{deviceCount || 0}</span>
                            </div>
                        </div>

                        {devices.length > 0 && (
                            <div className="w-full pt-4 border-t border-slate-700 mt-4">
                                <h5 className="text-xs font-semibold text-slate-400 uppercase mb-2">Device States</h5>
                                <div className="space-y-1">
                                    {devices.map((device, idx) => (
                                        <div key={device.jid} className="flex items-center justify-between text-sm py-1">
                                            <div className="flex items-center gap-2">
                                                <Monitor size={14} className="text-slate-400" />
                                                <span className="text-slate-300">Device {idx + 1}</span>
                                            </div>
                                            <span
                                                className={clsx(
                                                    'px-2 py-0.5 rounded text-xs font-medium',
                                                    device.state === 'OFFLINE'
                                                        ? 'bg-rose-500/20 text-rose-300'
                                                        : device.state.includes('Online')
                                                            ? 'bg-emerald-500/20 text-emerald-300'
                                                            : device.state === 'Standby'
                                                                ? 'bg-amber-500/20 text-amber-300'
                                                                : 'bg-slate-700 text-slate-300'
                                                )}
                                            >
                                                {device.state}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="md:col-span-2 space-y-6">
                        <div className="grid grid-cols-3 gap-4">
                            <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-700">
                                <div className="text-sm text-slate-400 mb-1 flex items-center gap-1"><Activity size={16} /> Current Avg RTT</div>
                                <div className="text-2xl font-bold text-slate-100">{lastData?.avg.toFixed(0) || '-'} ms</div>
                            </div>
                            <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-700">
                                <div className="text-sm text-slate-400 mb-1">Median (50)</div>
                                <div className="text-2xl font-bold text-slate-100">{lastData?.median.toFixed(0) || '-'} ms</div>
                            </div>
                            <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-700">
                                <div className="text-sm text-slate-400 mb-1">Threshold</div>
                                <div className="text-2xl font-bold text-cyan-300">{lastData?.threshold.toFixed(0) || '-'} ms</div>
                            </div>
                        </div>

                        <div className="bg-slate-900/80 p-6 rounded-xl border border-slate-700 h-[300px]">
                            <h5 className="text-sm font-medium text-slate-400 mb-4">RTT History & Threshold</h5>
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={data}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
                                    <XAxis dataKey="timestamp" hide />
                                    <YAxis domain={['auto', 'auto']} stroke="#94a3b8" />
                                    <Tooltip
                                        labelFormatter={(t: any) => new Date(Number(t)).toLocaleTimeString()}
                                        contentStyle={{
                                            borderRadius: '8px',
                                            border: '1px solid #334155',
                                            background: '#020617',
                                            color: '#e2e8f0'
                                        }}
                                    />
                                    <Line type="monotone" dataKey="avg" stroke="#22d3ee" strokeWidth={2} dot={false} name="Avg RTT" isAnimationActive={false} />
                                    <Line type="step" dataKey="threshold" stroke="#fb7185" strokeDasharray="5 5" dot={false} name="Threshold" isAnimationActive={false} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
