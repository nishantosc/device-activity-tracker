import React, { useEffect, useMemo, useState } from 'react';
import {
    Eye,
    EyeOff,
    Plus,
    Trash2,
    Zap,
    MessageCircle,
    Settings,
    Download,
    Radar,
    ScanSearch,
    Brain,
    FileCode,
    Shield,
    Bot,
    BarChart3
} from 'lucide-react';
import { socket, Platform, ConnectionState } from '../App';
import { ContactCard } from './ContactCard';
import { Login } from './Login';

type ProbeMethod = 'delete' | 'reaction';

interface DashboardProps {
    connectionState: ConnectionState;
}

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

interface ContactInfo {
    jid: string;
    displayNumber: string;
    contactName: string;
    data: TrackerData[];
    devices: DeviceInfo[];
    deviceCount: number;
    presence: string | null;
    profilePic: string | null;
    platform: Platform;
}

const mockModules = [
    { label: 'Graph Correlation Engine', status: 'Calibrating', icon: BarChart3 },
    { label: 'OSINT Identity Linker', status: 'Passive Collection', icon: ScanSearch },
    { label: 'Behavior Signature Model', status: 'Awaiting Samples', icon: Brain },
    { label: 'Threat Actor Replay Sandbox', status: 'Armed', icon: Shield }
];

export function Dashboard({ connectionState }: DashboardProps) {
    const [inputNumber, setInputNumber] = useState('');
    const [selectedPlatform, setSelectedPlatform] = useState<Platform>(
        connectionState.whatsapp ? 'whatsapp' : 'signal'
    );
    const [contacts, setContacts] = useState<Map<string, ContactInfo>>(new Map());
    const [error, setError] = useState<string | null>(null);
    const [privacyMode, setPrivacyMode] = useState(false);
    const [probeMethod, setProbeMethod] = useState<ProbeMethod>('delete');
    const [showConnections, setShowConnections] = useState(false);

    useEffect(() => {
        function onTrackerUpdate(update: any) {
            const { jid, ...data } = update;
            if (!jid) return;

            setContacts(prev => {
                const next = new Map(prev);
                const contact = next.get(jid);

                if (contact) {
                    const updatedContact = { ...contact };

                    if (data.presence !== undefined) {
                        updatedContact.presence = data.presence;
                    }
                    if (data.deviceCount !== undefined) {
                        updatedContact.deviceCount = data.deviceCount;
                    }
                    if (data.devices !== undefined) {
                        updatedContact.devices = data.devices;
                    }

                    if (data.median !== undefined && data.devices && data.devices.length > 0) {
                        const newDataPoint: TrackerData = {
                            rtt: data.devices[0].rtt,
                            avg: data.devices[0].avg,
                            median: data.median,
                            threshold: data.threshold,
                            state: data.devices.find((d: DeviceInfo) => d.state.includes('Online'))?.state || data.devices[0].state,
                            timestamp: Date.now(),
                        };
                        updatedContact.data = [...updatedContact.data, newDataPoint];
                    }

                    next.set(jid, updatedContact);
                }

                return next;
            });
        }

        function onProfilePic(data: { jid: string; url: string | null }) {
            setContacts(prev => {
                const next = new Map(prev);
                const contact = next.get(data.jid);
                if (contact) {
                    next.set(data.jid, { ...contact, profilePic: data.url });
                }
                return next;
            });
        }

        function onContactName(data: { jid: string; name: string }) {
            setContacts(prev => {
                const next = new Map(prev);
                const contact = next.get(data.jid);
                if (contact) {
                    next.set(data.jid, { ...contact, contactName: data.name });
                }
                return next;
            });
        }

        function onContactAdded(data: { jid: string; number: string; platform?: Platform }) {
            setContacts(prev => {
                const next = new Map(prev);
                next.set(data.jid, {
                    jid: data.jid,
                    displayNumber: data.number,
                    contactName: data.number,
                    data: [],
                    devices: [],
                    deviceCount: 0,
                    presence: null,
                    profilePic: null,
                    platform: data.platform || 'whatsapp'
                });
                return next;
            });
            setInputNumber('');
        }

        function onContactRemoved(jid: string) {
            setContacts(prev => {
                const next = new Map(prev);
                next.delete(jid);
                return next;
            });
        }

        function onError(data: { jid?: string; message: string }) {
            setError(data.message);
            setTimeout(() => setError(null), 3000);
        }

        function onProbeMethod(method: ProbeMethod) {
            setProbeMethod(method);
        }

        function onTrackedContacts(connectedContacts: { id: string; platform: Platform }[]) {
            setContacts(prev => {
                const next = new Map(prev);
                connectedContacts.forEach(({ id, platform }) => {
                    if (!next.has(id)) {
                        const displayNumber = platform === 'signal' ? id.replace('signal:', '') : id.split('@')[0];
                        next.set(id, {
                            jid: id,
                            displayNumber,
                            contactName: displayNumber,
                            data: [],
                            devices: [],
                            deviceCount: 0,
                            presence: null,
                            profilePic: null,
                            platform
                        });
                    }
                });
                return next;
            });
        }

        socket.on('tracker-update', onTrackerUpdate);
        socket.on('profile-pic', onProfilePic);
        socket.on('contact-name', onContactName);
        socket.on('contact-added', onContactAdded);
        socket.on('contact-removed', onContactRemoved);
        socket.on('error', onError);
        socket.on('probe-method', onProbeMethod);
        socket.on('tracked-contacts', onTrackedContacts);

        socket.emit('get-tracked-contacts');

        return () => {
            socket.off('tracker-update', onTrackerUpdate);
            socket.off('profile-pic', onProfilePic);
            socket.off('contact-name', onContactName);
            socket.off('contact-added', onContactAdded);
            socket.off('contact-removed', onContactRemoved);
            socket.off('error', onError);
            socket.off('probe-method', onProbeMethod);
            socket.off('tracked-contacts', onTrackedContacts);
        };
    }, []);

    const handleAdd = () => {
        if (!inputNumber) return;
        socket.emit('add-contact', { number: inputNumber, platform: selectedPlatform });
    };

    const handleRemove = (jid: string) => {
        socket.emit('remove-contact', jid);
    };

    const handleProbeMethodChange = (method: ProbeMethod) => {
        socket.emit('set-probe-method', method);
    };

    const totalDevices = useMemo(
        () => Array.from(contacts.values()).reduce((sum, contact) => sum + (contact.deviceCount || 0), 0),
        [contacts]
    );

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
                <div className="xl:col-span-2 rounded-2xl border border-cyan-500/30 bg-slate-950/80 p-5 shadow-[0_0_30px_rgba(6,182,212,0.12)]">
                    <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
                        <div>
                            <h2 className="text-xl font-semibold text-cyan-100">Live Target Intake</h2>
                            <p className="text-sm text-slate-400">Mock analyst tooling with real-time RTT stream retained.</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setShowConnections(!showConnections)}
                                className="px-3 py-2 text-sm font-medium rounded-lg bg-slate-800 text-slate-100 border border-slate-700 hover:border-cyan-400/50 flex items-center gap-2"
                            >
                                <Settings size={14} />
                                {showConnections ? 'Hide Connections' : 'Manage Connections'}
                            </button>
                            <button
                                className="px-3 py-2 text-sm font-medium rounded-lg bg-indigo-900/40 text-indigo-200 border border-indigo-500/40 hover:border-indigo-400 flex items-center gap-2"
                                title="Mock export action for model injection workflows"
                            >
                                <Download size={14} />
                                Export HuggingFace Injection CSV
                            </button>
                        </div>
                    </div>

                    <div className="flex flex-col lg:flex-row gap-4">
                        <div className="flex rounded-lg overflow-hidden border border-slate-700">
                            <button
                                onClick={() => setSelectedPlatform('whatsapp')}
                                disabled={!connectionState.whatsapp}
                                className={`px-4 py-2 text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                                    selectedPlatform === 'whatsapp'
                                        ? 'bg-emerald-600 text-white'
                                        : connectionState.whatsapp
                                            ? 'bg-slate-900 text-slate-300 hover:bg-slate-800'
                                            : 'bg-slate-900 text-slate-500 cursor-not-allowed'
                                }`}
                            >
                                <MessageCircle size={16} /> WhatsApp
                            </button>
                            <button
                                onClick={() => setSelectedPlatform('signal')}
                                disabled={!connectionState.signal}
                                className={`px-4 py-2 text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                                    selectedPlatform === 'signal'
                                        ? 'bg-sky-600 text-white'
                                        : connectionState.signal
                                            ? 'bg-slate-900 text-slate-300 hover:bg-slate-800'
                                            : 'bg-slate-900 text-slate-500 cursor-not-allowed'
                                }`}
                            >
                                <Radar size={16} /> Signal
                            </button>
                        </div>
                        <input
                            type="text"
                            placeholder="Enter phone number (e.g. 491701234567)"
                            className="flex-1 px-4 py-2 border border-slate-700 rounded-lg bg-slate-900 text-slate-100 focus:ring-2 focus:ring-cyan-500 outline-none"
                            value={inputNumber}
                            onChange={(e) => setInputNumber(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleAdd()}
                        />
                        <button
                            onClick={handleAdd}
                            className="px-6 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-500 flex items-center gap-2 font-medium transition-colors"
                        >
                            <Plus size={20} /> Add Contact
                        </button>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-3 items-center">
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-slate-300">Probe Method:</span>
                            <div className="flex rounded-lg overflow-hidden border border-slate-700">
                                <button
                                    onClick={() => handleProbeMethodChange('delete')}
                                    className={`px-3 py-1.5 text-sm font-medium flex items-center gap-1 ${
                                        probeMethod === 'delete' ? 'bg-fuchsia-600 text-white' : 'bg-slate-900 text-slate-300'
                                    }`}
                                >
                                    <Trash2 size={14} /> Delete
                                </button>
                                <button
                                    onClick={() => handleProbeMethodChange('reaction')}
                                    className={`px-3 py-1.5 text-sm font-medium flex items-center gap-1 ${
                                        probeMethod === 'reaction' ? 'bg-amber-500 text-slate-900' : 'bg-slate-900 text-slate-300'
                                    }`}
                                >
                                    <Zap size={14} /> Reaction
                                </button>
                            </div>
                        </div>

                        <button
                            onClick={() => setPrivacyMode(!privacyMode)}
                            className={`px-4 py-2 rounded-lg flex items-center gap-2 font-medium ${
                                privacyMode
                                    ? 'bg-emerald-700 text-white hover:bg-emerald-600'
                                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                            }`}
                        >
                            {privacyMode ? <EyeOff size={18} /> : <Eye size={18} />}
                            {privacyMode ? 'Privacy ON' : 'Privacy OFF'}
                        </button>

                        <p className="text-xs text-slate-400">Attribution: Nishant Iyer • Advanced mock intelligence controls.</p>
                    </div>

                    {error && <p className="mt-2 text-red-400 text-sm">{error}</p>}
                </div>

                <div className="rounded-2xl border border-slate-700 bg-slate-950/80 p-5 space-y-3">
                    <h3 className="font-semibold text-slate-100 flex items-center gap-2"><Bot size={16} className="text-violet-300" /> Mock Security Modules</h3>
                    {mockModules.map(module => (
                        <div key={module.label} className="rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 flex justify-between items-center">
                            <div className="flex items-center gap-2 text-sm text-slate-200">
                                <module.icon size={14} className="text-cyan-300" />
                                <span>{module.label}</span>
                            </div>
                            <span className="text-xs text-slate-400">{module.status}</span>
                        </div>
                    ))}
                    <div className="rounded-lg border border-dashed border-indigo-400/40 p-3 text-xs text-indigo-200 bg-indigo-950/30 flex items-start gap-2">
                        <FileCode size={14} className="mt-0.5" />
                        CSV Schema (Mock): target_id, rtt_avg, rtt_median, threshold, osint_flags, injection_prompt.
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="rounded-xl border border-slate-700 bg-slate-900/90 p-4">
                    <p className="text-slate-400 text-xs uppercase">Tracked Contacts</p>
                    <p className="text-2xl font-semibold text-cyan-200">{contacts.size}</p>
                </div>
                <div className="rounded-xl border border-slate-700 bg-slate-900/90 p-4">
                    <p className="text-slate-400 text-xs uppercase">Observed Devices</p>
                    <p className="text-2xl font-semibold text-cyan-200">{totalDevices}</p>
                </div>
                <div className="rounded-xl border border-slate-700 bg-slate-900/90 p-4">
                    <p className="text-slate-400 text-xs uppercase">Probe Profile</p>
                    <p className="text-2xl font-semibold text-cyan-200">{probeMethod}</p>
                </div>
                <div className="rounded-xl border border-slate-700 bg-slate-900/90 p-4">
                    <p className="text-slate-400 text-xs uppercase">Privacy Mode</p>
                    <p className="text-2xl font-semibold text-cyan-200">{privacyMode ? 'Enabled' : 'Disabled'}</p>
                </div>
            </div>

            {showConnections && <Login connectionState={connectionState} />}

            {contacts.size === 0 ? (
                <div className="rounded-xl p-12 text-center border border-dashed border-slate-600 bg-slate-950/60">
                    <p className="text-slate-300 text-lg">No contacts currently tracked.</p>
                    <p className="text-slate-500 text-sm mt-2">Use intake controls to begin RTT analysis.</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {Array.from(contacts.values()).map(contact => (
                        <ContactCard
                            key={contact.jid}
                            jid={contact.jid}
                            displayNumber={contact.contactName}
                            data={contact.data}
                            devices={contact.devices}
                            deviceCount={contact.deviceCount}
                            presence={contact.presence}
                            profilePic={contact.profilePic}
                            onRemove={() => handleRemove(contact.jid)}
                            privacyMode={privacyMode}
                            platform={contact.platform}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
