import React, { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { ShieldCheck, Wifi, WifiOff, MessageCircle, Radio } from 'lucide-react';
import { Login } from './components/Login';
import { Dashboard } from './components/Dashboard';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';
export const socket: Socket = io(API_URL, { autoConnect: false });

export type Platform = 'whatsapp' | 'signal';

export interface ConnectionState {
    whatsapp: boolean;
    signal: boolean;
    signalNumber: string | null;
    signalApiAvailable: boolean;
    signalQrImage: string | null;
    whatsappQr: string | null;
}

function App() {
    const [isConnected, setIsConnected] = useState(socket.connected);
    const [connectionState, setConnectionState] = useState<ConnectionState>({
        whatsapp: false,
        signal: false,
        signalNumber: null,
        signalApiAvailable: false,
        signalQrImage: null,
        whatsappQr: null
    });

    const isAnyPlatformReady = connectionState.whatsapp || connectionState.signal;

    useEffect(() => {
        function onConnect() {
            setIsConnected(true);
        }

        function onDisconnect() {
            setIsConnected(false);
            setConnectionState({
                whatsapp: false,
                signal: false,
                signalNumber: null,
                signalApiAvailable: false,
                signalQrImage: null,
                whatsappQr: null
            });
        }

        function onWhatsAppConnectionOpen() {
            setConnectionState(prev => ({ ...prev, whatsapp: true, whatsappQr: null }));
        }

        function onWhatsAppQr(qr: string) {
            setConnectionState(prev => ({ ...prev, whatsappQr: qr }));
        }

        function onSignalConnectionOpen(data: { number: string }) {
            setConnectionState(prev => ({
                ...prev,
                signal: true,
                signalNumber: data.number
            }));
        }

        function onSignalDisconnected() {
            setConnectionState(prev => ({
                ...prev,
                signal: false,
                signalNumber: null
            }));
        }

        function onSignalApiStatus(data: { available: boolean }) {
            setConnectionState(prev => ({ ...prev, signalApiAvailable: data.available }));
        }

        function onSignalQrImage(url: string) {
            setConnectionState(prev => ({ ...prev, signalQrImage: url }));
        }

        socket.on('connect', onConnect);
        socket.on('disconnect', onDisconnect);
        socket.on('qr', onWhatsAppQr);
        socket.on('connection-open', onWhatsAppConnectionOpen);
        socket.on('signal-connection-open', onSignalConnectionOpen);
        socket.on('signal-disconnected', onSignalDisconnected);
        socket.on('signal-api-status', onSignalApiStatus);
        socket.on('signal-qr-image', onSignalQrImage);

        if (!socket.connected) {
            socket.connect();
        }

        return () => {
            socket.off('connect', onConnect);
            socket.off('disconnect', onDisconnect);
            socket.off('qr', onWhatsAppQr);
            socket.off('connection-open', onWhatsAppConnectionOpen);
            socket.off('signal-connection-open', onSignalConnectionOpen);
            socket.off('signal-disconnected', onSignalDisconnected);
            socket.off('signal-api-status', onSignalApiStatus);
            socket.off('signal-qr-image', onSignalQrImage);
        };
    }, []);

    return (
        <div className="min-h-screen bg-[#020617] text-slate-100 p-6 md:p-8">
            <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(20,184,166,0.18),transparent_40%),radial-gradient(circle_at_85%_10%,rgba(99,102,241,0.18),transparent_35%),radial-gradient(circle_at_70%_80%,rgba(14,165,233,0.12),transparent_45%)]" />
            <div className="relative max-w-7xl mx-auto space-y-6">
                <header className="rounded-2xl border border-cyan-500/30 bg-slate-950/80 backdrop-blur-md p-5 md:p-6 shadow-[0_0_30px_rgba(8,145,178,0.12)]">
                    <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                        <div>
                            <p className="text-xs uppercase tracking-[0.3em] text-cyan-300/80">Nishant Iyer Intelligence Suite</p>
                            <h1 className="text-3xl md:text-4xl font-semibold flex items-center gap-3">
                                <ShieldCheck className="text-cyan-300" />
                                RTT Security Analysis Command Center
                            </h1>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div className="rounded-xl border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm flex items-center gap-2">
                                {isConnected ? <Wifi className="text-emerald-400" size={16} /> : <WifiOff className="text-red-400" size={16} />}
                                <span>{isConnected ? 'Server Connected' : 'Server Offline'}</span>
                            </div>
                            <div className="rounded-xl border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm flex items-center gap-2">
                                <MessageCircle size={16} className={connectionState.whatsapp ? 'text-emerald-400' : 'text-amber-300'} />
                                <span>{connectionState.whatsapp ? 'WhatsApp Ready' : 'WhatsApp Idle'}</span>
                            </div>
                            <div className="rounded-xl border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm flex items-center gap-2">
                                <Radio size={16} className={connectionState.signal ? 'text-sky-300' : 'text-amber-300'} />
                                <span>{connectionState.signal ? 'Signal Ready' : 'Signal Idle'}</span>
                            </div>
                        </div>
                    </div>
                </header>

                <main>
                    {!isAnyPlatformReady ? (
                        <Login connectionState={connectionState} />
                    ) : (
                        <Dashboard connectionState={connectionState} />
                    )}
                </main>
            </div>
        </div>
    );
}

export default App;
