import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { ConnectionState } from '../App';
import { CheckCircle, Shield, Smartphone } from 'lucide-react';

interface LoginProps {
    connectionState: ConnectionState;
}

export function Login({ connectionState }: LoginProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-950/85 p-8 rounded-2xl border border-emerald-500/30 shadow-[0_0_30px_rgba(16,185,129,0.12)]">
                <div className="flex items-center gap-2 mb-6">
                    <Shield className="text-emerald-300" size={20} />
                    <h2 className="text-2xl font-semibold text-emerald-100">Connect WhatsApp Node</h2>
                    {connectionState.whatsapp && <CheckCircle className="text-emerald-400" size={20} />}
                </div>
                {connectionState.whatsapp ? (
                    <div className="w-64 h-64 mx-auto flex flex-col items-center justify-center text-emerald-300 bg-emerald-950/30 rounded-lg border border-emerald-700/50">
                        <CheckCircle size={52} className="mb-4" />
                        <span className="text-lg font-medium">Connected</span>
                    </div>
                ) : (
                    <>
                        <div className="bg-slate-900 p-4 rounded-lg mb-6 border border-slate-700 w-fit mx-auto">
                            {connectionState.whatsappQr ? (
                                <QRCodeSVG value={connectionState.whatsappQr} size={256} />
                            ) : (
                                <div className="w-64 h-64 flex items-center justify-center text-slate-500">Waiting for QR Code...</div>
                            )}
                        </div>
                        <p className="text-slate-300 text-center">Scan using WhatsApp {'>'} Settings {'>'} Linked Devices.</p>
                    </>
                )}
            </div>

            <div className="bg-slate-950/85 p-8 rounded-2xl border border-sky-500/30 shadow-[0_0_30px_rgba(14,165,233,0.12)]">
                <div className="flex items-center gap-2 mb-6">
                    <Smartphone className="text-sky-300" size={20} />
                    <h2 className="text-2xl font-semibold text-sky-100">Connect Signal Node</h2>
                    {connectionState.signal && <CheckCircle className="text-sky-400" size={20} />}
                </div>
                {connectionState.signal ? (
                    <div className="w-64 h-64 mx-auto flex flex-col items-center justify-center text-sky-300 bg-sky-950/30 rounded-lg border border-sky-700/50">
                        <CheckCircle size={52} className="mb-3" />
                        <span className="text-lg font-medium">Connected</span>
                        <span className="text-sm mt-2 text-sky-200">{connectionState.signalNumber}</span>
                    </div>
                ) : connectionState.signalApiAvailable ? (
                    <>
                        <div className="bg-slate-900 p-4 rounded-lg mb-6 border border-slate-700 w-fit mx-auto">
                            {connectionState.signalQrImage ? (
                                <img src={connectionState.signalQrImage} alt="Signal QR Code" width={256} height={256} className="bg-white" />
                            ) : (
                                <div className="w-64 h-64 flex items-center justify-center text-slate-500">Waiting for QR Code...</div>
                            )}
                        </div>
                        <p className="text-slate-300 text-center">Scan using Signal {'>'} Settings {'>'} Linked Devices.</p>
                    </>
                ) : (
                    <div className="w-64 h-64 mx-auto flex flex-col items-center justify-center text-slate-400 bg-slate-900 rounded-lg border border-slate-700">
                        <p className="text-center px-4">Signal API not available.</p>
                        <p className="text-xs text-center px-4 mt-2">Start signal-cli-rest-api container to enable node pairing.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
