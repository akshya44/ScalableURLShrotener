import React, { useRef, useState } from 'react';
import QRCode from 'react-qr-code';
import { X, Download } from 'lucide-react';

const QRCodeModal = ({ url, shortCode, onClose }) => {
    const qrRef = useRef(null);

    const downloadQR = () => {
        const svg = qrRef.current?.querySelector('svg');
        if (!svg) return;

        const svgData = new XMLSerializer().serializeToString(svg);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
        const url_ = URL.createObjectURL(svgBlob);

        img.onload = () => {
            canvas.width = 300;
            canvas.height = 300;
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, 300, 300);
            ctx.drawImage(img, 0, 0, 300, 300);
            URL.revokeObjectURL(url_);
            const pngUrl = canvas.toDataURL('image/png');
            const a = document.createElement('a');
            a.href = pngUrl;
            a.download = `qr-${shortCode}.png`;
            a.click();
        };
        img.src = url_;
    };

    const handleBackdrop = (e) => {
        if (e.target === e.currentTarget) onClose();
    };

    return (
        <div className="modal-backdrop" onClick={handleBackdrop}>
            <div className="modal-card">
                <div className="modal-header">
                    <h3>QR Code</h3>
                    <button className="modal-close" onClick={onClose}><X size={20} /></button>
                </div>
                <div className="modal-body" ref={qrRef}>
                    <QRCode
                        value={url}
                        size={220}
                        fgColor="#0f172a"
                        bgColor="#ffffff"
                        style={{ borderRadius: 8 }}
                    />
                    <p className="qr-url">{url}</p>
                </div>
                <div className="modal-footer">
                    <button className="btn btn-primary" onClick={downloadQR}>
                        <Download size={16} /> Download PNG
                    </button>
                    <button className="btn btn-ghost" onClick={onClose}>Close</button>
                </div>
            </div>
        </div>
    );
};

export default QRCodeModal;
