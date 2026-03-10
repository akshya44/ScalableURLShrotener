import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Copy, ExternalLink, QrCode, Trash2, Edit2, BarChart2, Check, Lock, Clock } from 'lucide-react';
import QRCodeModal from './QRCodeModal';
import { deleteUrl, editUrl } from '../services/api';

const STATUS_COLORS = {
    active: 'status-active',
    expired: 'status-expired',
    disabled: 'status-disabled',
};

const UrlCard = ({ url, onRefresh }) => {
    const [copied, setCopied] = useState(false);
    const [showQR, setShowQR] = useState(false);
    const [editing, setEditing] = useState(false);
    const [newExpiry, setNewExpiry] = useState(url.expiry_date?.slice(0, 16) || '');
    const [saving, setSaving] = useState(false);
    const navigate = useNavigate();

    const shortUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/${url.short_code}`;

    const copy = async () => {
        await navigator.clipboard.writeText(shortUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDelete = async () => {
        if (!confirm('Disable this link?')) return;
        await deleteUrl(url.id);
        onRefresh();
    };

    const handleSaveEdit = async () => {
        setSaving(true);
        try {
            await editUrl(url.id, { expiry_date: newExpiry || null });
            setEditing(false);
            onRefresh();
        } finally {
            setSaving(false);
        }
    };

    const truncate = (str, n) => str.length > n ? str.slice(0, n) + '...' : str;

    return (
        <div className={`url-card ${url.status !== 'active' ? 'url-card-inactive' : ''}`}>
            <div className="url-card-header">
                <div className="url-info">
                    <div className="short-url-row">
                        <a href={shortUrl} target="_blank" rel="noopener noreferrer" className="short-url">
                            {shortUrl}
                        </a>
                        <span className={`status-badge ${STATUS_COLORS[url.status] || 'status-active'}`}>
                            {url.status}
                        </span>
                        {url.is_password_protected ? <Lock size={14} className="icon-lock" /> : null}
                    </div>
                    <p className="original-url" title={url.original_url}>{truncate(url.original_url, 60)}</p>

                    {(url.title || url.description) && (
                        <div className="link-preview">
                            {url.image && (
                                <img src={url.image} alt={url.title || 'Preview'} className="preview-image" />
                            )}
                            <div className="preview-content">
                                {url.title && <h4 className="preview-title">{truncate(url.title, 55)}</h4>}
                                {url.description && <p className="preview-desc">{truncate(url.description, 90)}</p>}
                            </div>
                        </div>
                    )}
                </div>
                <div className="url-meta">
                    <span className="click-count"><BarChart2 size={14} /> {url.click_count} clicks</span>
                    {url.expiry_date && (
                        <span className="expiry-date"><Clock size={14} /> {new Date(url.expiry_date).toLocaleDateString()}</span>
                    )}
                </div>
            </div>

            {editing && (
                <div className="edit-row">
                    <label className="edit-label">New expiry:</label>
                    <input
                        type="datetime-local"
                        value={newExpiry}
                        onChange={(e) => setNewExpiry(e.target.value)}
                        className="edit-input"
                    />
                    <button className="btn btn-sm btn-primary" onClick={handleSaveEdit} disabled={saving}>
                        {saving ? 'Saving...' : 'Save'}
                    </button>
                    <button className="btn btn-sm btn-ghost" onClick={() => setEditing(false)}>Cancel</button>
                </div>
            )}

            <div className="url-card-actions">
                <button className="action-btn" onClick={copy} title="Copy">
                    {copied ? <Check size={15} color="#10b981" /> : <Copy size={15} />}
                </button>
                <a className="action-btn" href={shortUrl} target="_blank" rel="noopener noreferrer" title="Open">
                    <ExternalLink size={15} />
                </a>
                <button className="action-btn" onClick={() => setShowQR(true)} title="QR Code">
                    <QrCode size={15} />
                </button>
                <button className="action-btn" onClick={() => navigate(`/analytics?code=${url.short_code}`)} title="Analytics">
                    <BarChart2 size={15} />
                </button>
                <button className="action-btn" onClick={() => setEditing(!editing)} title="Edit">
                    <Edit2 size={15} />
                </button>
                <button className="action-btn action-btn-danger" onClick={handleDelete} title="Disable">
                    <Trash2 size={15} />
                </button>
            </div>

            {showQR && (
                <QRCodeModal url={shortUrl} shortCode={url.short_code} onClose={() => setShowQR(false)} />
            )}
        </div>
    );
};

export default UrlCard;
